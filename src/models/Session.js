const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jti: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

sessionSchema.index({ user_id: 1, jti: 1 });

module.exports = mongoose.model("Session", sessionSchema);
