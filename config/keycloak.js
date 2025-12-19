require('dotenv').config();
const axios = require('axios');

const KEYCLOAK_BASE_URL = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`;
const TOKEN_URL = `${KEYCLOAK_BASE_URL}/protocol/openid-connect/token`;
const LOGOUT_URL = `${KEYCLOAK_BASE_URL}/protocol/openid-connect/logout`;

module.exports = {
  KEYCLOAK_BASE_URL,
  TOKEN_URL,
  LOGOUT_URL,
  axios
};
