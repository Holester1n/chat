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

let messages = [];

io.on("connection", (socket) => {
  console.log("User connected");

  socket.emit("load_messages", messages);

  socket.on("send_message", (msg) => {
    messages.push(msg);
    io.emit("receive_message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});