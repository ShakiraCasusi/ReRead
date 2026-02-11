require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

// Routes
const bookRoutes = require("./routes/books");
const cartRoutes = require("./routes/cart");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviews");
const sellerRoutes = require("./routes/seller");
const uploadRoutes = require("./routes/upload");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes setup
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Server running" });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Not found" });
});

// Connect and start
async function start() {
    try {
        const conn = await connectDB();
        if (!conn) {
            throw new Error("MongoDB connection failed. Check MONGODB_URI in backend/.env");
        }
        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => {
            console.log("Server running on port " + PORT);
            console.log("MongoDB: Connected");
        });
    } catch (error) {
        console.error("Server error:", error.message);
        process.exit(1);
    }
}

start();
