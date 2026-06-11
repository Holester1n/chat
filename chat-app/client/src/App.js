import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Chat from "./components/Chat/Chat";
import RegisterWindow from "./components/RegisterWindow/RegisterWindow";
import Sidebar from "./components/Sidebar/Sidebar";
import ProfileModal from "./components/ProfileModal/ProfileModal";
import { useAuth } from "./hooks/useAuth";
import { useSocket } from "./hooks/useSocket";
import { useUsers } from "./hooks/useUsers";
import { useFileTransfer } from "./hooks/useFileTransfer";
import "./App.css";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";
const socket = io(SERVER_URL, {
  auth: {
    token: localStorage.getItem("token")
  },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: false,
});

socket.on("reconnect_attempt", () => {
  socket.auth.token = localStorage.getItem("token");
});

if (localStorage.getItem("token")) {
  socket.connect();
}

function App() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  const {
    username,
    setUsername,
    handleUsernameChange,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoggedIn,
    setIsLoggedIn,
    setToken,
    isRegister,
    setIsRegister,
    currentUserId,
    setCurrentUserId,
  } = useAuth();

  const { users, activeChat, setActiveChat, setActiveChatAndClear, addUserIfMissing, onlineSet } =
    useUsers(socket, {
      isLoggedIn,
      username,
    });

  const {
    directMessages,
    typingUser,
    sendDirectMessage,
    updateMessageUsername,
    addFileMessage,
    hasMore,
    loadingMore,
    loadMore,
  } = useSocket(socket, {
    username,
    activeChat,
    currentUserId,
    onNewDirectMessage: addUserIfMissing,
  });

  const { sendFile } = useFileTransfer(
    socket,
    {
      username,
      activeChat,
      onFileReceived: addFileMessage,
    }
  );

  const totalUnread = users
    .filter(u => u.username !== username && u.username !== activeChat)
    .reduce((sum, u) => sum + (Number(u.unread_count) || 0), 0);

  const handleSendDirectMessage = () => {
    sendDirectMessage({ message, receiver: activeChat });
    setMessage("");
  };

  useEffect(() => {
    const total = users.reduce((sum, u) => sum + (Number(u.unread_count) || 0), 0);
    document.title = total > 0 ? `(${total}) Fluxly` : 'Fluxly';
  }, [users]);

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
        socket={socket}
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
        setActiveChat={setActiveChatAndClear}
        currentUser={username}
        setProfileUser={setProfileUser}
        onProfileClick={setProfileUser}
        onlineSet={onlineSet}
        socket={socket}
      />
      <Chat
        messages={directMessages ?? []}
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
        onlineSet={onlineSet}
        users={users}
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadMore={loadMore}
        sendDirectMessage={sendDirectMessage}
        totalUnread={totalUnread}
      />
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
