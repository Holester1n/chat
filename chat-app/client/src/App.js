import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Chat from './components/Chat/Chat';
import RegisterWindow from "./components/RegisterWindow/RegisterWindow";
import Sidebar from "./components/Sidebar/Sidebar";
import './App.css';

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
  const [confirmPassword, setConfirmPassword] = useState("");

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

  if (!isLoggedIn) {
  return (
    <RegisterWindow 
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      isRegister={isRegister}
      setIsRegister={setIsRegister}
      setIsLoggedIn={setIsLoggedIn}
      setToken={setToken}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
    />
  );
}

  return (
    <div className="app">
    <Sidebar />
    <Chat
      messages={messages}
      message={message}
      setMessage={setMessage}
      typingUser={typingUser}
      socket={socket}
      username={username}
    />
    </div>
  );
}

export default App;