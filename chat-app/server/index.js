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

const crypto = require("crypto");
const key = process.env.ENCRYPTION_KEY; // 32 символа

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

async function initDB() {
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    username TEXT,
    text TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS direct_messages (
    id SERIAL PRIMARY KEY,
    sender TEXT,
    receiver TEXT,
    text TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

initDB().catch(console.error);

const bcrypt = require("bcrypt");

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashedPassword]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Username exists" });
  }
});

const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await db.query(
    "SELECT * FROM users WHERE username = $1",
    [username]
  );

  const row = result.rows[0];

  if (!row) return res.status(400).json({ error: "User not found" });

  const match = await bcrypt.compare(password, row.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ username }, SECRET);
  res.json({ token, username, id: row.id });
});

app.get("/users/:username", async (req, res) => {
  const { username } = req.params;
  const result = await db.query(
    "SELECT username, bio, status, avatar_url FROM users WHERE username = $1",
    [username]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "User not found" });
  res.json(result.rows[0]);
});

app.patch("/users/:username", async (req, res) => {
  const { username } = req.params;
  const { bio, status, avatar_url, newUsername } = req.body;
  
  try {
    if (newUsername) {
      await db.query("UPDATE users SET username = $1 WHERE username = $2", [newUsername, username]);
    }
    await db.query(
      "UPDATE users SET bio = $1, status = $2, avatar_url = $3 WHERE username = $4",
      [bio, status, avatar_url, newUsername || username]
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

io.on("connection", (socket) => {
  socket.onAny((event, ...args) => {
  });
  (async () => {
    const result = await db.query(`
      SELECT m.id, m.text, m.timestamp, u.username, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.id ASC
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
    const userResult = await db.query("SELECT id FROM users WHERE username = $1", [msg.username]);
    const userId = userResult.rows[0].id;
    const avatarUrl = userResult.rows[0].avatar_url;
    const result = await db.query(
      "INSERT INTO messages (user_id, text) VALUES ($1, $2) RETURNING *",
      [userId, encrypt(msg.text)]
    );

    const savedMsg = result.rows[0];

    io.emit("receive_message", { ...savedMsg, text: msg.text, username: msg.username, user_id: userId, avatar_url: avatarUrl });
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("stop_typing");
  });

  socket.on("disconnect", () => {
    const user = Object.keys(onlineUsers).find(key => onlineUsers[key] === socket.id);
    if (user) delete onlineUsers[user];
  });

  socket.on("set_user", (username) => {
    onlineUsers[username] = socket.id;
  });

  socket.on("send_direct_message", async (msg) => {
    const { sender, receiver, text } = msg;
    
    try {
      const senderResult = await db.query("SELECT id FROM users WHERE username = $1", [sender]);
      const receiverResult = await db.query("SELECT id FROM users WHERE username = $1", [receiver]);
      const senderId = senderResult.rows[0].id;
      const receiverId = receiverResult.rows[0].id;
      console.log("sender:", sender, "senderId:", senderId);
      console.log("receiver:", receiver, "receiverId:", receiverId);
      const encrypted = encrypt(text);
      const result = await db.query(
        "INSERT INTO direct_messages (sender_id, receiver_id, text) VALUES ($1, $2, $3) RETURNING *",
        [senderId, receiverId, encrypted]
      );

      const savedMsg = result.rows[0];
      const receiverSocketId = onlineUsers[receiver];
      console.log("receiverSocketId:", receiverSocketId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_direct_message", { ...savedMsg, text, sender, receiver });
      }
    } catch (err) {
      console.error("Error saving direct message:", err);
    }
  });

  socket.on("load_direct_messages", ({ user1, user2 }) => {
    db.query(`
      SELECT dm.id, dm.text, dm.timestamp, s.username as sender, r.username as receiver, s.avatar_url as sender_avatar
      FROM direct_messages dm
      JOIN users s ON dm.sender_id = s.id
      JOIN users r ON dm.receiver_id = r.id
      WHERE (s.username = $1 AND r.username = $2) OR (s.username = $2 AND r.username = $1)
      ORDER BY dm.id ASC
    `, [user1, user2], (err, result) => {
    if (!err) {
      const decrypted = result.rows.map(row => {
        try {
          return { ...row, text: decrypt(row.text) };
        } catch (e) {
          return { ...row, text: row.text };
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
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

