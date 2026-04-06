const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    tripId: { type: String, required: true, index: true },

    startTime: { type: Number, required: true },
    endTime: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },

    startLatitude: { type: Number, default: 0 },
    startLongitude: { type: Number, default: 0 },
    endLatitude: { type: Number, default: 0 },
    endLongitude: { type: Number, default: 0 },
    startAddress: { type: String, default: "" },
    endAddress: { type: String, default: "" },

    distanceKm: { type: Number, default: 0 },

    avgHeartRate: { type: Number, default: 0 },
    maxHeartRate: { type: Number, default: 0 },
    minHeartRate: { type: Number, default: 0 },

    fatigueAlertsCount: { type: Number, default: 0 },
    mildFatigueCount: { type: Number, default: 0 },
    criticalFatigueCount: { type: Number, default: 0 },

    breaksCount: { type: Number, default: 0 },
    totalBreakTime: { type: Number, default: 0 },

    tripStatus: { type: String, default: "completed" },
    completedSafely: { type: Boolean, default: true },

    notes: { type: String, default: "" },
    emergencyCalled: { type: Boolean, default: false },
    safetyScore: { type: Number, default: 100 }
  },
  { timestamps: true }
);

tripSchema.index({ userId: 1, tripId: 1 }, { unique: true });

module.exports = mongoose.model("Trip", tripSchema);
