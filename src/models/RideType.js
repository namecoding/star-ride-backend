// models/RideType.js
import mongoose from "mongoose";

const rideTypeSchema = new mongoose.Schema(
  {
    id: {
      type: String, // "economy", "premium"
      required: true,
      unique: true,
    },
    name: String,
    subtitle: String,
    seats: Number,
    basePrice: Number,
    pricePerKm: Number,
    image: String, // store URL or file name
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("RideType", rideTypeSchema);