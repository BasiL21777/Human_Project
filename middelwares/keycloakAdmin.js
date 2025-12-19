const axios = require("axios");
require("dotenv").config();

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const REALM = process.env.KEYCLOAK_REALM;
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

async function getAdminToken() {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await axios.post(
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
    params
  );

  return res.data.access_token;
}

async function assignRealmRoleToUser(keycloakId, roleName) {
  const token = await getAdminToken();

  // 1. Get the full role object from Keycloak
  const rolesRes = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${roleName}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const roleObject = rolesRes.data;

  // 2. Assign the role to the user
  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${keycloakId}/role-mappings/realm`,
    [roleObject],
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

async function removeRealmRoleFromUser(keycloakId, roleName) {
  const token = await getAdminToken();

  // 1. Get the full role object from Keycloak
  const rolesRes = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${roleName}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const roleObject = rolesRes.data;

  // 2. Remove the role from the user
  await axios.delete(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${keycloakId}/role-mappings/realm`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: [roleObject], // DELETE requires body with role object
    }
  );
}

async function updateKeycloakUser(keycloakId, data) {
  const token = await getAdminToken();

  await axios.put(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${keycloakId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = {
  updateKeycloakUser,
  assignRealmRoleToUser,
  removeRealmRoleFromUser
};
