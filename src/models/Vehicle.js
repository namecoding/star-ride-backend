// models/Vehicle.js
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    make: String,        // Toyota
    
    model: String,       // Corolla
    
    year: Number,

    color: String,

    plateNumber: {
      type: String,
      required: true,
      unique: true,
    },

    driverSnapshot: {
        name: String,
        avatar: String,
      },      

    seats: {
      type: Number,
      default: 4,
    },

    rideType: {
      type: String, // economy, premium, etc.
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    documents: {
      license: String,       // image URL
      insurance: String,
      roadWorthiness: String,
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ driver: 1 });

export default mongoose.model("Vehicle", vehicleSchema);