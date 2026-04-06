const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

function toNumber(value, fallback) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user.settings || {});
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const payload = req.body || {};
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const current = user.settings || {};
    const nextSettings = {
      sensibilidad_fatiga: toNumber(payload.sensibilidad_fatiga, current.sensibilidad_fatiga ?? 3),
      tipo_alertas: typeof payload.tipo_alertas === "string" ? payload.tipo_alertas : current.tipo_alertas || "ambas",
      modo_monitor: typeof payload.modo_monitor === "string" ? payload.modo_monitor : current.modo_monitor || "manual",
      intervalo_monitoreo: toNumber(payload.intervalo_monitoreo, current.intervalo_monitoreo ?? 2),
      umbral_hr_alto: toNumber(payload.umbral_hr_alto, current.umbral_hr_alto ?? 100),
      umbral_hr_critico: toNumber(payload.umbral_hr_critico, current.umbral_hr_critico ?? 120),
      umbral_hr_bajo: toNumber(payload.umbral_hr_bajo, current.umbral_hr_bajo ?? 60),
      umbral_movimiento: toNumber(payload.umbral_movimiento, current.umbral_movimiento ?? 2.0),
      duracion_alerta: toNumber(payload.duracion_alerta, current.duracion_alerta ?? 30),
      notificaciones_habilitadas: typeof payload.notificaciones_habilitadas === "boolean" ? payload.notificaciones_habilitadas : current.notificaciones_habilitadas ?? true,
      alerta_hr_alta_habilitada: typeof payload.alerta_hr_alta_habilitada === "boolean" ? payload.alerta_hr_alta_habilitada : current.alerta_hr_alta_habilitada ?? true,
      alerta_hr_baja_habilitada: typeof payload.alerta_hr_baja_habilitada === "boolean" ? payload.alerta_hr_baja_habilitada : current.alerta_hr_baja_habilitada ?? true,
      deteccion_caidas_habilitada: typeof payload.deteccion_caidas_habilitada === "boolean" ? payload.deteccion_caidas_habilitada : current.deteccion_caidas_habilitada ?? true,
      vibracion_habilitada: typeof payload.vibracion_habilitada === "boolean" ? payload.vibracion_habilitada : current.vibracion_habilitada ?? true,
      fecha_actualizacion: Date.now()
    };

    user.settings = nextSettings;
    await user.save();

    return res.json(user.settings);
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
