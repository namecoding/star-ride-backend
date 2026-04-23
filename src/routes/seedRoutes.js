import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { seedWalletHistory, seedRideTypes } from "../controllers/seedController.js";

const router = express.Router();

router.post("/seed-wallet-history", seedWalletHistory); // add this later protect, adminOnly,

router.get("/seed-ride-types", seedRideTypes); // add this later protect, adminOnly,

export default router;