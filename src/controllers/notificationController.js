import User from "../models/User.js";
import Notification from "../models/Notifications.js";
import bcrypt from "bcryptjs";
import { io } from "../sockets/socket.js";


export const createNotifications = async (req, res) => {
    try {
      const { userId, userType, title, message, type, priority, action } =
        req.body;
  
      const notification = await Notification.create({
        userId,
        userType,
        title,
        message,
        type,
        priority,
        action,
      });
  
      // 🔥 REAL-TIME EMIT
      io.to(`${userType}_${userId}`).emit("notification:new", notification);
  
      return res.status(201).json({
        message: "Notification created",
        notification,
      });
    } catch (error) {
      console.log("Create notification error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };


  export const getNotifications = async (req, res) => {
    try {
      const userId = req.user._id;
      const { userType = "customer", page = 1, limit = 20 } = req.query;
  
      const skip = (page - 1) * limit;
  
      const notifications = await Notification.find({
        userId,
        userType,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
  
      const total = await Notification.countDocuments({
        userId,
        userType,
      });
  
      return res.json({
        notifications,
        total,
        page: Number(page),
        hasMore: skip + notifications.length < total,
      });
    } catch (error) {
      console.log("Get notifications error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };