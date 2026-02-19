const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    const userRoles = Array.isArray(req.user?.role) ? req.user.role : [];
    const isAllowed = allowedRoles.some((role) => userRoles.includes(role));

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient role",
      });
    }

    next();
  };

module.exports = { requireRole };
