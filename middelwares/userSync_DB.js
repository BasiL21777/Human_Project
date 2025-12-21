const User = require("../models/users.model");
const { getUserRealmRoles } = require("./keycloakAdmin");

async function syncUserFromKeycloak(decodedToken) {
  const keycloakId = decodedToken.sub;
  const email = decodedToken.email;

  // Fetch roles directly from Keycloak Admin API
  const realmRoles = await getUserRealmRoles(keycloakId);
  const roleNames = realmRoles.map(r => r.name);

  // Decide role
  let role = "Patient_ROLE";
  if (roleNames.includes("Admin_ROLE")) {
    role = "Admin_ROLE";
  } else if (roleNames.includes("Doctor_ROLE")) {
    role = "Doctor_ROLE";
  }

  let user = await User.findOne({ keycloak_id: keycloakId });

  if (!user) {
    user = await User.create({ keycloak_id: keycloakId, email, role });
  } else {
    user.email = email;
    user.role = role;
    await user.save();
  }

  return user;
}

module.exports = syncUserFromKeycloak;
