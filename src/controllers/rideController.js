import Ride from "../models/Ride.js";
import { io } from "../sockets/socket.js";
import { acceptRideService, findNearbyDrivers } from "../services/rideService.js";
import User from "../models/User.js";
import Notification from "../models/Notifications.js";
import RideType from "../models/RideType.js";


export const createRide = async (req, res) => {
  const userId = req.user._id;

  const {
    pickup,
    destination,
    ride,
    useLocation,
    paymentMethod,
  } = req.body;

  const newRide = await Ride.create({
    customer: userId,
    pickup,
    destination,

    pickupCoords: {
      latitude: useLocation.location.latitude,
      longitude: useLocation.location.longitude,
    },

    destinationCoords: {
      latitude: useLocation.destinationCoords.latitude,
      longitude: useLocation.destinationCoords.longitude,
    },

    rideType: {
      id: ride.id,
      name: ride.name,
      price: ride.price,
      seats: ride.seats,
    },

    distanceInMeters: useLocation.distanceInMeters,

    paymentMethod,
    status: "pending",
  });

  await Notification.create({
    userId: userId,
    userType: "customer",
    title: "Finding Driver",
    message: "We are searching for nearby drivers...",
    type: "ride",
    priority: "normal",
    action: "SEARCHING_RIDE",
  });
  
  io.to(`customer_${userId}`).emit("notification:new", {
    title: "Finding Driver",
    message: "We are searching for nearby drivers...",
  });

  //io.emit("ride:new", newRide);

const drivers = await findNearbyDrivers(
  newRide.pickupCoords.longitude,
  newRide.pickupCoords.latitude
);

console.log("🚕 FOUND DRIVERS:", drivers.length);

if (drivers.length === 0) {
  io.to(`customer_${newRide.customer}`).emit("ride:no-drivers");
  
  return res.status(201).json({
    message: "No drivers found",
    ride: newRide,
  });
}

// notify customer searching
io.to(`customer_${newRide.customer}`).emit("ride:searching", {
  message: "Searching for drivers...",
});

let currentIndex = 0;

const tryNextDriver = async () => {
  if (currentIndex >= drivers.length) {
    console.log("❌ No driver accepted");

    io.to(`customer_${newRide.customer}`).emit("ride:no-drivers");

    return;
  }

  const driver = drivers[currentIndex];

  console.log("🚗 Trying driver:", driver._id);

  // 1️⃣ send ride to THIS driver only
  io.to(`driver_${driver._id}`).emit("ride:new", newRide);

  // 2️⃣ send preview to customer
  const driverDetails = await User.findById(driver._id).select(
    "firstName lastName avatar"
  );

  io.to(`customer_${newRide.customer}`).emit("ride:found", {
    rideId: newRide._id,
    driver: {
      _id: driverDetails._id,
      firstName: driverDetails.firstName,
      lastName: driverDetails.lastName,
      avatar: driverDetails.avatar,
    },
  });

  // 3️⃣ wait for acceptance
  setTimeout(async () => {
    const rideCheck = await Ride.findById(newRide._id);

    if (rideCheck.status === "pending") {
      console.log("⏭️ Driver skipped:", driver._id);

      currentIndex++;
      tryNextDriver(); // move to next driver
    } else {
      console.log("✅ Ride accepted, stop dispatch");
    }
  }, 15000);
};

// start dispatch loop
setTimeout(() => {
  tryNextDriver();
}, 500);

//sending to all drivers
  // drivers.forEach((driver) => {
  //   io.to(`driver_${driver._id}`).emit("ride:new", newRide);
  // });

  res.status(201).json({
    message: "Ride created successfully",
    ride: newRide,
  });
};


export const getPendingRides = async (req, res) => {
  const rides = await Ride.find({ status: "pending" }).sort({ createdAt: -1 });

  res.json(rides);
};


export const acceptRide_old = async (req, res) => {
  const driverId = req.user._id;
  const { rideId } = req.body;

  const ride = await acceptRideService(rideId, driverId);

  if (!ride) {
    return res.status(400).json({
      message: "Ride already taken",
    });
  }

  // 🔥 notify customer
  io.to(`customer_${ride.customer}`).emit("ride:accepted", ride);
  io.to(`driver_${driverId}`).emit("ride:status", ride);
  

  res.json({
    message: "Ride accepted",
    ride,
  });
};

export const acceptRide = async (req, res) => {
  const driverId = req.user._id;
  const { rideId } = req.body;

  const ride = await acceptRideService(rideId, driverId);

  if (!ride) {
    return res.status(400).json({
      message: "Ride already taken",
    });
  }

  // 🔥 GET DRIVER DETAILS
  const driver = await User.findById(driverId).select(
    "firstName lastName phone avatar"
  );

  // 🔥 COMBINE DATA
  const payload = {
    ...ride.toObject(),
    driver,
  };

  // 🚀 notify customer with enriched data
  io.to(`customer_${ride.customer}`).emit("ride:accepted", payload);

  // 🚀 notify driver
  io.to(`driver_${driverId}`).emit("ride:status", payload);

  res.json({
    message: "Ride accepted",
    ride: payload,
  });
};


export const updateRideStatus = async (req, res) => {
  const { rideId, status } = req.body;

  const ride = await Ride.findById(rideId);

  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  ride.status = status;
  await ride.save();

  io.to(`customer_${ride.customer}`).emit("ride:status", ride);
  io.to(`driver_${ride.driver}`).emit("ride:status", ride);

  res.json({
    message: "Updated",
    ride,
  });
};


export const getRideTypes = async (req, res) => {
  try {
    const doc = await RideType.findOne(); // or findById if fixed ID

    if (!doc) {
      return res.json([]);
    }

    const activeRideTypes = doc.rideTypes.filter(
      (ride) => ride.isActive === true
    );

    res.json(activeRideTypes);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};