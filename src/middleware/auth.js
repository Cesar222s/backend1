const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const User = require("../models/User");
const getFirebaseApp = require("../utils/firebaseAdmin");

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  const firebase = getFirebaseApp();
  if (firebase) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      const email = (decoded.email || "").toLowerCase();

      if (!email) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await User.findOne({ email }).lean();
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.userId = user._id.toString();
      req.tokenId = decoded.uid;
      req.token = token;
      req.authProvider = "firebase";
      return next();
    } catch (_err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "");
    const tokenId = payload.jti;

    if (!payload.sub || !tokenId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const session = await Session.findOne({ user_id: payload.sub, jti: tokenId }).lean();
    if (!session) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.userId = payload.sub;
    req.tokenId = tokenId;
    req.token = token;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = auth;
