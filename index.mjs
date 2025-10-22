import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import routes from "./routes/index.mjs";

dotenv.config();

const app = express();

// Trust proxy (needed for secure cookies behind reverse proxies)
app.set("trust proxy", 1);

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ✅ CORS setup using the `cors` middleware
app.use(
  cors({
    origin: true, // Reflects the request origin, as you were doing manually
    credentials: true, // Allows cookies to be sent
  })
);

// ✅ Routes
app.use("/api", routes);

// ✅ Database + Server Start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
  }
};

startServer();
