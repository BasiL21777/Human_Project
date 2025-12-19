require('dotenv').config();
const { TOKEN_URL, LOGOUT_URL, axios } = require('../config/keycloak');

// 1. Redirect user to Keycloak login
exports.login = (req, res) => {
  const redirectUri = encodeURIComponent(process.env.KEYCLOAK_REDIRECT_URI);

  const loginUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth` +
    `?client_id=${process.env.KEYCLOAK_CLIENT_ID}` +
    `&response_type=code` +
    `&scope=openid` +
    `&redirect_uri=${redirectUri}`;

  res.redirect(loginUrl);
};

// 2. Handle callback and exchange code for tokens
exports.callback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.KEYCLOAK_CLIENT_ID);
    params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', process.env.KEYCLOAK_REDIRECT_URI);

    const response = await axios.post(TOKEN_URL, params);

    return res.status(200).json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      id_token: response.data.id_token,
      expires_in: response.data.expires_in
    });

  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Token exchange failed' });
  }
};

// 3. Refresh token
exports.refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token missing' });
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', process.env.KEYCLOAK_CLIENT_ID);
    params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET);
    params.append('refresh_token', refresh_token);

    const response = await axios.post(TOKEN_URL, params);

    return res.status(200).json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in
    });

  } catch (err) {
    console.error('Refresh error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
};

// 4. Logout
exports.logout = async (req, res) => {
  const { refresh_token } = req.query;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token required for logout' });
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.KEYCLOAK_CLIENT_ID);
    params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET);
    params.append('refresh_token', refresh_token);

    await axios.post(LOGOUT_URL, params);

    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (err) {
    console.error('Logout error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Logout failed' });
  }
};
