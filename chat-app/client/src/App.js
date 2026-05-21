import { useState } from "react";
import { io } from "socket.io-client";
import Chat from './components/Chat/Chat';
import RegisterWindow from "./components/RegisterWindow/RegisterWindow";
import Sidebar from "./components/Sidebar/Sidebar";
import ProfileModal from "./components/ProfileModal/ProfileModal";
import { useAuth } from "./hooks/useAuth";
import { useSocket } from "./hooks/useSocket";
import { useUsers } from "./hooks/useUsers";
import './App.css';
import { useFileTransfer } from "./hooks/useFileTransfer";
import FileNotification from "./components/FileNotification/FileNotification";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";
const socket = io(SERVER_URL);

function App() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  
  const {
    username, setUsername, handleUsernameChange,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    isLoggedIn, setIsLoggedIn,
    token, setToken,
    isRegister, setIsRegister,
    currentUserId, setCurrentUserId,
  } = useAuth();

  const { users, activeChat, setActiveChat, addUserIfMissing } = useUsers(socket, {
    isLoggedIn,
    username,
  });

  const {
    messages,
    directMessages,
    typingUser,
    sendDirectMessage,
    updateMessageUsername,
  } = useSocket(socket, {
    username,
    activeChat,
    currentUserId,
    onNewDirectMessage: addUserIfMissing,
  });
  const { sendFile, incomingFile, clearIncomingFile, transferProgress, isTransferring } = useFileTransfer(socket, { username, activeChat });
  const handleSendDirectMessage = () => {
    sendDirectMessage({ message, receiver: activeChat });
    setMessage("");
  };

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
        setCurrentUserId={setCurrentUserId}
      />
    );
  }

  return (
    <div className="app">
      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar
        isOpen={sidebarOpen}
        setIsLoggedIn={setIsLoggedIn}
        setToken={setToken}
        setUsername={setUsername}
        users={users}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        currentUser={username}
        setProfileUser={setProfileUser}
        onProfileClick={setProfileUser}
      />
      <Chat
        messages={activeChat ? directMessages : messages}
        message={message}
        setMessage={setMessage}
        typingUser={typingUser}
        socket={socket}
        username={username}
        onSendMessage={activeChat ? handleSendDirectMessage : undefined}
        activeChat={activeChat}
        onBurgerClick={() => setSidebarOpen(true)}
        onProfileClick={setProfileUser}
        currentUserId={currentUserId}
        onSendFile={activeChat ? sendFile : undefined}
      />
      <FileNotification file={incomingFile} onClose={clearIncomingFile} />
      {profileUser && (
        <ProfileModal
          username={profileUser}
          currentUser={username}
          onClose={() => setProfileUser(null)}
          onStartChat={(user) => setActiveChat(user)}
          onUsernameChange={(newName) => {
            handleUsernameChange(newName);
            setProfileUser(newName);
          }}
          onSave={(oldName, newName) => updateMessageUsername(oldName, newName)}
        />
      )}
    </div>
  );
}

export default App;