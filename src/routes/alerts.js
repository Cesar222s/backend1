const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

router.post("/critical-email", auth, async (req, res) => {
  try {
    const heartRate = Number(req.body.heart_rate);
    const latitude = req.body.latitude !== undefined && req.body.latitude !== null
      ? Number(req.body.latitude)
      : null;
    const longitude = req.body.longitude !== undefined && req.body.longitude !== null
      ? Number(req.body.longitude)
      : null;
    const timestamp = Number(req.body.timestamp || Date.now());

    const user = await User.findById(req.userId).lean();
    if (!user || !user.email) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
    const mapsLink = hasCoords ? `https://maps.google.com/?q=${latitude},${longitude}` : null;
    const locationText = hasCoords
      ? `Ubicacion: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n${mapsLink}`
      : "Ubicacion no disponible";
    const alertTime = new Date(timestamp).toLocaleString("es-MX");

    const subject = "SIAC - Alerta critica detectada";
    const text = [
      "Se detecto fatiga critica en tu cuenta.",
      "",
      `BPM actual: ${Number.isFinite(heartRate) ? heartRate : 0}`,
      locationText,
      `Hora: ${alertTime}`
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="margin: 0 0 12px; color: #dc2626;">Alerta critica detectada</h2>
        <p>Se detecto fatiga critica en tu cuenta de SIAC.</p>
        <p><strong>BPM actual:</strong> ${Number.isFinite(heartRate) ? heartRate : 0}</p>
        <p><strong>${hasCoords ? "Ubicacion" : "Ubicacion"}:</strong><br>${hasCoords ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "No disponible"}</p>
        ${mapsLink ? `<p><a href="${mapsLink}">Abrir ubicacion en Google Maps</a></p>` : ""}
        <p><strong>Hora:</strong> ${alertTime}</p>
      </div>
    `;

    const sendEmailPromise = sendMail({
      to: user.email,
      subject,
      text,
      html
    });

    await sendEmailPromise;

    return res.json({ message: "Correo de alerta enviado correctamente" });
  } catch (err) {
    console.error("Error en critical-email:", err);
    return res.status(500).json({ message: "No se pudo enviar el correo de alerta", error: err.message });
  }
});

module.exports = router;