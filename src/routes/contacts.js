const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

function normalizePhone(value) {
  if (!value) return "";
  return String(value).trim().replace(/[\s\-()]/g, "");
}

function sanitizeContact(raw, fallbackPrincipal) {
  return {
    nombre: String(raw.nombre || "").trim(),
    telefono: normalizePhone(raw.telefono || ""),
    relacion: String(raw.relacion || "").trim(),
    email: String(raw.email || "").trim(),
    es_principal: typeof raw.es_principal === "boolean" ? raw.es_principal : fallbackPrincipal,
    fecha_agregado: typeof raw.fecha_agregado === "number" ? raw.fecha_agregado : Date.now()
  };
}

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.emergency_contacts || []);
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [];
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const trimmed = payload.slice(0, 2).map((raw, index) =>
      sanitizeContact(raw, index === 0)
    );

    let hasPrincipal = trimmed.some((item) => item.es_principal === true);
    if (!hasPrincipal && trimmed.length > 0) {
      trimmed[0].es_principal = true;
      hasPrincipal = true;
    }

    if (hasPrincipal) {
      let principalAssigned = false;
      trimmed.forEach((item) => {
        if (item.es_principal && !principalAssigned) {
          principalAssigned = true;
          return;
        }
        item.es_principal = false;
      });
    }

    user.emergency_contacts = trimmed;
    await user.save();

    return res.json(user.emergency_contacts);
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
