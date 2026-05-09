const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, data TEXT);
    CREATE TABLE IF NOT EXISTS reset_tokens (email TEXT PRIMARY KEY, token TEXT, expires INTEGER);
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY, 
      email TEXT UNIQUE, 
      token TEXT, 
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending'
    );
  `);
}

require('dotenv').config();

// Nodemailer setup - CONFIGURE YOUR SMTP CREDENTIALS IN .env
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,   // 10 seconds
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ SMTP Connection Error:", error);
  } else {
    console.log("✅ SMTP Server is ready to take our messages");
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const tasks = (await db.all('SELECT data FROM tasks')).map(r => JSON.parse(r.data));
    const sprints = (await db.all('SELECT data FROM sprints')).map(r => JSON.parse(r.data));
    const taskLists = (await db.all('SELECT data FROM task_lists')).map(r => JSON.parse(r.data));
    const timeLogs = (await db.all('SELECT data FROM time_logs')).map(r => JSON.parse(r.data));
    const users = (await db.all('SELECT data FROM users')).map(r => JSON.parse(r.data));
    const projects = (await db.all('SELECT data FROM projects')).map(r => JSON.parse(r.data));
    
    res.json({ tasks, sprints, taskLists, timeLogs, users, projects });
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

app.post('/api/projects', async (req, res) => {
  const project = req.body;
  await db.run('INSERT OR REPLACE INTO projects (id, data) VALUES (?, ?)', [project.id, JSON.stringify(project)]);
  res.json(project);
});

app.delete('/api/projects/:id', async (req, res) => {
  await db.run('DELETE FROM projects WHERE id = ?', req.params.id);
  res.json({ success: true });
});

app.post('/api/users', async (req, res) => {
  const u = req.body;
  const existing = await db.get('SELECT * FROM users WHERE email = ?', u.email);
  if (existing) {
    await db.run('UPDATE users SET data = ? WHERE email = ?', [JSON.stringify(u), u.email]);
  } else {
    // Default password for new users is 'password123'
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.run('INSERT INTO users (id, email, password, data) VALUES (?, ?, ?, ?)', [u.id, u.email, hashedPassword, JSON.stringify(u)]);
  }
  res.json(u);
});

// AUTH ENDPOINTS
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json(JSON.parse(user.data));
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());
  
  if (!user) {
    // Don't reveal if user exists, but for this dev app we'll be helpful
    return res.status(404).json({ error: 'User not found' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour
  await db.run('INSERT OR REPLACE INTO reset_tokens (email, token, expires) VALUES (?, ?, ?)', [email.toLowerCase(), token, expires]);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: `"Hashout Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your Hashout Password",
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #0f0a1a; color: #fff;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #f0481d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email', details: err.message, link: resetLink });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  const record = await db.get('SELECT * FROM reset_tokens WHERE email = ? AND token = ?', [email.toLowerCase(), token]);

  if (!record || record.expires < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.toLowerCase()]);
  await db.run('DELETE FROM reset_tokens WHERE email = ?', email.toLowerCase());

  res.json({ success: true });
});

app.get('/api/invites', async (req, res) => {
  try {
    const invites = await db.all('SELECT email, status, token, role FROM invites');
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invites', async (req, res) => {
  try {
    const { email, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const inviteRole = role || 'member';
    const token = crypto.randomBytes(32).toString('hex');
    const id = Date.now().toString();

    await db.run(
      'INSERT OR REPLACE INTO invites (id, email, token, status, role) VALUES (?, ?, ?, ?, ?)', 
      [id, cleanEmail, token, 'pending', inviteRole]
    );

    // Construct accept link (dynamically using FRONTEND_URL environment variable)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const acceptLink = `${frontendUrl}/accept-invite?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    const mailOptions = {
      from: `"Hashout Projects" <${process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: "You've been invited to Hashout Project Management",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0a1a; padding: 40px 20px; color: #fff; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1a1425; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
            
            <!-- Header with Logo -->
            <div style="background-color: #3a1d5d; padding: 30px; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <img src="https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg" alt="Hashout Tech" style="height: 32px; filter: brightness(0) invert(1);" />
            </div>

            <!-- Content Area -->
            <div style="padding: 40px; text-align: left;">
              <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #fff;">You're Invited!</h1>
              <p style="font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 30px;">
                Hello, <br/><br/>
                You have been invited to join the <strong>Hashout Project Management</strong> workspace. Access real-time dashboards, track your assigned tasks, and collaborate with your team efficiently.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${acceptLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f0481d, #ff7043); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 16px rgba(240, 72, 29, 0.3);">Accept Invitation</a>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                If the button above doesn't work, copy and paste this link into your browser:<br/>
                <a href="${acceptLink}" style="color: #f0481d; text-decoration: none; word-break: break-all;">${acceptLink}</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="padding: 20px; background-color: rgba(255,255,255,0.02); text-align: center; font-size: 12px; color: #475569;">
              © ${new Date().getFullYear()} Hashout Tech. All rights reserved. <br/>
              Strictly for authorized @hashouttech.com users.
            </div>
          </div>
        </div>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", info.response);
      res.json({ email: cleanEmail, status: 'pending', acceptLink: acceptLink });
    } catch (mailError) {
      console.error("❌ SMTP Error while sending invite:", mailError);
      // Still return the link so the admin can manually share it if email fails
      res.json({ 
        email: cleanEmail, 
        status: 'pending', 
        acceptLink: acceptLink,
        warning: "Email could not be sent, but the invitation was created."
      });
    }
  } catch (error) {
    console.error("❌ Invitation API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invites/verify', async (req, res) => {
  const { email, token } = req.query;
  const invite = await db.get('SELECT * FROM invites WHERE email = ? AND token = ?', [email, token]);
  if (invite) {
    // We don't mark as accepted here yet, we'll do it when account is created or just leave it
    // But returning the role is key
    res.json({ success: true, role: invite.role });
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
  const { tasks, sprints, taskLists, timeLogs, users, projects } = req.body;
  
  try {
    for (const t of tasks || []) await db.run('INSERT OR REPLACE INTO tasks (id, data) VALUES (?, ?)', [t.id, JSON.stringify(t)]);
    for (const s of sprints || []) await db.run('INSERT OR REPLACE INTO sprints (id, data) VALUES (?, ?)', [s.id, JSON.stringify(s)]);
    for (const tl of taskLists || []) await db.run('INSERT OR REPLACE INTO task_lists (id, data) VALUES (?, ?)', [tl.id, JSON.stringify(tl)]);
    for (const log of timeLogs || []) await db.run('INSERT OR REPLACE INTO time_logs (id, data) VALUES (?, ?)', [log.id, JSON.stringify(log)]);
    for (const p of projects || []) await db.run('INSERT OR REPLACE INTO projects (id, data) VALUES (?, ?)', [p.id, JSON.stringify(p)]);
    for (const u of users || []) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.run('INSERT OR REPLACE INTO users (id, email, password, data) VALUES (?, ?, ?, ?)', [u.id, u.email, hashedPassword, JSON.stringify(u)]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDB().then(() => {
  const port = 3001;
  const server = app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    console.error('❌ Server startup error:', err);
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Please kill the process or use a different port.`);
    }
  });

  // Keep the process alive just in case something is draining the event loop
  setInterval(() => {}, 1000000);

}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
});
