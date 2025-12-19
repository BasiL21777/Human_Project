const User = require("../models/users.model");

async function syncUserFromKeycloak(decodedToken) {
  const keycloakId = decodedToken.sub;
  const email = decodedToken.email;
  const roles = decodedToken.realm_access?.roles || [];

  const role =
    roles.includes("Admin_ROLE") ? "Admin_ROLE" :
    roles.includes("Doctor_ROLE") ? "Doctor_ROLE" :
    "Patient_ROLE";

  let user = await User.findOne({ keycloak_id: keycloakId });

  if (!user) {
    user = await User.create({
      keycloak_id: keycloakId,
      email,
      role
    });
  } else {
    // keep DB updated with Keycloak roles
    user.email = email;
    user.role = role;
    await user.save();
  }

  return user;
}

module.exports = syncUserFromKeycloak;
