import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { Server } from "socket.io";
import mongoose from "mongoose";
import User from "./models/User.js";
import { acceptRideService } from "./services/rideService.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

mongoose.set("returnOriginal", false);

// 🔥 SOCKET.IO INIT
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

connectDB();

// 🧠 EXPORT SOCKET
export { io };

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 👨‍✈️ DRIVER JOIN
  socket.on("driver:join", (driverId) => {
    socket.join(`driver_${driverId}`);
    console.log("Driver joined:", driverId);
  });

  // 👤 CUSTOMER JOIN
  socket.on("customer:join", (customerId) => {
    console.log("Customer joined:", customerId);
    socket.join(`customer_${customerId}`);
  });

  // 📍 DRIVER LOCATION UPDATE
  socket.on("driver:location", async ({ driverId, latitude, longitude }) => {
    try {
      await User.findByIdAndUpdate(driverId, {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      });

      console.log("Driver location updated:", driverId);
    } catch (err) {
      console.log("LOCATION ERROR:", err);
    }
  });

  // 🚕 ACCEPT RIDE (REAL-TIME)
  socket.on("ride:accept", async ({ rideId, driverId }) => {
    console.log("RIDE ACCEPT:", rideId, driverId);

    try {
      const ride = await acceptRideService(rideId, driverId);

      if (!ride) {
        socket.emit("ride:error", {
          message: "Ride already taken",
        });
        return;
      }

      // 🔥 notify customer
      io.to(`customer_${ride.customer}`).emit("ride:accepted", ride);

      // 🔥 notify driver
      io.to(`driver_${driverId}`).emit("ride:status", ride);

    } catch (err) {
      console.log("ACCEPT ERROR:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});