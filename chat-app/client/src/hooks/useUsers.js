import { useEffect, useState } from "react";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";

export function useUsers(socket, { isLoggedIn, username }) {
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    if (!isLoggedIn || !username) return;

    socket.emit("set_user", username);
    fetch(`${SERVER_URL}/conversations/${username}`)
      .then((res) => res.json())
      .then((data) => setUsers(data));

    const handleConnect = () => socket.emit("set_user", username);
    socket.on("connect", handleConnect);

    return () => socket.off("connect", handleConnect);
  }, [isLoggedIn, username]);

  const addUserIfMissing = (msg) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u.username === msg.sender);
      if (!exists) {
        return [...prev, { username: msg.sender, avatar_url: msg.sender_avatar }];
      }
      return prev;
    });
  };

  return {
    users,
    setUsers,
    activeChat,
    setActiveChat,
    addUserIfMissing,
  };
}