const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const User = require("../models/User");
const Session = require("../models/Session");

const PasswordResetToken = require("../models/PasswordResetToken");
const { Resend } = require("resend");
const crypto = require("crypto");
const auth = require("../middleware/auth");

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY || "");

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Falta el correo electrónico" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Por seguridad, responder igual aunque el usuario no exista
      return res.json({ message: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña." });
    }
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ message: "RESEND_API_KEY no configurado" });
    }
    if (!process.env.EMAIL_FROM) {
      return res.status(500).json({ message: "EMAIL_FROM no configurado" });
    }
    // Generar token seguro
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos
    await PasswordResetToken.create({ user_id: user._id, token, expires_at: expires });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    try {
      const resendTimeoutMs = 15000;
      const sendEmailPromise = resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Restablece tu contraseña - SIAC",
        text: `Solicitaste restablecer tu contraseña. Usa este enlace para crear una nueva contraseña (válido por 30 minutos):\n\n${resetUrl}`
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("RESEND_TIMEOUT")), resendTimeoutMs);
      });
      const { error } = await Promise.race([sendEmailPromise, timeoutPromise]);
      if (error) {
        console.error("Error enviando correo de recuperación (Resend):", error);
        return res.status(500).json({ message: "No se pudo enviar el correo de recuperación" });
      }
    } catch (emailErr) {
      if (emailErr && emailErr.message === "RESEND_TIMEOUT") {
        console.error("Timeout enviando correo de recuperación (Resend)");
        return res.status(504).json({ message: "El servicio de correo está tardando. Intenta de nuevo." });
      }
      console.error("Error enviando correo de recuperación (Resend):", emailErr);
      return res.status(500).json({ message: "No se pudo enviar el correo de recuperación" });
    }
    return res.json({ message: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña." });
  } catch (err) {
    console.error("Error en forgot-password:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Faltan datos" });
    }
    const resetToken = await PasswordResetToken.findOne({ token });
    if (!resetToken || resetToken.used || resetToken.expires_at < new Date()) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }
    const user = await User.findById(resetToken.user_id);
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }
    user.password_hash = await bcrypt.hash(password, 10);
    await user.save();
    resetToken.used = true;
    await resetToken.save();
    return res.json({ message: "Contraseña restablecida correctamente" });
  } catch (err) {
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      last_name,
      email,
      password,
      phone,
      birth_date,
      terms_accepted
    } = req.body;

    const trimmedName = String(name || "").trim();
    const trimmedLastName = String(last_name || "").trim();
    const trimmedEmail = String(email || "").trim();

    if (
      !trimmedName ||
      !trimmedLastName ||
      !trimmedEmail ||
      !password ||
      !phone ||
      !birth_date
    ) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const nameRegex = /^[\p{L} .'-]+$/u;
    if (!nameRegex.test(trimmedName) || !nameRegex.test(trimmedLastName)) {
      return res.status(400).json({ message: "Invalid name" });
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const phoneDigits = String(phone).replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return res.status(400).json({ message: "Invalid phone" });
    }

    const parsedBirthDate = new Date(birth_date);
    if (Number.isNaN(parsedBirthDate.getTime())) {
      return res.status(400).json({ message: "Invalid birth date" });
    }

    const minAgeYears = 18;
    const today = new Date();
    let age = today.getFullYear() - parsedBirthDate.getFullYear();
    const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirthDate.getDate())) {
      age -= 1;
    }
    if (age < minAgeYears) {
      return res.status(400).json({ message: "Underage" });
    }

    if (typeof terms_accepted !== "boolean" || terms_accepted !== true) {
      return res.status(400).json({ message: "Terms not accepted" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: trimmedName,
      last_name: trimmedLastName,
      email: trimmedEmail.toLowerCase(),
      password_hash,
      phone: phoneDigits,
      birth_date: parsedBirthDate,
      terms_accepted: true,
      terms_accepted_at: new Date()
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
    const rawExpiresIn = (process.env.JWT_EXPIRES || "").trim();
    const normalizedExpiresIn = rawExpiresIn.toLowerCase();
    const shouldExpire =
      rawExpiresIn.length > 0 && !["0", "none", "false", "off"].includes(normalizedExpiresIn);
    const jti = randomUUID();
    const signOptions = shouldExpire ? { expiresIn: rawExpiresIn } : undefined;
    const token = jwt.sign({ sub: user._id.toString(), jti }, secret, signOptions);

    await Session.create({ user_id: user._id, jti });

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

router.post("/logout", auth, async (req, res) => {
  try {
    await Session.deleteOne({ user_id: req.userId, jti: req.tokenId });
    return res.json({ message: "Logged out" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
