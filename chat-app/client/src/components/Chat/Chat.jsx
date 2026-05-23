import React from "react";
import classes from './Chat.module.css';
import Message from '../Message/Message';
import Button from '../UI/button/Button';
import Input from '../UI/input/Input';
import IconButton from "../UI/IconButton/IconButton";
import { useEffect, useRef } from "react";

const Chat = ({ messages, message, setMessage, typingUser, socket, username, activeChat, onSendMessage, onBurgerClick, onProfileClick, currentUserId, onSendFile }) => {
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const sendMessage = () => {
    if (!message) return;
    
    const msg = {
      text: message,
      id: Date.now(),
      username: username,
      timestamp: new Date().toISOString()
    };
    socket.emit("send_message", msg);
    setMessage("");
    inputRef.current?.focus();
    };
    const handleSend = onSendMessage || sendMessage;
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages])
    return (

        <div className={classes.container}>
            <div className={classes.header}>
                <Button className={classes.burgerBtn} onClick={onBurgerClick}>☰</Button>
                <span className={classes.chatTitle}>{activeChat || "General"}</span>
            </div>
                <div className={classes.messages}>
                    {messages.map((m, index) => {
                        const currentDate = new Date(m.timestamp).toLocaleDateString();
                        const prevDate = index > 0 ? new Date(messages[index - 1].timestamp).toLocaleDateString() : null;
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
                            username={m.username || m.sender } 
                            text={m.text} 
                            timestamp={m.timestamp} 
                            onProfileClick={onProfileClick} 
                            currentUserId={currentUserId} 
                            userId={m.user_id || m.sender_id}
                            avatarUrl={m.avatar_url || m.sender_avatar}
                            isFile={m.isFile}
                            fileName={m.fileName}
                            fileUrl={m.fileUrl}
                            />
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className={classes.inputArea}>
                    <p className={classes.typing}>{typingUser ? `${typingUser} печатает...` : ' '}</p>
                    <div className={classes.inputRow}>
                     <Input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) onSendFile?.(file);
                            e.target.value = ""; 
                        }}
                    /> 
                    <Input
                        ref={inputRef}
                        value={message}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
                        </svg>
                    </IconButton>
                    <IconButton onClick={handleSend}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    </IconButton>
                    </div>
                </div>
        </div>
    )
}

export default Chat;