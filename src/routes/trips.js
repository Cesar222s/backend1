const express = require("express");
const Trip = require("../models/Trip");
const auth = require("../middleware/auth");

const router = express.Router();

// Devuelve todos los viajes del usuario autenticado
router.get("/", auth, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.userId })
      .sort({ startTime: -1 })
      .lean();
    return res.json(trips);
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Sincroniza una lista de viajes (backup desde el móvil)
router.post("/sync", auth, async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [];
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const operations = payload
      .filter((item) => typeof item.tripId === "string" && item.tripId.trim() !== "")
      .map((item) => ({
        updateOne: {
          filter: { userId, tripId: item.tripId },
          update: {
            $set: {
              userId,
              tripId: item.tripId,
              startTime: item.startTime ?? 0,
              endTime: item.endTime ?? 0,
              duration: item.duration ?? 0,
              startLatitude: item.startLatitude ?? 0,
              startLongitude: item.startLongitude ?? 0,
              endLatitude: item.endLatitude ?? 0,
              endLongitude: item.endLongitude ?? 0,
              startAddress: item.startAddress || "",
              endAddress: item.endAddress || "",
              distanceKm: item.distanceKm ?? 0,
              avgHeartRate: item.avgHeartRate ?? 0,
              maxHeartRate: item.maxHeartRate ?? 0,
              minHeartRate: item.minHeartRate ?? 0,
              fatigueAlertsCount: item.fatigueAlertsCount ?? 0,
              mildFatigueCount: item.mildFatigueCount ?? 0,
              criticalFatigueCount: item.criticalFatigueCount ?? 0,
              breaksCount: item.breaksCount ?? 0,
              totalBreakTime: item.totalBreakTime ?? 0,
              tripStatus: item.tripStatus || "completed",
              completedSafely: item.completedSafely ?? true,
              notes: item.notes || "",
              emergencyCalled: item.emergencyCalled ?? false,
              safetyScore: item.safetyScore ?? 100
            }
          },
          upsert: true
        }
      }));

    if (operations.length > 0) {
      await Trip.bulkWrite(operations, { ordered: false });
    }

    const trips = await Trip.find({ userId }).sort({ startTime: -1 }).lean();
    return res.json(trips);
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
