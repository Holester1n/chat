import Button from "../UI/button/Button";
import classes from "./FileNotification.module.css";

const getFileType = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return 'audio';
    return 'file';
};

const FileNotification = ({ file, onClose }) => {
    if (!file) return null;

    const type = getFileType(file.name);

    return (
        <div className={classes.notification}>
            <Button className={classes.close} onClick={onClose}>✕</Button>
            {type === 'image' && (
                <img src={file.url} alt={file.name} className={classes.image} />
            )}
            {type === 'video' && (
                <video src={file.url} controls className={classes.video} />
            )}
            {type === 'audio' && (
                <audio src={file.url} controls className={classes.audio} />
            )}
            {type === 'file' && (
                <a href={file.url} download={file.name} className={classes.fileLink}>
                    📎 {file.name}
                </a>
            )}
        </div>
    );
};

export default FileNotification;