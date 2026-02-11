require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");

const sessionMiddleware = require("./config/session");

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",  // Primary frontend URL
    "http://127.0.0.1:5501",
    "http://127.0.0.1:5502",
    "http://127.0.0.1:8080",
    "http://localhost:5500",
    "http://localhost:5501",
    "http://localhost:5502",
    "http://localhost:8080"
  ],
  credentials: true,
  exposedHeaders: ['Set-Cookie'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(cookieParser());
app.use(express.json());

app.use(sessionMiddleware);

connectDB();
app.get("/", (req, res) => res.send("FishDice backend running"));

app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);

