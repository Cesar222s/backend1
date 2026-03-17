const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, last_name, email, password } = req.body;

    if (!name || !last_name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      password_hash
    });

    return res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      last_name: user.last_name,
      email: user.email
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const secret = process.env.JWT_SECRET || "";
    const expiresIn = process.env.JWT_EXPIRES || "7d";
    const token = jwt.sign({ sub: user._id.toString() }, secret, { expiresIn });

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        photo_url: user.photo_url || ""
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
