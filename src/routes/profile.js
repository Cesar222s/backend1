const express = require("express");
const User = require("../models/User");
const Session = require("../models/Session");
const PasswordResetToken = require("../models/PasswordResetToken");
const auth = require("../middleware/auth");
const getFirebaseAdmin = require("../utils/firebaseAdmin");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id.toString(),
      name: user.name,
      last_name: user.last_name,
      email: user.email,
      photo_url: user.photo_url || ""
    });
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const { name, last_name, photo_url } = req.body;

    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof last_name === "string") updates.last_name = last_name.trim();
    if (typeof photo_url === "string") updates.photo_url = photo_url.trim();

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id.toString(),
      name: user.name,
      last_name: user.last_name,
      email: user.email,
      photo_url: user.photo_url || ""
    });
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const firebase = getFirebaseAdmin();
    if (firebase && req.authProvider === "firebase") {
      try {
        await firebase.auth().deleteUser(req.tokenId);
      } catch (firebaseErr) {
        console.error("Error deleting Firebase user:", firebaseErr);
        return res.status(500).json({ message: "No se pudo eliminar el usuario de Firebase" });
      }
    }

    await Promise.all([
      Session.deleteMany({ user_id: req.userId }),
      PasswordResetToken.deleteMany({ user_id: req.userId }),
      User.deleteOne({ _id: req.userId })
    ]);

    return res.json({ message: "Usuario eliminado correctamente" });
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
