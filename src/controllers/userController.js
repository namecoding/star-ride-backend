import User from "../models/User.js";
import bcrypt from "bcryptjs";


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