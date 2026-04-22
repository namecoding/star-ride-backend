import express from "express";
import {
  checkPhone,
  completeProfile,
  CustomersLogin,
  DriversLogin, sendOTP, verifyOTP, setPassword, changePassword
} from "../controllers/authController.js";

const router = express.Router();

//Csutomers Onboarding Auth Flow
router.post("/check-phone", checkPhone); //first call
router.post("/send-otp", sendOTP); //second call
router.post("/verify-otp", verifyOTP); //third call
router.post("/register", completeProfile); //fourt call
router.post("/set-password", setPassword); //fiveth call
router.post("/customers-login", CustomersLogin); //sixth call




//Drivers Auth Flow
router.post("/drivers-login", DriversLogin);

export default router;