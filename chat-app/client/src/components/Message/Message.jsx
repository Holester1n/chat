import React from "react";
import classes from './Message.module.css';

const Message = ({ username, text, timestamp, currentUser, onProfileClick, currentUserId, userId }) => {
    const isOwn = username === currentUser || (currentUserId && userId && String(userId) === String(currentUserId));
    return (
        <div className={`${classes.message} ${isOwn ? classes.own : classes.other}`}>
            {!isOwn && (<strong className={classes.author} onClick={() => onProfileClick(username)} style={{ cursor: 'pointer' }}>{username}</strong>)}
            <div className={classes.bubble}>
                {text}
                <span className={classes.timestamp}>
                    {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </div>
    );
};

export default Message;