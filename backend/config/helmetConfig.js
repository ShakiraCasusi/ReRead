const helmet = require("helmet");

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://accounts.google.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
      ],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://api.github.com",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  frameguard: {
    action: "deny",
  },

  noSniff: true,

  xssFilter: true,

  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
    },
  },

  hsts:
    process.env.NODE_ENV === "production"
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,

  expectCt: {
    enforce: true,
    maxAge: 30 * 24 * 60 * 60,
  },
});

module.exports = helmetConfig;
