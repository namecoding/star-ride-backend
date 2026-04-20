import { Server } from "socket.io";
import User from "../models/User.js";
import { acceptRideService } from "../services/rideService.js";

export let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("driver:join", (driverId) => {
      socket.join(`driver_${driverId}`);
    });

    socket.on("customer:join", (customerId) => {
      socket.join(`customer_${customerId}`);
    });

    socket.on("driver:location", async ({ driverId, latitude, longitude }) => {
      await User.findByIdAndUpdate(driverId, {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      });
    });

    socket.on("ride:accept", async ({ rideId, driverId }) => {
      try {
        const ride = await acceptRideService(rideId, driverId);

        if (!ride) {
          socket.emit("ride:error", { message: "Ride already taken" });
          return;
        }

        io.to(`customer_${ride.customer}`).emit("ride:accepted", ride);
        io.to(`driver_${driverId}`).emit("ride:status", ride);
      } catch (err) {
        console.log(err);
      }
    });
  });

  return io;
};