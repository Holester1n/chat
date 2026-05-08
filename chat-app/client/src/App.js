import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Button from './components/UI/button/Button';
import Input from "./components/UI/input/Input";
import Message from "./components/Message/Message";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";
const socket = io(SERVER_URL);

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  
  useEffect(() => {
    socket.on("load_messages", (msgs) => {
      setMessages(msgs);
    });

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (username) => setTypingUser(username));
    socket.on("stop_typing", () => setTypingUser(""))

    return () => {
    socket.off("load_messages");
    socket.off("receive_message");
    socket.off("typing");
    socket.off("stop_typing")
    };
  }, []);

  const sendMessage = () => {
    if (!message) return;

    const msg = {
      text: message,
      id: Date.now(),
      username: username,
      timestamp: new Date().toISOString()
    };

    socket.emit("send_message", msg);
    setMessage("");
  };

  if (!isLoggedIn) {
  return (
    <div style={{ padding: 20 }}>
      <h2>{isRegister ? "Register" : "Login"}</h2>

      <Input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <Button onClick={async () => {
        const url = isRegister ? "/register" : "/login";
        const res = await fetch(`${SERVER_URL}${url}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);

        if (!isRegister) {
          setToken(data.token);
        }

        setIsLoggedIn(true);
      }}>
        {isRegister ? "Register" : "Login"}
      </Button>
      
      <p style={{ marginTop: 10 }}>
        {isRegister ? "Already have an account?" : "No account?"}{" "}
        <Button onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Login" : "Register"}
        </Button>
      </p>
    </div>
  );
}

  return (
    
    <div style={{ padding: 20 }}>
      <h2>Chat</h2>

      <div>
        {messages.map((m) => (
          <Message key={m.id} username={m.username} text={m.text} timestamp={m.timestamp} />
        ))}
      </div>

      {typingUser && <p className = "typing">{typingUser} печатает...</p>}
      <Input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          socket.emit("typing", username);
          clearTimeout(window.typingTimeout);
          window.typingTimeout = setTimeout(() => {
            socket.emit("stop_typing");
          }, 1000);
        }}
      />
      <Button onClick={sendMessage}>Send</Button>
    </div>
  );
}

export default App;