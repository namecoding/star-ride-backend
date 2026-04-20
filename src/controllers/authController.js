import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import { generateOTP } from "../utils/otp.js";

// 1. Check Phone
export const checkPhone = async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });

  // 1. User does not exist
  if (!user) {
    return res.json({
      status: "NEW_USER",
      exists: false,
    });
  }

  // 2. Not verified (OTP not done)
  if (!user.isVerified) {
    return res.json({
      status: "VERIFY_OTP",
      exists: true,
    });
  }

  // 3. Profile not complete
  if (!user.firstName || !user.lastName) {
    return res.json({
      status: "INCOMPLETE_PROFILE",
      exists: true,
    });
  }

  // 4. No password yet
  if (!user.password) {
    return res.json({
      status: "SET_PASSWORD",
      exists: true,
    });
  }

  // 5. Fully ready
  return res.json({
    status: "LOGIN",
    exists: true,
  });
};

// Send OTP
export const sendOTP = async (req, res) => {
  const { phone } = req.body;

  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone });
  }

  // 🔐 Check lock
  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    return res.status(403).json({
      message: "Too many attempts. Try again later.",
    });
  }

  // ⏳ Reset resend count every 1 minute window
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  if (!user.otpLastSentAt || user.otpLastSentAt < oneMinuteAgo) {
    user.otpResendCount = 0;
  }

  // 🚫 Limit resend
  if (user.otpResendCount >= 3) {
    return res.status(429).json({
      message: "Too many OTP requests. Try again in 1 minute.",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.otpResendCount += 1;
  user.otpLastSentAt = now;

  await user.save();

  res.json({
    message: "OTP sent successfully",
    otp, // remove in production
  });
};

export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  let user = await User.findOne({ phone });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // lock check
  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    return res.status(403).json({
      message: "Account temporarily locked. Try again later.",
    });
  }

  // expired
  if (!user.otp || user.otpExpires < new Date()) {
    return res.status(400).json({
      message: "OTP expired. Request new one.",
    });
  }

  // wrong otp
  if (user.otp !== otp) {
    user.otpAttempts += 1;

    if (user.otpAttempts >= 5) {
      user.otpLockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      user.otpAttempts = 0;
    }

    await user.save();

    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  // ✅ OTP success → NOW we ensure user is "activated"
  user.isVerified = true;

  // clear OTP fields
  user.otp = null;
  user.otpExpires = null;
  user.otpAttempts = 0;
  user.otpResendCount = 0;

  await user.save();

  res.json({
    message: "Phone verified successfully",
    user,
  });
};

export const completeProfile = async (req, res) => {
  const { phone, firstName, lastName } = req.body;

  const user = await User.findOneAndUpdate(
    { phone },
    { firstName, lastName },
    { new: true }
  );

  res.json({ user });
};

// 2. Register
export const register = async (req, res) => {
  const { phone, firstName, lastName, password } = req.body;

  const existing = await User.findOne({ phone });
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    phone,
    firstName,
    lastName,
    password: hashedPassword,
    isVerified: true, // assume already verified
  });

  const token = generateToken(user);

  res.json({ user, token });
};

// 3. Login
export const CustomersLogin = async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone:phone, role:'customer' });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // 🚨 prevent crash
  if (!user.password) {
    return res.status(400).json({
      message: "Account not fully set up. Please complete registration.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.json({ user, token });
};

export const DriversLogin = async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone:phone, role:'driver' });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // 🚨 prevent crash
  if (!user.password) {
    return res.status(400).json({
      message: "Account not fully set up. Please complete registration.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.json({ user, token });
};


export const setPassword = async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      message: "Verify phone before setting password",
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  user.password = hashed;

  await user.save();

  res.json({
    message: "Password set successfully",
  });
};