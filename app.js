require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Load environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
// Hardcoded to avoid newline issues
const REDIRECT_URI = "https://orbix-dashboard.onrender.com/callback";

// Debug logs
console.log("CLIENT_ID:", CLIENT_ID);
console.log("REDIRECT_URI:", REDIRECT_URI);

// Set up EJS and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Home page
app.get('/', (req, res) => {
  res.render('index');
});

// Login route
app.get('/login', (req, res) => {
  const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
  console.log("Generated OAuth2 URL:", authorizeUrl);
  res.redirect(authorizeUrl);
});

// OAuth2 callback route
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
        scope: 'identify',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`,
      },
    });

    const user = userResponse.data;
    res.send(`
      <h1>Welcome, ${user.username}#${user.discriminator}</h1>
      <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" width="100" />
    `);
  } catch (err) {
    console.error("OAuth2 Error:", err.response?.data || err.message);
    res.send(`<pre>Authentication failed.\n\n${JSON.stringify(err.response?.data || err.message, null, 2)}</pre>`);
  }
});

// Docs placeholder
app.get('/docs', (req, res) => {
  res.send('<h1>Orbix Documentation Coming Soon</h1>');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Orbix Dashboard running at http://localhost:${port}`);
});



app.get('/dashboard', (req, res) => {
  const commands = [
    { name: 'ban', label: 'Ban Command', enabled: true },
    { name: 'kick', label: 'Kick Command', enabled: true },
    { name: 'warn', label: 'Warn Command', enabled: false },
    { name: 'mute', label: 'Mute Command', enabled: true },
    { name: 'purge', label: 'Purge Messages', enabled: false },
  ];
  res.render('dashboard', { commands });
});




