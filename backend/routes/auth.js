const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const tokenManager = require("../utils/tokenManager");
const { authValidators } = require("../middleware/validators");
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter");
const { logger } = require("../config/logger");

router.post(
  "/register",
  registerLimiter,
  authValidators.register,
  authController.register,
);
router.post("/login", authLimiter, authValidators.login, authController.login);
router.post("/google", authController.googleLogin);
router.post("/refresh-token", authController.refreshToken);
router.post("/refresh", authController.refreshToken);

router.post("/logout", authController.logout);

router.get(
  "/profile",
  tokenManager.authenticateToken,
  authController.getCurrentProfile,
);

router.put(
  "/profile",
  tokenManager.authenticateToken,
  authValidators.updateProfile,
  authController.updateProfile,
);

router.delete(
  "/profile",
  tokenManager.authenticateToken,
  authController.deleteAccount,
);

router.post(
  "/become-seller",
  tokenManager.authenticateToken,
  authController.becomeSeller,
);

router.use((err, req, res, next) => {
  logger.error("Auth route error", {
    path: req.path,
    method: req.method,
    error: err.message,
  });
  next(err);
});

module.exports = router;
