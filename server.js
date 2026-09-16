const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const publishedRoutes = require('./routes/published');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/published', publishedRoutes);
// Clean URL redirects: permanently redirect .html to extensionless URLs
app.get('/app.html', (req, res) => {
  res.redirect(301, '/app');
});

app.get('/index.html', (req, res) => {
  res.redirect(301, '/login');
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/landing.html', (req, res) => {
  res.redirect(301, '/');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/logo.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'logo.png'));
});

app.use(express.static(publicDir, { index: false }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Endpoint not found.' });
  }
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`OmniAnima server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
