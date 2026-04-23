import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createRide,
  getPendingRides,
  acceptRide,
  updateRideStatus, getRideTypes, getMyRides
} from "../controllers/rideController.js";
import { seedRideTypes } from "../controllers/seedRideTypes.js";

const router = express.Router();

// customer
router.post("/", protect, createRide);

// driver
router.get("/pending", protect, getPendingRides);

// driver accepts ride
router.post("/accept", protect, acceptRide);

// status updates
router.post("/status", protect, updateRideStatus);

router.get('/ride-types', protect, getRideTypes)

router.get('/my-ride', protect, getMyRides)


//open seed route
router.get("/seed-ride-types", seedRideTypes);

export default router;