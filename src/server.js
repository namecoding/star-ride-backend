import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB(); // ✅ WAIT for DB

    mongoose.set("returnOriginal", false);
    mongoose.set("bufferCommands", false); // ✅ optional but good

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();