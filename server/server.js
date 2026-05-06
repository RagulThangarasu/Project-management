const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

let db;

async function initDB() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS sprints (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS task_lists (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS time_logs (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY, 
      email TEXT UNIQUE, 
      token TEXT, 
      status TEXT DEFAULT 'pending'
    );
  `);
}

require('dotenv').config();

// Nodemailer setup - CONFIGURE YOUR SMTP CREDENTIALS IN .env
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Standard for Office 365 / Outlook
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const tasks = (await db.all('SELECT data FROM tasks')).map(r => JSON.parse(r.data));
    const sprints = (await db.all('SELECT data FROM sprints')).map(r => JSON.parse(r.data));
    const taskLists = (await db.all('SELECT data FROM task_lists')).map(r => JSON.parse(r.data));
    const timeLogs = (await db.all('SELECT data FROM time_logs')).map(r => JSON.parse(r.data));
    const users = (await db.all('SELECT data FROM users')).map(r => JSON.parse(r.data));
    
    res.json({ tasks, sprints, taskLists, timeLogs, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const task = req.body;
  await db.run('INSERT OR REPLACE INTO tasks (id, data) VALUES (?, ?)', [task.id, JSON.stringify(task)]);
  res.json(task);
});

app.put('/api/tasks/:id', async (req, res) => {
  const task = req.body;
  await db.run('UPDATE tasks SET data = ? WHERE id = ?', [JSON.stringify(task), req.params.id]);
  res.json(task);
});

app.delete('/api/tasks/:id', async (req, res) => {
  await db.run('DELETE FROM tasks WHERE id = ?', req.params.id);
  res.json({ success: true });
});

app.post('/api/tasks/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || ids.length === 0) return res.json({ success: true });
  const placeholders = ids.map(() => '?').join(',');
  await db.run(`DELETE FROM tasks WHERE id IN (${placeholders})`, ids);
  res.json({ success: true });
});

app.post('/api/sprints', async (req, res) => {
  const sprint = req.body;
  await db.run('INSERT OR REPLACE INTO sprints (id, data) VALUES (?, ?)', [sprint.id, JSON.stringify(sprint)]);
  res.json(sprint);
});

app.post('/api/task_lists', async (req, res) => {
  const tl = req.body;
  await db.run('INSERT OR REPLACE INTO task_lists (id, data) VALUES (?, ?)', [tl.id, JSON.stringify(tl)]);
  res.json(tl);
});

app.post('/api/time_logs', async (req, res) => {
  const log = req.body;
  await db.run('INSERT OR REPLACE INTO time_logs (id, data) VALUES (?, ?)', [log.id, JSON.stringify(log)]);
  res.json(log);
});

app.post('/api/users', async (req, res) => {
  const u = req.body;
  await db.run('INSERT OR REPLACE INTO users (id, data) VALUES (?, ?)', [u.id, JSON.stringify(u)]);
  res.json(u);
});

app.get('/api/invites', async (req, res) => {
  try {
    const invites = await db.all('SELECT email, status, token FROM invites');
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invites', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const token = crypto.randomBytes(32).toString('hex');
    const id = Date.now().toString();

    await db.run(
      'INSERT OR REPLACE INTO invites (id, email, token, status) VALUES (?, ?, ?, ?)', 
      [id, cleanEmail, token, 'pending']
    );

    // Construct accept link (dynamically using FRONTEND_URL environment variable)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const acceptLink = `${frontendUrl}/accept-invite?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    const mailOptions = {
      from: `"Hashout Projects" <${process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: "You've been invited to Hashout Project Management",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Hello!</h2>
          <p>You have been invited to join the Hashout Project Management portal.</p>
          <p>To access the dashboard, please accept the invitation by clicking the button below:</p>
          <a href="${acceptLink}" style="display: inline-block; padding: 10px 20px; background-color: #f0481d; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0;">Accept Invitation</a>
          <p>If you did not expect this invitation, you can ignore this email.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ SMTP Error:", error);
      } else {
        console.log("✅ Email sent successfully:", info.response);
      }
    });

    res.json({ email: cleanEmail, status: 'pending', acceptLink: acceptLink });
  } catch (error) {
    console.error("❌ Invitation API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invites/verify', async (req, res) => {
  const { email, token } = req.query;
  const invite = await db.get('SELECT * FROM invites WHERE email = ? AND token = ?', [email, token]);
  if (invite) {
    await db.run('UPDATE invites SET status = ? WHERE email = ?', ['accepted', email]);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid or expired invitation token.' });
  }
});

app.delete('/api/invites/:email', async (req, res) => {
  try {
    await db.run('DELETE FROM invites WHERE email = ?', req.params.email.toLowerCase().trim());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed endpoint (optional, called if UI has no data)
app.post('/api/seed', async (req, res) => {
  const { tasks, sprints, taskLists, timeLogs, users } = req.body;
  
  try {
    for (const t of tasks || []) await db.run('INSERT OR REPLACE INTO tasks (id, data) VALUES (?, ?)', [t.id, JSON.stringify(t)]);
    for (const s of sprints || []) await db.run('INSERT OR REPLACE INTO sprints (id, data) VALUES (?, ?)', [s.id, JSON.stringify(s)]);
    for (const tl of taskLists || []) await db.run('INSERT OR REPLACE INTO task_lists (id, data) VALUES (?, ?)', [tl.id, JSON.stringify(tl)]);
    for (const log of timeLogs || []) await db.run('INSERT OR REPLACE INTO time_logs (id, data) VALUES (?, ?)', [log.id, JSON.stringify(log)]);
    for (const u of users || []) await db.run('INSERT OR REPLACE INTO users (id, data) VALUES (?, ?)', [u.id, JSON.stringify(u)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDB().then(() => {
  app.listen(3001, () => {
    console.log('Backend server running on http://localhost:3001');
  });
});
