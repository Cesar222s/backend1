const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER || process.env.EMAIL_FROM || "";
  const pass = process.env.GMAIL_APP_PASSWORD || "";

  if (!user || !pass) {
    throw new Error("GMAIL_USER y GMAIL_APP_PASSWORD son requeridos");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.GMAIL_USER;

  if (!from) {
    throw new Error("EMAIL_FROM no configurado");
  }

  const mailTransporter = getTransporter();
  return mailTransporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
}

module.exports = {
  sendMail
};