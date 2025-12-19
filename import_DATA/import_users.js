const axios = require("axios");
const XLSX = require("xlsx");

// =========================
// CONFIG
// =========================
const KEYCLOAK_URL = "http://localhost:8080";
const REALM = "hospital-system";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin"; // change in production

// =========================
// 1. Get Admin Token
// =========================
async function getAdminToken() {
  const url = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;

  const params = new URLSearchParams();
  params.append("client_id", "admin-cli");
  params.append("grant_type", "password");
  params.append("username", ADMIN_USERNAME);
  params.append("password", ADMIN_PASSWORD);

  try {
    const resp = await axios.post(url, params);
    return resp.data.access_token;
  } catch (err) {
    console.error("Failed to get admin token:", err.response?.data || err.message);
    return null;
  }
}

// =========================
// 2. Create User
// =========================
async function createUser(token, username, email, password, role) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Step 1: Create user
  const payload = {
    username,
    email,
    enabled: true,
    credentials: [
      {
        type: "password",
        value: password,
        temporary: false,
      },
    ],
  };

  try {
    const createUrl = `${KEYCLOAK_URL}/admin/realms/${REALM}/users`;
    const resp = await axios.post(createUrl, payload, { headers });

    if (![201, 409].includes(resp.status)) {
      console.error(`Error creating user ${username}:`, resp.data);
      return;
    }
  } catch (err) {
    if (err.response?.status !== 409) {
      console.error(`Error creating user ${username}:`, err.response?.data || err.message);
      return;
    }
  }

  // Step 2: Get user ID
  const getUrl = `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${username}`;
  const userResp = await axios.get(getUrl, { headers });

  if (!userResp.data.length) {
    console.error(`Could not fetch user ID for ${username}`);
    return;
  }

  const userId = userResp.data[0].id;

  // Step 3: Assign role
  const roleUrl = `${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${role}`;
  const roleObj = (await axios.get(roleUrl, { headers })).data;

  const assignUrl = `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`;
  await axios.post(assignUrl, [roleObj], { headers });

  console.log(`User ${username} created and assigned role ${role}`);
}

// =========================
// 3. Import Users from Excel
// =========================
async function importUsersFromExcel() {
  const token = await getAdminToken();
  if (!token) {
    console.log("Cannot continue without admin token");
    return;
  }

  const workbook = XLSX.readFile("users.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await createUser(token, row.username, row.email, row.password, row.role);
  }
}

// =========================
// RUN SCRIPT
// =========================
(async () => {
  await importUsersFromExcel();
  console.log("User import completed.");
})();
