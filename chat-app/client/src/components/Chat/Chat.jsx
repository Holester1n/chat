import React from "react";
import classes from "./Chat.module.css";
import Message from "../Message/Message";
import Button from "../UI/button/Button";
import Input from "../UI/input/Input";
import IconButton from "../UI/IconButton/IconButton";
import { useEffect, useRef, useState } from "react";
import { useSwipeReply } from '../../hooks/useSwipeReply';
import { useTextSelection } from '../../hooks/useTextSelection';

const Chat = ({
  messages,
  message,
  setMessage,
  typingUser,
  socket,
  username,
  activeChat,
  onSendMessage,
  onBurgerClick,
  onProfileClick,
  currentUserId,
  onSendFile,
  onlineSet,
  users,
  hasMore,
  loadingMore,
  loadMore,
  sendDirectMessage,
  totalUnread,
}) => {
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [tick, setTick] = useState(0);
  const topSentinelRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const { selection, clear: clearSelection } = useTextSelection(scrollContainerRef);
  
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeReply((messageId, messageText, messageAuthor) => {
    setReplyTo({ messageId, text: messageText, author: messageAuthor });
    setTimeout(() => inputRef.current?.focus(), 50);
  });
  const cancelReply = () => setReplyTo(null);

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    sendDirectMessage({
      message,
      receiver: activeChat,
      reply_to: replyTo?.messageId ?? null,
      reply_quote: replyTo?.text ?? null,
      reply_author: replyTo?.author ?? null,
    });

    setMessage("");
    setReplyTo(null);
    clearSelection();
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const formatLastSeen = (isoString) => {
    if (!isoString) return "не в сети";
    const d = new Date(isoString);
    const now = new Date();
    const diff = (now - d) / 1000 / 60;
    if (diff < 1) return "был(а) в сети только что";
    if (diff < 60) return `был(а) в сети ${Math.floor(diff)} мин назад`;
    if (diff < 1440)
      return `был(а) в сети в ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return `в сети ${d.toLocaleDateString()}`;
  };

  const prevChatRef = useRef(null);
  useEffect(() => {
    if (activeChat !== prevChatRef.current) {
      prevChatRef.current = activeChat;
    }
  }, [activeChat]);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (!messages?.length) return;
    if (isFirstLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
    }
  }, [messages]);

  useEffect(() => {
    isFirstLoad.current = true;
  }, [activeChat]);

  useEffect(() => {
    if (!topSentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const SelectionTooltip = selection ? (
    <div
      style={{
        position: 'fixed',
        top: selection.rect.top - 40,
        left: selection.rect.left + selection.rect.width / 2 - 50,
        zIndex: 1000,
        background: '#222',
        color: '#fff',
        borderRadius: 8,
        padding: '6px 14px',
        fontSize: 13,
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        setReplyTo({ messageId: selection.messageId, text: selection.text, author: selection.author });
        clearSelection();
        setTimeout(() => inputRef.current?.focus(), 50);
      }}
    >
      Ответить
    </div>
  ) : null;

  const scrollToMessage = (messageId) => {
    if (!messageId) return;
    const el = scrollContainerRef.current?.querySelector(`[data-msg-id="${messageId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const bubble = el.querySelector('[class*="bubble"]');
    const target = bubble || el;
    target.style.transition = 'background 0.3s ease';
    target.style.background = 'rgba(255, 187, 0, 0.35)';
    setTimeout(() => {
      target.style.background = '';
      setTimeout(() => target.style.transition = '', 300);
    }, 1500);
  };

  return (
    <div className={classes.container}>
      {SelectionTooltip}
      <div className={classes.header} style={{ borderBottom: activeChat ? undefined : 'none', background: activeChat ? undefined : '#f7f6f2'  }}>
        <div className={classes.burgerBtn}>
          <IconButton onClick={onBurgerClick}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            {totalUnread > 0 && (
              <span style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: '#ffbb00',
                color: '#fff',
                borderRadius: '50%',
                fontSize: 10,
                fontWeight: 700,
                minWidth: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                lineHeight: 1,
              }}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </IconButton>
        </div>
        {activeChat && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
              gap: 2,
            }}
          >
            <span style={{ fontWeight: 600 }}>{activeChat}</span>
            <span
              style={{
                fontSize: 11,
                color: onlineSet?.has(activeChat) ? "#22c55e" : "#a09890",
              }}
            >
              {onlineSet?.has(activeChat)
                ? "● онлайн"
                : formatLastSeen(
                    users.find((u) => u.username === activeChat)?.last_seen
                  )}
            </span>
          </div>
        )}
      </div>

      {!activeChat ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a09890",
            fontSize: 15,
          }}
        >
          Выберите диалог
        </div>
      ) : (
        <div
          className={classes.messages}
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          <div ref={topSentinelRef} style={{ height: 1 }} />
          {loadingMore && (
            <div
              style={{
                textAlign: "center",
                padding: "8px",
                fontSize: 12,
                color: "#a09890",
              }}
            >
              загрузка...
            </div>
          )}
          {messages.map((m, index) => {
            const currentDate = new Date(m.timestamp).toLocaleDateString();
            const prevDate =
              index > 0
                ? new Date(messages[index - 1].timestamp).toLocaleDateString()
                : null;
            const showDivider = currentDate !== prevDate;
            return (
              <React.Fragment key={m.id}>
                {showDivider && (
                  <div className={classes.dateDivider}>
                    <span>{currentDate}</span>
                  </div>
                )}
                <Message
                  currentUser={username}
                  username={m.username || m.sender}
                  text={m.text}
                  timestamp={m.timestamp}
                  onProfileClick={onProfileClick}
                  currentUserId={currentUserId}
                  userId={m.user_id || m.sender_id}
                  avatarUrl={m.avatar_url || m.sender_avatar}
                  isFile={m.isFile}
                  fileName={m.fileName}
                  fileUrl={m.fileUrl}
                  is_read={m.is_read}
                  msgId={m.id}
                  replyQuote={m.reply_quote}
                  replyAuthor={m.reply_author}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  replyTo={m.reply_to}
                  onReplyClick={scrollToMessage}
                />
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {showScrollBtn && (
        <button onClick={scrollToBottom} className={classes.scrollBtn} style={{ bottom: replyTo ? 140 : 80 }}>
          ↓
        </button>
      )}
      {activeChat && (
        <div className={classes.inputArea}>
          {replyTo && (
            <div className={classes.replyBar}>
              <div className={classes.replyBarContent}>
                <span className={classes.replyBarLabel}>Ответ на:</span>
                <span className={classes.replyBarLabel}>{replyTo.author}</span>
                <span className={classes.replyBarText}>{replyTo.text}</span>
              </div>
              <button className={classes.replyBarClose} onClick={cancelReply}>✕</button>
            </div>
          )}
          <div className={classes.inputRow}>
            <Input
              autoComplete="off"
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) onSendFile?.(file);
                e.target.value = "";
              }}
            />
            <Input
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              ref={inputRef}
              value={message}
              name="fluxly-msg-input-x7k"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              onChange={(e) => {
                setMessage(e.target.value);
                socket.emit("typing", username);
                clearTimeout(window.typingTimeout);
                window.typingTimeout = setTimeout(() => {
                  socket.emit("stop_typing");
                }, 1000);
              }}
            />
            <IconButton onClick={() => fileInputRef.current?.click()}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </IconButton>
            <IconButton onClick={handleSend}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
