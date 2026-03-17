const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.medical_data || {});
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const payload = req.body || {};
    const updates = {
      medical_data: {
        tipo_sangre: payload.tipo_sangre || "",
        alergias: payload.alergias || "",
        medicamentos: payload.medicamentos || "",
        padecimientos: payload.padecimientos || "",
        nota: payload.nota || "",
        contacto_medico: payload.contacto_medico || "",
        telefono_medico: payload.telefono_medico || "",
        fecha_actualizacion: Date.now()
      }
    };

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.medical_data);
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
