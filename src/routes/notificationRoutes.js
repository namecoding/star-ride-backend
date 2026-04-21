import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getNotifications, readNotifications, deleteNotifications
  } from "../controllers/notificationController.js";

    const router = express.Router();
    
    router.get("/get", protect, getNotifications);
    router.post("/read", protect, readNotifications)
    router.post("/delete", protect, deleteNotifications)



export default router;