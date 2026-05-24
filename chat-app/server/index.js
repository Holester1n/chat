require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const onlineUsers = {};
const { Pool } = require("pg");

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, code) => {
  await resend.emails.send({
    from: "noreply@fluxly.me",
    to: email,
    subject: "Подтверждение регистрации в Fluxly",
    html: `<p>Ваш код подтверждения: <b>${code}</b></p>`
  });
};

const crypto = require("crypto");
const key = Buffer.from(process.env.ENCRYPTION_KEY, "utf8");

const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
};

const decrypt = (text) => {
    const [iv, encrypted] = text.split(":");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));
    return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
};

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const bcrypt = require("bcrypt");

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await db.query(
      "INSERT INTO users (username, email, password, verification_code, verified) VALUES ($1, $2, $3, $4, FALSE)",
      [username, email, hashedPassword, code]
    );
    try {
      await sendVerificationEmail(email, code);
    } catch (mailErr) {
      console.error("Mail error:", mailErr);
      return res.status(500).json({ error: "Failed to send email: " + mailErr.message });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Username or email already exists" });
  }
});

app.post("/verify", async (req, res) => {
  const { email, code } = req.body;
  const result = await db.query(
    "SELECT * FROM users WHERE email = $1 AND verification_code = $2",
    [email, code]
  );
  if (!result.rows[0]) return res.status(400).json({ error: "Invalid code" });
  
  await db.query(
    "UPDATE users SET verified = TRUE, verification_code = NULL WHERE email = $1",
    [email]
  );
  res.json({ success: true });
});

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  const row = result.rows[0];

  if (!row) return res.status(400).json({ error: "User not found" });
  if (!row.verified) return res.status(400).json({ error: "Email not verified" });

  const match = await bcrypt.compare(password, row.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ username: row.username }, SECRET);
  res.json({ token, username: row.username, id: row.id });
});

app.get("/users/:username", async (req, res) => {
  const { username } = req.params;
  const result = await db.query(
    "SELECT username, bio, avatar_url FROM users WHERE username = $1",
    [username]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "User not found" });
  res.json(result.rows[0]);
});

