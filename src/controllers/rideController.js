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

    if (rideCheck.status !== "pending") {
      console.log("🛑 Ride no longer active, stop dispatch");
      return;
    }

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

export const getMyRides = async (req, res) => {
  try {
    const userId = req.user._id;

    const { status, page = 1, limit = 10 } = req.query;

    const query = { customer: userId };

    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate("driver", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Ride.countDocuments(query);

    // 🔥 transform data for frontend
    const formattedRides = rides.map((ride) => ({
      id: ride._id,

      pickup: ride.pickup,
      destination: ride.destination,

      distance: (ride.distanceInMeters / 1000).toFixed(1),

      price: ride.rideType?.price || 0,

      date: ride.createdAt,

      duration: "—", // you’ll calculate later when trip ends

      paymentMethod: ride.paymentMethod,

      status:
        ride.status === "accepted"
          ? "active"
          : ride.status, // map backend → frontend

      driver: ride.driver
        ? {
            name: `${ride.driver.firstName} ${ride.driver.lastName}`,
            avatar: ride.driver.avatar || null,
            car: "—",
            plate: "—",
            rating: 5,
          }
        : {
            name: "Searching for driver...",
            avatar: null,
            car: "—",
            plate: "—",
            rating: 0,
          },
    }));

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      rides: formattedRides,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingRides = async (req, res) => {
  const rides = await Ride.find({ status: "pending" }).sort({ createdAt: -1 });

  res.json(rides);
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
    const { distance } = req.query;

    const distanceInKm = parseFloat(
      (distance || "0").replace(/[^\d.]/g, "")
    );

    const rideTypes = await RideType.find({ isActive: true });

    const result = rideTypes.map((ride) => {
      const price =
        ride.basePrice + distanceInKm * ride.pricePerKm;

      return {
        id: ride.id,
        name: ride.name,
        subtitle: ride.subtitle,
        seats: ride.seats,
        image: ride.image,
        basePrice: ride.basePrice,
        pricePerKm: ride.pricePerKm,
        price: Math.round(price),
      };
    });

    return res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelRide = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role; // "customer" or "driver"
    const { rideId, reason } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // ❌ prevent cancelling completed rides
    if (["completed", "cancelled"].includes(ride.status)) {
      return res.status(400).json({
        message: `Ride already ${ride.status}`,
      });
    }

    // ✅ check ownership
    if (
      userRole === "customer" &&
      ride.customer.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (
      userRole === "driver" &&
      ride.driver?.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ update ride
    ride.status = "cancelled";
    ride.cancelledBy = userRole;
    ride.cancelReason = reason || "";
    ride.cancelledAt = new Date();

    await ride.save();

    // 🔥 notify both sides
    io.to(`customer_${ride.customer}`).emit("ride:cancelled", {
      rideId: ride._id,
      cancelledBy: userRole,
      reason: reason || null,
    });

    if (ride.driver) {
      io.to(`driver_${ride.driver}`).emit("ride:cancelled", {
        rideId: ride._id,
        cancelledBy: userRole,
        reason: reason || null,
      });
    }

    return res.json({
      message: "Ride cancelled successfully",
      ride,
    });
  } catch (err) {
    console.log("Cancel ride error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const driverArriving = async (req, res) => {
  const driverId = req.user._id;
  const { rideId } = req.body;

  const ride = await Ride.findById(rideId);

  if (!ride) return res.status(404).json({ message: "Ride not found" });

  ride.status = "arriving";
  await ride.save();

  io.to(`customer_${ride.customer}`).emit("ride:arriving", {
    rideId,
  });

  res.json({ message: "Driver is on the way", ride });
};

export const driverArrived = async (req, res) => {
  const { rideId } = req.body;

  const ride = await Ride.findById(rideId);

  if (!ride) return res.status(404).json({ message: "Ride not found" });

  ride.status = "arrived";
  ride.arrivedAt = new Date();

  await ride.save();

  io.to(`customer_${ride.customer}`).emit("ride:arrived", {
    rideId,
  });

  res.json({ message: "Driver has arrived", ride });
};

export const startTrip = async (req, res) => {
  const driverId = req.user._id;
  const { rideId } = req.body;

  const ride = await Ride.findById(rideId);

  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  // 🔥 Ensure ONLY assigned driver can start
  if (ride.driver.toString() !== driverId.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // 🔥 THIS IS WHERE YOUR CHECK GOES
  if (ride.status !== "arrived") {
    return res.status(400).json({
      message: "Driver must arrive first",
    });
  }

  // ✅ Start trip
  ride.status = "in_progress";
  ride.startedAt = new Date();

  await ride.save();

  // 🔔 notify both sides
  io.to(`customer_${ride.customer}`).emit("ride:started", ride);
  io.to(`driver_${driverId}`).emit("ride:started", ride);

  res.json({
    message: "Trip started",
    ride,
  });
};


export const endTrip = async (req, res) => {
  const { rideId } = req.body;

  const ride = await Ride.findById(rideId);

  if (!ride) return res.status(404).json({ message: "Ride not found" });

  ride.status = "completed";
  ride.completedAt = new Date();

  await ride.save();

  io.to(`customer_${ride.customer}`).emit("ride:completed", ride);
  io.to(`driver_${ride.driver}`).emit("ride:completed", ride);

  res.json({ message: "Trip completed", ride });
};