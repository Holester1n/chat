import React from "react";
import classes from './Chat.module.css';
import Message from '../Message/Message';
import Button from '../UI/button/Button';
import Input from '../UI/input/Input';
import { useEffect, useRef } from "react";

const Chat = ({ messages, message, setMessage, typingUser, socket, username, activeChat, onSendMessage, onBurgerClick }) => {
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
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
                            <Message currentUser={username} username={m.username || m.sender } text={m.text} timestamp={m.timestamp} />
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className={classes.inputArea}>
                    <p className={classes.typing}>{typingUser ? `${typingUser} печатает...` : ' '}</p>
                    <div className={classes.inputRow}>
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
                    <Button className={classes.button} onClick={handleSend}>Send</Button>
                    </div>
                </div>
        </div>
    )
}

export default Chat;