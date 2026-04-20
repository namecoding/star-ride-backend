import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";




const app = express();

app.use(
    cors({
      origin: "*", // later restrict to your app
      credentials: true,
    })
  );

// app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rides", rideRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;