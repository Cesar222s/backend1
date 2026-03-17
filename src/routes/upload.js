const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg");
    const name = `profile_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/profile-photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Missing file" });
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { photo_url: photoUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ photo_url: photoUrl });
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
