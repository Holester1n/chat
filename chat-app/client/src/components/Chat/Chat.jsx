import React from "react";
import classes from './Chat.module.css';
import Message from '../Message/Message';
import Button from '../UI/button/Button';
import Input from '../UI/input/Input';
import { useEffect, useRef } from "react";

const Chat = ({ messages, message, setMessage, typingUser, socket, username }) => {
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages])
    return (
        <div className={classes.container}>
            <div className={classes.chat}>
                <div className={classes.messages}>
                    {messages.map((m) => (
                        <Message currentUser={username} key={m.id} username={m.username} text={m.text} timestamp={m.timestamp} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className={classes.inputArea}>
                    <p className={classes.typing}>{typingUser ? `${typingUser} печатает...` : ' '}</p>
                    <div className={classes.inputRow}>
                    <Input
                        ref={inputRef}
                        value={message}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') sendMessage();
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
                    <Button onClick={sendMessage}>Send</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chat;