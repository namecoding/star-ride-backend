import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB();
mongoose.set("returnOriginal", false);

// ✅ init socket ONCE
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});