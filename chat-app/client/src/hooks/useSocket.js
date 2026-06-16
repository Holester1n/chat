import { useEffect, useState, useRef } from "react";
let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};
export function useSocket(
  socket,
  { username, activeChat, currentUserId, onNewDirectMessage }
) {
  const activeChatRef = useRef(activeChat);
    useEffect(() => {
      activeChatRef.current = activeChat;
  }, [activeChat]);
  const [directMessages, setDirectMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const playNotification = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(620, ctx.currentTime, 0.25);
    playTone(820, ctx.currentTime + 0.15, 0.35);
  };
  useEffect(() => {
    socket.on("receive_direct_message", (msg) => {
      setDirectMessages((prev) => [
        ...prev,
        {
          ...msg,
          fileUrl: msg.file_url || msg.fileUrl,
          fileName: msg.file_name || msg.fileName,
          isFile: !!(msg.file_url || msg.fileUrl),
        },
      ]);
      onNewDirectMessage?.(msg);
      if (msg.sender === activeChatRef.current) {
        socket.emit("mark_as_read", { reader: username, sender: msg.sender });
      }
      if (msg.sender !== username) playNotification(); 
    });

    socket.on("messages_read", ({ by, from }) => {
      setDirectMessages(prev =>
        Array.isArray(prev)
          ? prev.map(m => m.sender === from ? { ...m, is_read: true } : m)
          : prev
      );
    });

    socket.on("typing", (user) => setTypingUser(user));
    socket.on("stop_typing", () => setTypingUser(""));

    return () => {
      socket.off("load_messages");
      socket.off("receive_message");
      socket.off("receive_direct_message");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("messages_read");
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!activeChat) return;

    setDirectMessages([]);
    setHasMore(false);

    socket.emit("load_direct_messages", { user1: username, user2: activeChat });
    socket.emit("mark_as_read", { reader: username, sender: activeChat });
    console.log("mark_as_read emitted", { reader: username, sender: activeChat });

    const handleRead = ({ by, from }) => {
      if (from === username && by === activeChat) {
        setDirectMessages(prev =>
          prev.map(m => m.sender === username ? { ...m, is_read: true } : m)
        );
      }
    };

    const handleLoaded = ({ messages: loadedMessages, hasMore, before_id }) => {
      console.log("handleLoaded fired", loadedMessages);
      const safeMessages = Array.isArray(loadedMessages) ? loadedMessages : [];
      if (before_id) {
        setDirectMessages((prev) => [...safeMessages, ...(Array.isArray(prev) ? prev : [])]);
      } else {
        setDirectMessages(safeMessages);
      }
      setHasMore(hasMore ?? false);
      setLoadingMore(false);
    };

    socket.on("direct_messages_loaded", handleLoaded);
    return () => {
      socket.off("direct_messages_loaded", handleLoaded);
      socket.off("messages_read", handleRead);
    };
  }, [activeChat]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const oldest = directMessages[0];
    socket.emit("load_direct_messages", {
      user1: username,
      user2: activeChat,
      before_id: oldest?.id,
    });
  };

  const sendDirectMessage = ({ message, receiver, reply_to, reply_quote, reply_author }) => {
    if (!message) return;

    const msg = {
      sender: username,
      receiver,
      text: message,
      timestamp: new Date().toISOString(),
      reply_to: reply_to ?? null,
      reply_quote: reply_quote ?? null,
      reply_author: reply_author ?? null,
    };

    socket.emit("send_direct_message", msg);
    setDirectMessages((prev) => [...prev, msg]);
  };

  const updateMessageUsername = (oldName, newName) => {
    setDirectMessages((prev) =>
      prev.map((m) => (m.sender === oldName ? { ...m, sender: newName } : m))
    );
  };

  const addFileMessage = (file) => {
    console.log("addFileMessage", file);
    setDirectMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: file.sender,
        timestamp: new Date().toISOString(),
        isFile: true,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
      },
    ]);
  };

  
  return {
    directMessages,
    typingUser,
    sendDirectMessage,
    updateMessageUsername,
    addFileMessage,
    hasMore,
    loadingMore,
    loadMore,
  };
}
