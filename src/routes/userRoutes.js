import express from "express";
import { getMe, changePassword, deleteAccount } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe);

// Other Auth Flow
router.post("/change-password", protect, changePassword); 
router.get("/delete-account", protect, deleteAccount); 

export default router;