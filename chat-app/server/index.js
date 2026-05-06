const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let users = [];

const bcrypt = require("bcrypt");

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword],
    function(err) {
      if (err) return res.status(400).json({ error: "Username exists" });
      res.json({ success: true });
    }
  );
});

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("chat.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

const JWT_SECRET = 'CrTPLskIDU45k6TcQ34TmifIGAzwo1RCrNL52QHgoEAnjLoHbiR0hfEGxlTeklOU';
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
    if (err || !row) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign({ username }, SECRET);
    res.json({ token, username });
  });
});

io.on("connection", (socket) => {
  console.log("User connected");

  db.all("SELECT * FROM messages ORDER BY id ASC", [], (err, rows) => {
    if (!err) socket.emit("load_messages", rows);
  });

  socket.on("send_message", (msg) => {
    db.run(
      "INSERT INTO messages (username, text) VALUES (?, ?)",
      [msg.username, msg.text]
    );

    io.emit("receive_message", msg);
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

