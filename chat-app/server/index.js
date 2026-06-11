require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Resend } = require("resend");
const { Pool } = require("pg");

const onlineUsers = {};

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, code) => {
  await resend.emails.send({
    from: "noreply@fluxly.me",
    to: email,
    subject: "Подтверждение регистрации в Fluxly",
    html: `<p>Ваш код подтверждения: <b>${code}</b></p>`,
  });
};

const removeUser = (socketId) => {
  const username = Object.keys(onlineUsers).find(
    (key) => onlineUsers[key].socketId === socketId
  );
  if (username) {
    db.query("UPDATE users SET last_seen = NOW() WHERE username = $1", [
      username,
    ]);
    delete onlineUsers[username];
    io.emit("online_users", Object.keys(onlineUsers));
  }
};

const crypto = require("crypto");
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
if (key.length !== 32) {
  throw new Error(`ENCRYPTION_KEY must be 32 bytes (64 hex chars), got ${key.length}`);
}

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decrypt = (text) => {
  const [iv, encrypted] = text.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(iv, "hex")
  );
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
};

const ALLOWED_ORIGINS = ["https://fluxly.me", "http://localhost:3001", "https://chat-ashen-gamma-22.vercel.app"];

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.use("/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts, try again later" }
}));

app.use("/register", rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many registrations, try again later" }
}));

app.use("/forgot-password", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many attempts, try again later" }
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS }
});

const bcrypt = require("bcrypt");

