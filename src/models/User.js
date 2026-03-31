const mongoose = require("mongoose");

const medicalSchema = new mongoose.Schema(
  {
    tipo_sangre: { type: String, default: "" },
    alergias: { type: String, default: "" },
    medicamentos: { type: String, default: "" },
    padecimientos: { type: String, default: "" },
    nota: { type: String, default: "" },
    contacto_medico: { type: String, default: "" },
    telefono_medico: { type: String, default: "" },
    fecha_actualizacion: { type: Number, default: () => Date.now() }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true },
    phone: { type: String, required: true },
    birth_date: { type: Date, required: true },
    terms_accepted: { type: Boolean, required: true },
    terms_accepted_at: { type: Date, default: null },
    photo_url: { type: String, default: "" },
    medical_data: { type: medicalSchema, default: () => ({}) }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
