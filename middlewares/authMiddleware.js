const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const authMiddleware = asyncHandler(async (req, res, next) => {
    try {
        let token;
        if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")) {
            throw new Error("Unauthorized: No token provided");
        }
        
        token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?.id);
        if (!user) {
            throw new Error("User not found");
        }
        req.user = user; // Attach user to request object
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        res.status(401).json({ error: "Unauthorized", message: error.message });
    }
});

const isAdmin = asyncHandler(async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            throw new Error("Unauthorized: You are not an admin");
        }
        next();
    } catch (error) {
        console.error("Authorization error:", error.message);
        res.status(403).json({ error: "Forbidden", message: error.message }); // 403 Forbidden status code for authorization errors
    }
});

module.exports = { authMiddleware, isAdmin };
