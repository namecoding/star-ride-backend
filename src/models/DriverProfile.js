// models/DriverProfile.js
import mongoose from "mongoose";

const driverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per driver
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    currentRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },

    rating: {
      type: Number,
      default: 5,
    },

    totalTrips: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DriverProfile", driverProfileSchema);