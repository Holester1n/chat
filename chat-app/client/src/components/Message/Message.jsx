import React, { useRef } from "react";
import classes from "./Message.module.css";

const getFileType = (name) => {
  if (!name) return "file";
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return "image";
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "aac"].includes(ext)) return "audio";
  return "file";
};

const Message = ({
  username,
  text,
  timestamp,
  currentUser,
  onProfileClick,
  currentUserId,
  userId,
  avatarUrl,
  isFile,
  fileName,
  fileUrl,
  is_read,
  msgId,
  replyQuote,
  replyAuthor,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
}) => {
  const innerRef = useRef(null);
  const isOwn =
    username === currentUser ||
    (currentUserId && userId && String(userId) === String(currentUserId));

  const renderContent = () => {
    if (!isFile) return <span className={classes.text}>{text}</span>;
    if (!fileUrl) return null;

    const type = getFileType(fileName);
    if (type === "image")
      return (
        <div className={classes.mediaImageWrap}>
          <a href={fileUrl} download={fileName}>
            <img src={fileUrl} alt={fileName} className={classes.mediaImage} />
          </a>
          <div className={classes.mediaOverlay}>
            <span className={classes.mediaTimestamp}>
              {new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isOwn && (
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                {is_read ? (
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                    <path
                      d="M1 5l3 3L10 1"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 5l3 3 6-7"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      );
    if (type === "video")
      return <video src={fileUrl} controls className={classes.mediaVideo} />;
    if (type === "audio")
      return <audio src={fileUrl} controls className={classes.mediaAudio} />;
    return (
      <a href={fileUrl} download={fileName} className={classes.mediaFile}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
        {fileName}
      </a>
    );
  };

  return (
    <div
      className={`${classes.message} ${isOwn ? classes.own : classes.other}`}
      data-msg-id={msgId}
      data-msg-author={username}
      onTouchStart={(e) => onTouchStart(e, msgId, innerRef.current)}
      onTouchMove={onTouchMove}
      onTouchEnd={(e) => onTouchEnd(e, msgId, text, username)}
    >
      <div ref={innerRef} className={classes.messageInner}>
      {!isOwn && (
        <img
          className={classes.avatar}
          src={
            avatarUrl ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${username}`
          }
          alt={username}
          onClick={() => onProfileClick(username)}
        />
      )}

      <div 
        className={classes.content}
      >
        {replyQuote && (
          <div className={classes.replyQuote}>
            <span className={classes.replyQuoteLine} />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span className={classes.replyQuoteAuthor}>{replyAuthor}</span>
              <span className={classes.replyQuoteText}>{replyQuote}</span>
            </div>
          </div>
        )}
        <div
          className={`${classes.bubble} ${isFile ? classes.fileBubble : ""} ${isFile && getFileType(fileName) === "image" ? classes.imageBubble : ""}`}
        >
          {!isOwn && !(isFile && getFileType(fileName) === "image") && (
            <strong
              className={classes.author}
              onClick={() => onProfileClick(username)}
            >
              {username}
            </strong>
          )}
          {renderContent()}
          {!(isFile && getFileType(fileName) === "image") && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  alignSelf: "flex-end",
                }}
              >
                <span className={classes.timestamp}>
                  {new Date(timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isOwn && (
                  <span
                    style={{
                      marginLeft: 3,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {is_read ? (
                      <svg
                        width="16"
                        height="10"
                        viewBox="0 0 16 10"
                        fill="none"
                      >
                        <path
                          d="M1 5l3 3L10 1"
                          stroke="#05993b"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5 5l3 3 6-7"
                          stroke="#05993b"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="#a09890"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Message;
