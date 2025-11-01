const express = require("express");
const bcrypt = require("bcrypt");
const {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../services/jwt");
const { db } = require("../db/index.js");
const { users } = require("../db/schema.js");
const { eq } = require("drizzle-orm");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword })
      .returning();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = generateToken({
      id: payload.id,
      email: payload.email,
    });
    const newRefreshToken = generateRefreshToken({
      id: payload.id,
      email: payload.email,
    });
    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

module.exports = router;
