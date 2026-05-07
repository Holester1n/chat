import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://chat-production-32fc.up.railway.app");

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
      username: username
    };

    socket.emit("send_message", msg);
    setMessage("");
  };

  if (!isLoggedIn) {
  return (
    <div style={{ padding: 20 }}>
      <h2>{isRegister ? "Register" : "Login"}</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="inputPlace"
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="inputPlace"
      />

      <button className="button" onClick={async () => {
        const url = isRegister ? "/register" : "/login";
        const res = await fetch(`https://chat-production-32fc.up.railway.app${url}`, {
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
      </button>
      
      <p style={{ marginTop: 10 }}>
        {isRegister ? "Already have an account?" : "No account?"}{" "}
        <button className="button" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
    </div>
  );
}

  return (
    
    <div style={{ padding: 20 }}>
      <h2>Chat</h2>

      <div>
        {messages.map((m) => (
          <div key={m.id} className="username">
            <strong>{m.username}:</strong>
            <span className="messageText">{m.text}</span>
            <span className="timestamp">
              {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit"})}
            </span>
          </div>
        ))}
      </div>

      {typingUser && <p className = "typing">{typingUser} печатает...</p>}
      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          socket.emit("typing", username);
          clearTimeout(window.typingTimeout);
          window.typingTimeout = setTimeout(() => {
            socket.emit("stop_typing");
          }, 1000);
        }}
        className="inputPlace"
      />
      <button className="button" onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;