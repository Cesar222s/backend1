const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    sensibilidad_fatiga: { type: Number, default: 3 },
    tipo_alertas: { type: String, default: "ambas" },
    modo_monitor: { type: String, default: "manual" },
    intervalo_monitoreo: { type: Number, default: 2 },
    umbral_hr_alto: { type: Number, default: 100 },
    umbral_hr_critico: { type: Number, default: 120 },
    umbral_hr_bajo: { type: Number, default: 60 },
    umbral_movimiento: { type: Number, default: 2.0 },
    duracion_alerta: { type: Number, default: 30 },
    notificaciones_habilitadas: { type: Boolean, default: true },
    alerta_hr_alta_habilitada: { type: Boolean, default: true },
    alerta_hr_baja_habilitada: { type: Boolean, default: true },
    deteccion_caidas_habilitada: { type: Boolean, default: true },
    vibracion_habilitada: { type: Boolean, default: true },
    fecha_actualizacion: { type: Number, default: () => Date.now() }
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    telefono: { type: String, required: true },
    relacion: { type: String, default: "" },
    email: { type: String, default: "" },
    es_principal: { type: Boolean, default: false },
    fecha_agregado: { type: Number, default: () => Date.now() }
  },
  { _id: true }
);

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
    medical_data: { type: medicalSchema, default: () => ({}) },
    settings: { type: settingsSchema, default: () => ({}) },
    emergency_contacts: { type: [emergencyContactSchema], default: () => [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
