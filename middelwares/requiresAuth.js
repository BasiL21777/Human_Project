require("dotenv").config();
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const syncUserFromKeycloak = require("../middelwares/userSync_DB");


const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const REALM = process.env.KEYCLOAK_REALM;

const JWKS_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`;

const client = jwksClient({ jwksUri: JWKS_URL });

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

module.exports = function requiresAuth() {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const parts = authHeader.split(" ");
    if (parts[0].toLowerCase() !== "bearer" || parts.length !== 2) {
      return res.status(401).json({ error: "Invalid Authorization format" });
    }

    const token = parts[1];

jwt.verify(token, getKey, { algorithms: ["RS256"] }, async (err, decoded) => {
  if (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;

  // Sync user into MongoDB
  await syncUserFromKeycloak(decoded);

  next();
});

  };
};
