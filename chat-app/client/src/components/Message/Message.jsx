import React from "react";
import classes from './Message.module.css';

const Message = ({ username, text, timestamp }) => {
    return (
        <div className={classes.Message}>
            <strong>{username}: </strong>
            <span className={classes.text}>{text}</span>
            <span className={classes.timestamp}>
                {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
        </div>
    );
};

export default Message;