app.post("/register", async (req, res) => {
  const { username, email, password, captchaToken } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: captchaToken
    })
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
      return res.status(400).json({ error: 'Капча не пройдена' });
  }
  try {
    await db.query(
      "INSERT INTO users (username, email, password, verification_code, verified) VALUES ($1, $2, $3, $4, FALSE)",
      [username, email, hashedPassword, code]
    );
    try {
      await sendVerificationEmail(email, code);
    } catch (mailErr) {
      console.error("Mail error:", mailErr);
      return res
        .status(500)
        .json({ error: "Failed to send email: " });
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

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await db.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  const row = result.rows[0];

  if (!row) return res.status(400).json({ error: "User not found" });
  if (!row.verified)
    return res.status(400).json({ error: "Email not verified" });

  const match = await bcrypt.compare(password, row.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ username: row.username }, SECRET, { expiresIn: "7d" })
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

app.patch("/users/:username", authMiddleware, async (req, res) => {
  const { username } = req.params;

  if (req.user.username !== username) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { bio, avatar_url, newUsername } = req.body;
  try {
    await db.query(
      "UPDATE users SET username = COALESCE($1, username), bio = $2, avatar_url = $3 WHERE username = $4",
      [newUsername || null, bio, avatar_url, username]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to update profile" });
  }
});

app.get("/conversations/:username", async (req, res) => {
  const { username } = req.params;
  const result = await db.query(`
    SELECT DISTINCT ON (other_user) 
      other_user as username,
      other_avatar as avatar_url,
      other_last_seen as last_seen,
      (
        SELECT COUNT(*) FROM direct_messages dm2
        JOIN users s2 ON dm2.sender_id = s2.id
        JOIN users r2 ON dm2.receiver_id = r2.id
        WHERE r2.username = $1 
          AND s2.username = other_user
          AND dm2.is_read = FALSE
      ) as unread_count
    FROM (
      SELECT 
        CASE WHEN s.username = $1 THEN r.username ELSE s.username END as other_user,
        CASE WHEN s.username = $1 THEN r.avatar_url ELSE s.avatar_url END as other_avatar,
        CASE WHEN s.username = $1 THEN r.last_seen ELSE s.last_seen END as other_last_seen
      FROM direct_messages dm
      JOIN users s ON dm.sender_id = s.id
      JOIN users r ON dm.receiver_id = r.id
      WHERE s.username = $1 OR r.username = $1
    ) sub
  `, [username]);
  res.json(result.rows);
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const result = await db.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (!result.rows[0])
    return res.status(400).json({ error: "Email not found" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await db.query("UPDATE users SET reset_code = $1 WHERE email = $2", [
    code,
    email,
  ]);

  try {
    await resend.emails.send({
      from: "noreply@fluxly.me",
      to: email,
      subject: "Сброс пароля Fluxly",
      html: `<p>Ваш код для сброса пароля: <b>${code}</b></p>`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ error: "Failed to send email" });
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

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));
  try {
    socket.user = jwt.verify(token, SECRET);
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.onAny(async (event) => {
    const username = socket.user?.username;
    if (!username || onlineUsers[username]) return;

    const result = await db.query(
      "SELECT id, avatar_url FROM users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];
    if (user) {
      onlineUsers[username] = {
        socketId: socket.id,
        id: user.id,
        avatar_url: user.avatar_url,
      };
      db.query("UPDATE users SET last_seen = NULL WHERE username = $1", [username]);
      io.emit("online_users", Object.keys(onlineUsers));
    }
  });
  
  (async () => {
    const result = await db.query(`
      SELECT m.id, m.text, m.timestamp, u.username, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.id ASC
      LIMIT 100
    `);
    const decrypted = result.rows.map((row) => {
      try {
        return { ...row, text: decrypt(row.text) };
      } catch (e) {
        return { ...row, text: row.text };
      }
    });
    socket.emit("load_messages", decrypted);
  })();

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("stop_typing");
  });

  socket.on("set_user", async () => {
    const username = socket.user.username;
    const result = await db.query(
      "SELECT id, avatar_url FROM users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];
    if (user) {
      onlineUsers[username] = {
        socketId: socket.id,
        id: user.id,
        avatar_url: user.avatar_url,
      };
      db.query("UPDATE users SET last_seen = NULL WHERE username = $1", [
        username,
      ]);
    }
    io.emit("online_users", Object.keys(onlineUsers));
  });

  socket.on("logout", () => removeUser(socket.id));

  socket.on("disconnect", () => removeUser(socket.id));

  socket.on("send_direct_message", async (msg) => {
    const { receiver, text, fileUrl, fileName, reply_to, reply_quote, reply_author } = msg;
    const sender = socket.user.username;
    try {
      let senderId = onlineUsers[sender]?.id;
      let senderAvatarUrl = onlineUsers[sender]?.avatar_url;

      if (!senderId) {
        const senderResult = await db.query(
          "SELECT id, avatar_url FROM users WHERE username = $1",
          [sender]
        );
        senderId = senderResult.rows[0]?.id;
        senderAvatarUrl = senderResult.rows[0]?.avatar_url;
      }

      let receiverId;
      let receiverSocketId;

      if (onlineUsers[receiver]) {
        receiverId = onlineUsers[receiver].id;
        receiverSocketId = onlineUsers[receiver].socketId;
      } else {
        const result = await db.query(
          "SELECT id FROM users WHERE username = $1",
          [receiver]
        );
        receiverId = result.rows[0]?.id;
      }

      if (!senderId || !receiverId) {
        console.error("Sender or receiver not found");
        return;
      }

      const encrypted = text ? encrypt(text) : null;
      const result = await db.query(
        `INSERT INTO direct_messages 
          (sender_id, receiver_id, text, file_url, file_name, reply_to_id, reply_quote, reply_author)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [senderId, receiverId, encrypted, fileUrl || null, fileName || null,
        reply_to || null, reply_quote || null, reply_author || null]
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
          sender_avatar: senderAvatarUrl,
          reply_to_id: savedMsg.reply_to_id,
          reply_quote: savedMsg.reply_quote,
          reply_author: savedMsg.reply_author,
        });
      }

      if (!onlineUsers[sender]) {
        onlineUsers[sender] = {
          socketId: socket.id,
          id: senderId,
          avatar_url: senderAvatarUrl,
        };
        io.emit("online_users", Object.keys(onlineUsers));
      }
    } catch (err) {
      console.error("Error saving direct message:", err);
    }
  });

  socket.on("load_direct_messages", ({ user2, before_id }) => {
    const user1 = socket.user.username;
    const params = [user1, user2];
    const cursorClause = before_id ? `AND dm.id < $3` : "";
    if (before_id) params.push(before_id);

    db.query(
      `
    SELECT dm.id, dm.text, dm.timestamp, dm.file_url, dm.file_name, dm.is_read,
       dm.reply_to_id, dm.reply_quote, dm.reply_author,
       s.username as sender, r.username as receiver, s.avatar_url as sender_avatar
    FROM direct_messages dm
    JOIN users s ON dm.sender_id = s.id
    JOIN users r ON dm.receiver_id = r.id
    WHERE ((s.username = $1 AND r.username = $2) OR (s.username = $2 AND r.username = $1))
    ${cursorClause}
    ORDER BY dm.id DESC
    LIMIT 30
  `,
      params,
      (err, result) => {
        if (err) {
          console.error("load_direct_messages error:", err);
          return;
        }
        
        const decrypted = result.rows.map((row) => {
          try {
            return {
              ...row,
              reply_to: row.reply_to_id,
              text: row.text ? decrypt(row.text) : null,
              fileUrl: row.file_url,
              fileName: row.file_name,
              isFile: !!row.file_url,
            };
          } catch (e) {
            return {
              ...row,
              reply_to: row.reply_to_id,
              fileUrl: row.file_url,
              fileName: row.file_name,
              isFile: !!row.file_url,
            };
          }
        });

        const payload = {
          messages: decrypted.reverse(),
          hasMore: decrypted.length === 30,
          before_id,
        };
        
        socket.emit("direct_messages_loaded", payload);
      }
    );
  });


  socket.on("mark_as_read", async ({ sender }) => { 
    const reader = socket.user.username;
    await db.query(`
      UPDATE direct_messages 
      SET is_read = TRUE 
      WHERE receiver_id = (SELECT id FROM users WHERE username = $1)
        AND sender_id = (SELECT id FROM users WHERE username = $2)
        AND is_read = FALSE
    `, [reader, sender]);

    const senderSocket = onlineUsers[sender]?.socketId;
    if (senderSocket) {
      io.to(senderSocket).emit("messages_read", { by: reader, from: sender });
    }
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
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
