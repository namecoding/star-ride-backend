import express from "express";
import { getMe, changePassword, deleteAccount, sendChangePhoneOTP, verifyChangePhoneOTP, editAccount, myWalletHistory } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe);

// Other Auth Flow
router.post("/change-password", protect, changePassword); 
router.get("/delete-account", protect, deleteAccount);

router.post("/change-phone", protect, sendChangePhoneOTP); 
router.post("/verify-change-phone", protect, verifyChangePhoneOTP);
router.post("/edit-account", protect, editAccount);

router.get("/wallet-history", protect, myWalletHistory);


export default router;