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

  const [messagesByChat, setMessagesByChat] = useState({});
  const [hasMoreByChat, setHasMoreByChat] = useState({});
  const [typingUser, setTypingUser] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const directMessages = messagesByChat[activeChat] || [];
  const hasMore = hasMoreByChat[activeChat] ?? false;

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
      const chatKey = msg.sender === username ? msg.receiver : msg.sender;
      setMessagesByChat(prev => ({
        ...prev,
        [chatKey]: [
          ...(prev[chatKey] || []),
          {
            ...msg,
            fileUrl: msg.file_url || msg.fileUrl,
            fileName: msg.file_name || msg.fileName,
            isFile: !!(msg.file_url || msg.fileUrl),
          },
        ],
      }));
      onNewDirectMessage?.(msg);
      if (msg.sender === activeChatRef.current) {
        socket.emit("mark_as_read", { reader: username, sender: msg.sender });
      }
      if (msg.sender !== username) playNotification();
    });

    socket.on("messages_read", ({ by, from }) => {
      setMessagesByChat(prev => {
        const chat = prev[by];
        if (!chat) return prev;
        return {
          ...prev,
          [by]: chat.map(m => m.sender === from ? { ...m, is_read: true } : m),
        };
      });
    });

    socket.on("typing", (user) => setTypingUser(user));
    socket.on("stop_typing", () => setTypingUser(""));

    return () => {
      socket.off("receive_direct_message");
      socket.off("messages_read");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!activeChat) return;

    if (messagesByChat[activeChat]) {
      socket.emit("mark_as_read", { reader: username, sender: activeChat });
      return;
    }

    setHasMoreByChat(prev => ({ ...prev, [activeChat]: false }));

    const handleLoaded = ({ messages: loadedMessages, hasMore, before_id }) => {
      const safeMessages = Array.isArray(loadedMessages) ? loadedMessages : [];
      setMessagesByChat(prev => ({
        ...prev,
        [activeChat]: before_id
          ? [...safeMessages, ...(prev[activeChat] || [])]
          : safeMessages,
      }));
      setHasMoreByChat(prev => ({ ...prev, [activeChat]: hasMore ?? false }));
      setLoadingMore(false);
    };

    socket.on("direct_messages_loaded", handleLoaded);

    const emit = () => {
      socket.emit("load_direct_messages", { user2: activeChat });
      socket.emit("mark_as_read", { reader: username, sender: activeChat });
    };

    if (socket.connected) {
      emit();
    } else {
      socket.once("connect", emit);
      return () => {
        socket.off("direct_messages_loaded", handleLoaded);
        socket.off("connect", emit);
      };
    }

    return () => socket.off("direct_messages_loaded", handleLoaded);
  }, [activeChat]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const oldest = directMessages[0];

    const handleLoaded = ({ messages: loadedMessages, hasMore, before_id }) => {
      if (!before_id) return;
      const safeMessages = Array.isArray(loadedMessages) ? loadedMessages : [];
      setMessagesByChat(prev => ({
        ...prev,
        [activeChat]: [...safeMessages, ...(prev[activeChat] || [])],
      }));
      setHasMoreByChat(prev => ({ ...prev, [activeChat]: hasMore ?? false }));
      setLoadingMore(false);
      socket.off("direct_messages_loaded", handleLoaded);
    };

    socket.on("direct_messages_loaded", handleLoaded);
    socket.emit("load_direct_messages", {
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
    setMessagesByChat(prev => ({
      ...prev,
      [receiver]: [...(prev[receiver] || []), msg],
    }));
  };

  const updateMessageUsername = (oldName, newName) => {
    setMessagesByChat(prev => {
      const updated = {};
      for (const [key, msgs] of Object.entries(prev)) {
        updated[key] = msgs.map(m => m.sender === oldName ? { ...m, sender: newName } : m);
      }
      return updated;
    });
  };

  const addFileMessage = (file) => {
    const chatKey = file.receiver === username ? file.sender : file.receiver;
    setMessagesByChat(prev => ({
      ...prev,
      [chatKey]: [
        ...(prev[chatKey] || []),
        {
          id: Date.now(),
          sender: file.sender,
          timestamp: new Date().toISOString(),
          isFile: true,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
        },
      ],
    }));
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