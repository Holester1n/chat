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
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isRegister, setIsRegister] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);

  const sendDirectMessage = () => {
    if (!message) return;
    const msg = {
      sender: username,
      receiver: activeChat,
      text: message,
      timestamp: new Date().toISOString()
    };
    
    socket.emit("send_direct_message", msg);
    setDirectMessages(prev => [...prev, msg]);
    setMessage("");
  };

    useEffect(() => {
      if (isLoggedIn && username) {
        socket.emit("set_user", username);
        fetch(`${SERVER_URL}/users`)
          .then(res => res.json())
          .then(data => setUsers(data));
      }

      socket.on("connect", () => {
        if (isLoggedIn && username) {
          socket.emit("set_user", username);
        }
      });

      return () => socket.off("connect");
    }, [isLoggedIn, username]);

  useEffect(() => {
    socket.on("load_messages", (msgs) => {
      setMessages(msgs);
    });

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("receive_direct_message", (msg) => {
      setDirectMessages(prev => [...prev, msg]);
    });

    socket.on("typing", (username) => setTypingUser(username));
    socket.on("stop_typing", () => setTypingUser(""))

    return () => {
    socket.off("load_messages");
    socket.off("receive_message");
    socket.off("typing");
    socket.off("stop_typing");
    socket.off("receive_direct_message");
    };
  }, []);

  useEffect(() => {
    if (activeChat) {
      socket.emit("load_direct_messages", { user1: username, user2: activeChat });
      
      socket.on("direct_messages_loaded", (msgs) => {
        setDirectMessages(msgs);
      });
    }
    
    return () => {
      socket.off("direct_messages_loaded");
    };
  }, [activeChat]);

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
    <Sidebar 
      setIsLoggedIn={setIsLoggedIn} 
      setToken={setToken} 
      setUsername={setUsername}
      users={users}
      activeChat={activeChat}
      setActiveChat={setActiveChat}
      currentUser={username}
    />
    <Chat
      messages={activeChat ? directMessages : messages}
      message={message}
      setMessage={setMessage}
      typingUser={typingUser}
      socket={socket}
      username={username}
      onSendMessage={activeChat ? sendDirectMessage : undefined}
      activeChat={activeChat}
    />
    </div>
  );
}

export default App;