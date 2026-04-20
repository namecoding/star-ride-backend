import Ride from "../models/Ride.js";
import User from "../models/User.js";


// 🚕 ACCEPT RIDE (used by BOTH socket + REST)
export const acceptRideService = async (rideId, driverId) => {
  const ride = await Ride.findOneAndUpdate(
    { _id: rideId, status: "pending" },
    {
      driver: driverId,
      status: "accepted",
    },
    { returnDocument: "after" } // ✅ FIXED
  );

  return ride; // null if already taken
};


// 📍 FIND NEARBY DRIVERS (GEO QUERY)
export const findNearbyDrivers = async (lng, lat, radius = 3000) => {
  const drivers = await User.find({
    role: "driver",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: radius,
      },
    },
  });

  return drivers;
};