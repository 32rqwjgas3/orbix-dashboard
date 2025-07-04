require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Load environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

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
  res.redirect(authorizeUrl);
});

// OAuth2 callback
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
    console.error(err.response?.data || err.message);
    res.send('Authentication failed.');
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



