import React from "react";
import classes from './Message.module.css';

const Message = ({ username, text, timestamp, currentUser, onProfileClick, currentUserId, userId, avatarUrl }) => {
    const isOwn = username === currentUser || (currentUserId && userId && String(userId) === String(currentUserId));
    return (
        <div className={`${classes.message} ${isOwn ? classes.own : classes.other}`}>
            {!isOwn && (
            <img 
                className={classes.avatar}
                src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`}
                alt={username}
                onClick={() => onProfileClick(username)}
            />
            )}
            <div className={classes.content}>
            
            <div className={classes.bubble}>
                {!isOwn && (
                    <strong className={classes.author} onClick={() => onProfileClick(username)}>{username}</strong>
                )}
                <span className={classes.text}>{text}</span>
                <span className={classes.timestamp}>
                    {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
            </div>
        </div>
    );
};

export default Message;