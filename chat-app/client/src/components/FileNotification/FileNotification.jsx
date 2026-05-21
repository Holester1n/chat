import Button from "../UI/button/Button";
import classes from "./FileNotification.module.css";

const FileNotification = ({ file, onClose }) => {
    if (!file) return null;

    return (
        <div className={classes.notification}>
            <a href={file.url} download={file.name}>
                ⬇ {file.name}
            </a>
            <Button onClick={onClose}>✕</Button>
        </div>
    );
};

export default FileNotification;