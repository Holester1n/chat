import { useEffect, useState } from "react";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";

export function useUsers(socket, { isLoggedIn, username, }) {
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [onlineSet, setOnlineSet] = useState(new Set());

  useEffect(() => {
    if (!isLoggedIn || !username) return;

    const handleNewMessage = (msg) => {
      if (msg.sender !== currentChat) {
        setUsers(prev => prev.map(u =>
          u.username === msg.sender
            ? { ...u, unread_count: (Number(u.unread_count) || 0) + 1 }
            : u
        ));
      }
    };

    socket.emit("set_user", username);
    fetch(`${SERVER_URL}/conversations/${username}`)
      .then((res) => res.json())
      .then((data) => setUsers(data));

    const handleConnect = () => socket.emit("set_user", username);
    socket.on("connect", handleConnect);

    const handleOnlineUsers = (list) => {
      setOnlineSet(new Set(list));
    };
    socket.on("online_users", handleOnlineUsers);
    socket.on("receive_direct_message", handleNewMessage);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("online_users", handleOnlineUsers);
      socket.off("receive_direct_message", handleNewMessage);
    };
  }, [isLoggedIn, username, currentChat]);

  const addUserIfMissing = (msg) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u.username === msg.sender);
      if (!exists) {
        return [
          ...prev,
          { username: msg.sender, avatar_url: msg.sender_avatar },
        ];
      }
      return prev;
    });
  };

  const setActiveChatAndClear = (username) => {
    setUsers(prev => prev.map(u => 
      u.username === username ? { ...u, unread_count: 0 } : u
    ));
    setCurrentChat(username);
  };

  return {
    users,
    setUsers,
    activeChat: currentChat,
    setActiveChat: setCurrentChat,
    setActiveChatAndClear,
    addUserIfMissing,
    onlineSet,
  };
}
