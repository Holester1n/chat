import { useEffect, useState } from "react";

export function useSocket(socket, { username, activeChat, currentUserId, onNewDirectMessage }) {
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  useEffect(() => {
    socket.on("load_messages", (msgs) => {
      setMessages(msgs);
    });

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [
        ...prev,
        { ...msg, isOwn: msg.user_id === currentUserId },
      ]);
    });

    socket.on("receive_direct_message", (msg) => {
      console.log("receive_direct_message", msg);
      setDirectMessages((prev) => [...prev, msg]);
      onNewDirectMessage?.(msg);
    });

    socket.on("typing", (user) => setTypingUser(user));
    socket.on("stop_typing", () => setTypingUser(""));

    return () => {
      socket.off("load_messages");
      socket.off("receive_message");
      socket.off("receive_direct_message");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!activeChat) return;

    socket.emit("load_direct_messages", { user1: username, user2: activeChat });

    socket.on("direct_messages_loaded", (msgs) => {
      setDirectMessages(msgs);
    });

    return () => {
      socket.off("direct_messages_loaded");
    };
  }, [activeChat]);

  const sendDirectMessage = ({ message, receiver }) => {
    if (!message) return;

    const msg = {
      sender: username,
      receiver,
      text: message,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send_direct_message", msg);
    setDirectMessages((prev) => [...prev, msg]);
  };

  const updateMessageUsername = (oldName, newName) => {
    setMessages((prev) =>
      prev.map((m) => (m.username === oldName ? { ...m, username: newName } : m))
    );
    setDirectMessages((prev) =>
      prev.map((m) => (m.sender === oldName ? { ...m, sender: newName } : m))
    );
  };

  const addFileMessage = (file) => {
    console.log("addFileMessage", file);
    setDirectMessages((prev) => [...prev, {
        id: Date.now(),
        sender: file.sender,
        timestamp: new Date().toISOString(),
        isFile: true,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
    }]);
  };

  return {
      messages,
      directMessages,
      typingUser,
      sendDirectMessage,
      updateMessageUsername,
      addFileMessage, 
    };
}