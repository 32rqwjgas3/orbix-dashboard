const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false
}));

// 🔐 Hardcoded credentials
const CLIENT_ID = '1389869831192580247';
const CLIENT_SECRET = 'xUdfQbcKbnNrMiCfSGxlZJULPHfNC81m';
const REDIRECT_URI = 'https://orbix-dashboard.onrender.com/callback';
const BOT_TOKEN = '';

// Home
app.get('/', (req, res) => {
  res.render('index');
});

// Login
app.get('/login', (req, res) => {
  const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify guilds`;
  res.redirect(authorizeUrl);
});

// Callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code provided');

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        scope: 'identify guilds',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    req.session.user = userResponse.data;
    req.session.token = tokenResponse.data.access_token;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.send('OAuth2 Error');
  }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.user || !req.session.token) return res.redirect('/login');

  try {
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${req.session.token}` }
    });

    const adminGuilds = guildsResponse.data.filter(g => (g.permissions & 0x8) === 0x8);
    if (adminGuilds.length === 0) return res.send('You must be an admin in at least one server.');

    const selectedGuild = adminGuilds[0];

    const rolesResponse = await axios.get(`https://discord.com/api/guilds/${selectedGuild.id}/roles`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` }
    });

    const roles = rolesResponse.data
      .filter(role => role.name !== '@everyone')
      .map(role => role.name);

    const commands = [
      { name: 'ban', label: 'Ban Command', enabled: true },
      { name: 'kick', label: 'Kick Command', enabled: true },
      { name: 'warn', label: 'Warn Command', enabled: false },
      { name: 'mute', label: 'Mute Command', enabled: true },
      { name: 'purge', label: 'Purge Messages', enabled: false },
    ];

    res.render('dashboard', { commands, roles, guild: selectedGuild });
  } catch (err) {
    console.error(err);
    res.send('Failed to load dashboard.');
  }
});

// Docs
app.get('/docs', (req, res) => {
  res.send('<h1>Orbix Docs Coming Soon</h1>');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Orbix running on http://localhost:${port}`));







