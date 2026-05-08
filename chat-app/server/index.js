require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { Pool } = require("pg");

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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

const JWT_SECRET = 'CrTPLskIDU45k6TcQ34TmifIGAzwo1RCrNL52QHgoEAnjLoHbiR0hfEGxlTeklOU';
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
  res.json({ token, username });
});

io.on("connection", (socket) => {
  console.log("User connected");

  (async () => {
    const result = await db.query(
      "SELECT * FROM messages ORDER BY id ASC"
    );

    socket.emit("load_messages", result.rows);
  })();

  socket.on("send_message", async (msg) => {
    await db.query(
      "INSERT INTO messages (username, text) VALUES ($1, $2)",
      [msg.username, msg.text]
    );

    io.emit("receive_message", msg);
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("stop_typing");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

