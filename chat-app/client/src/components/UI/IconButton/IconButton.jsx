import classes from './IconButton.module.css';

const IconButton = ({ onClick, children, className }) => {
    return (
        <button className={`${classes.btn} ${className || ''}`} onClick={onClick}>
            {children}
        </button>
    );
};

export default IconButton;