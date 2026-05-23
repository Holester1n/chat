import React from "react";
import classes from './Message.module.css';

const getFileType = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return 'audio';
    return 'file';
};

const Message = ({ username, text, timestamp, currentUser, onProfileClick, currentUserId, userId, avatarUrl, isFile, fileName, fileUrl }) => {
    const isOwn = username === currentUser || (currentUserId && userId && String(userId) === String(currentUserId));

    const renderContent = () => {
        if (!isFile) return <span className={classes.text}>{text}</span>;

        const type = getFileType(fileName);
        if (type === 'image') return (
            <a href={fileUrl} download={fileName}>
                <img src={fileUrl} alt={fileName} className={classes.mediaImage} />
            </a>
        );
        if (type === 'video') return (
            <video src={fileUrl} controls className={classes.mediaVideo} />
        );
        if (type === 'audio') return (
            <audio src={fileUrl} controls className={classes.mediaAudio} />
        );
        return (
            <a href={fileUrl} download={fileName} className={classes.mediaFile}>
                📎 {fileName}
            </a>
        );
    };

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
                <div className={`${classes.bubble} ${isFile ? classes.fileBubble : ""}`}>
                    {!isOwn && (
                        <strong className={classes.author} onClick={() => onProfileClick(username)}>
                            {username}
                        </strong>
                    )}
                    {renderContent()}
                    <span className={classes.timestamp}>
                        {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Message;