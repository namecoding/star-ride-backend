import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateOTP } from "../utils/otp.js";
import Notification from "../models/Notifications.js";
import WalletTransaction from "../models/WalletTransaction.js";

export const getMe = async (req, res) => {
    res.json({
      user: req.user,
    });
  };

  export const changePassword = async (req, res) => {
    try {
      const userId = req.user._id;
      const { oldPassword, newPassword, confirmPassword } = req.body;
  
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields required" });
      }
  
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
  
      const user = await User.findById(userId);
  
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const isMatch = await bcrypt.compare(oldPassword, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
  
      const hashed = await bcrypt.hash(newPassword, 10);
  
      user.password = hashed;
      await user.save();
  
      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.log("changePassword error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
  
  export const deleteAccount = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      user.isDeleted = true;
      user.deletedAt = new Date();
  
      await user.save();
  
      return res.json({
        message: "Account scheduled for deletion in 14 days",
      });
    } catch (error) {
      console.log("deleteAccount error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };

  export const editAccount = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const { firstName, lastName, email, dob, password } = req.body;
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // ❗ Require password for sensitive update
      if (!password) {
        return res.status(400).json({ message: "Password is required to update account" });
      }
  
      // ✅ Verify password
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }
  
      // ✅ Email uniqueness check (if updating email)
      if (email && email !== user.email) {
        const existing = await User.findOne({ email });
  
        if (existing) {
          return res.status(400).json({ message: "Email already in use" });
        }
  
        user.email = email;
      }
  
      // ✅ Update allowed fields
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
  
      if (dob !== undefined) {
        user.dob = dob;
      }
  
      await user.save();
  
      return res.json({
        message: "Account updated successfully",
        user,
      });
  
    } catch (error) {
      console.log("editAccount error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };

  export const sendChangePhoneOTP = async (req, res) => {
    try {
      const userId = req.user._id;
      const { phone } = req.body;
  
      if (!phone) {
        return res.status(400).json({ message: "Phone is required" });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // ❌ prevent duplicate phone
      const existing = await User.findOne({
        phone,
        _id: { $ne: userId },
      });
  
      if (existing) {
        return res.status(400).json({
          message: "Phone number already in use",
        });
      }
  
      // 🔐 LOCK CHECK
      if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
        return res.status(403).json({
          message: "Too many attempts. Try again later.",
        });
      }
  
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  
      if (!user.otpLastSentAt || user.otpLastSentAt < oneMinuteAgo) {
        user.otpResendCount = 0;
      }
  
      if (user.otpResendCount >= 3) {
        return res.status(429).json({
          message: "Too many OTP requests. Try again in 1 minute.",
        });
      }
  
      const otp = generateOTP();
  
      user.changePhoneOTP = otp;
      user.changePhoneOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
      user.changePhoneTarget = phone;
  
      user.otpResendCount += 1;
      user.otpLastSentAt = now;
  
      await user.save();
  
      // 📲 SEND SMS HERE
      // sendSMS(phone, otp)
  
      // 🔔 ALERT USER (IMPORTANT PART)
      await Notification.create({
        userId: user._id,
        userType: user.role || "customer",
        title: "Phone Change Requested",
        message: `A request was made to change your phone number to ${phone}. If this wasn't you, secure your account immediately.`,
        type: "security",
        priority: "high",
        action: "PHONE_CHANGE_REQUESTED",
      });
  
      res.json({
        message: "OTP sent to new phone",
        otp, // remove in production
      });
  
    } catch (error) {
      console.log("sendChangePhoneOTP error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  export const verifyChangePhoneOTP = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otp, phone } = req.body;

    if (!otp || !phone) {
      return res.status(400).json({
        message: "OTP and phone are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.changePhoneOTP) {
      return res.status(400).json({
        message: "No OTP request found",
      });
    }

    // 🔐 LOCK CHECK
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      return res.status(403).json({
        message: "Account temporarily locked. Try again later.",
      });
    }

    // ⏳ EXPIRE CHECK (safe)
    if (
      !user.changePhoneOTPExpires ||
      user.changePhoneOTPExpires < new Date()
    ) {
      return res.status(400).json({
        message: "OTP expired. Request new one.",
      });
    }

    // ❌ PHONE MATCH CHECK
    if (user.changePhoneTarget !== phone) {
      return res.status(400).json({
        message: "Phone mismatch. Request new OTP.",
      });
    }

    // ❌ WRONG OTP
    if (user.changePhoneOTP !== otp) {
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

    // ✅ SUCCESS → update phone
    user.phone = phone;

    // 🧹 CLEAR CHANGE PHONE DATA
    user.changePhoneOTP = null;
    user.changePhoneOTPExpires = null;
    user.changePhoneTarget = null;

    // reset counters
    user.otpAttempts = 0;
    user.otpResendCount = 0;

    await user.save();

    // 🔔 NOTIFICATION
    await Notification.create({
      userId: user._id,
      userType: "customer",
      title: "Phone Updated",
      message: "Your phone number was changed successfully.",
      type: "security",
      priority: "high",
      action: "PHONE_UPDATED",
    });

    res.json({
      message: "Phone number updated successfully",
      user,
    });

  } catch (error) {
    console.log("verifyChangePhoneOTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const myWalletHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const { page = 1, limit = 10 } = req.query;

    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await WalletTransaction.countDocuments({ user: userId });

    // 🔥 format for frontend
    const formatted = transactions.map((tx) => ({
      id: tx._id,

      title: tx.title,

      date: new Date(tx.createdAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),

      amount: tx.amount,

      type: tx.type,
      status: tx.status,

      method: tx.method || "—",

      reference: tx.reference || "—",
    }));

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      transactions: formatted,
    });
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