app.patch("/users/:username", async (req, res) => {
  const { username } = req.params;
  const { bio, avatar_url, newUsername } = req.body;
  
  try {
    await db.query(
      "UPDATE users SET username = COALESCE($1, username), bio = $2, avatar_url = $3 WHERE username = $4",
      [newUsername || null, bio, avatar_url, username]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/conversations/:username", async (req, res) => {
  const { username } = req.params;
  const result = await db.query(`
    SELECT DISTINCT 
      CASE WHEN s.username = $1 THEN r.username ELSE s.username END as username,
      CASE WHEN s.username = $1 THEN r.avatar_url ELSE s.avatar_url END as avatar_url
    FROM direct_messages dm
    JOIN users s ON dm.sender_id = s.id
    JOIN users r ON dm.receiver_id = r.id
    WHERE s.username = $1 OR r.username = $1
  `, [username]);
  res.json(result.rows);
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  if (!result.rows[0]) return res.status(400).json({ error: "Email not found" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await db.query("UPDATE users SET reset_code = $1 WHERE email = $2", [code, email]);

  try {
    await resend.emails.send({
      from: "noreply@fluxly.me",
      to: email,
      subject: "Сброс пароля Fluxly",
      html: `<p>Ваш код для сброса пароля: <b>${code}</b></p>`
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ error: "Failed to send email" + err.message });
  }
});

app.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  const result = await db.query(
    "SELECT * FROM users WHERE email = $1 AND reset_code = $2",
    [email, code]
  );
  if (!result.rows[0]) return res.status(400).json({ error: "Invalid code" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query(
    "UPDATE users SET password = $1, reset_code = NULL WHERE email = $2",
    [hashed, email]
  );
  res.json({ success: true });
});

io.on("connection", (socket) => {
  (async () => {
    const result = await db.query(`
      SELECT m.id, m.text, m.timestamp, u.username, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.id ASC
      LIMIT 100
    `);
    const decrypted = result.rows.map(row => {
      try {
        return { ...row, text: decrypt(row.text) };
      } catch (e) {
        return { ...row, text: row.text };
      }
    });
    socket.emit("load_messages", decrypted);
  })();

  socket.on("send_message", async (msg) => {
    const user = onlineUsers[msg.username];
    if (!user) return;

    const result = await db.query(
      "INSERT INTO messages (user_id, text) VALUES ($1, $2) RETURNING *",
      [user.id, encrypt(msg.text)]
    );

    const savedMsg = result.rows[0];
    io.emit("receive_message", { ...savedMsg, text: msg.text, username: msg.username, user_id: user.id, avatar_url: user.avatar_url });
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("stop_typing");
  });

  socket.on("disconnect", () => {
    const user = Object.keys(onlineUsers).find(key => onlineUsers[key].socketId === socket.id);
    if (user) delete onlineUsers[user];
  });

  socket.on("set_user", async (username) => {
    const result = await db.query("SELECT id, avatar_url FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    if (user) {
      onlineUsers[username] = { socketId: socket.id, id: user.id, avatar_url: user.avatar_url };
    }
  });

  socket.on("send_direct_message", async (msg) => {
    const { sender, receiver, text, fileUrl, fileName } = msg;

    try {
      const senderUser = onlineUsers[sender];

      let receiverId;
      let receiverSocketId;
      
      if (onlineUsers[receiver]) {
        receiverId = onlineUsers[receiver].id;
        receiverSocketId = onlineUsers[receiver].socketId;
      } else {
        const result = await db.query("SELECT id FROM users WHERE username = $1", [receiver]);
        receiverId = result.rows[0]?.id;
      }

      const encrypted = text ? encrypt(text) : null;
      const result = await db.query(
        "INSERT INTO direct_messages (sender_id, receiver_id, text, file_url, file_name) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [senderUser.id, receiverId, encrypted, fileUrl || null, fileName || null]
      );

      const savedMsg = result.rows[0];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_direct_message", { 
          ...savedMsg, 
          text, 
          sender, 
          receiver,
          fileUrl: savedMsg.file_url,
          fileName: savedMsg.file_name,
          isFile: !!savedMsg.file_url,
        });
      }
    } catch (err) {
      console.error("Error saving direct message:", err);
    }
  });

  socket.on("load_direct_messages", ({ user1, user2 }) => {
    db.query(`
      SELECT dm.id, dm.text, dm.timestamp, dm.file_url, dm.file_name,
             s.username as sender, r.username as receiver, s.avatar_url as sender_avatar
      FROM direct_messages dm
      JOIN users s ON dm.sender_id = s.id
      JOIN users r ON dm.receiver_id = r.id
      WHERE (s.username = $1 AND r.username = $2) OR (s.username = $2 AND r.username = $1)
      ORDER BY dm.id ASC
    `, [user1, user2], (err, result) => {
      if (!err) {
        const decrypted = result.rows.map(row => {
          try {
            return { 
              ...row, 
              text: row.text ? decrypt(row.text) : null,
              fileUrl: row.file_url,
              fileName: row.file_name,
              isFile: !!row.file_url,
            };
          } catch (e) {
            return { ...row, fileUrl: row.file_url, fileName: row.file_name, isFile: !!row.file_url };
          }
        });
        socket.emit("direct_messages_loaded", decrypted);
      }
    });
  });

});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/users", async (req, res) => {
  const { search } = req.query;
  if (search) {
    const result = await db.query(
      "SELECT username, avatar_url FROM users WHERE username ILIKE $1",
      [`%${search}%`]
    );
    return res.json(result.rows);
  }
  const result = await db.query("SELECT username FROM users");
  res.json(result.rows);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

