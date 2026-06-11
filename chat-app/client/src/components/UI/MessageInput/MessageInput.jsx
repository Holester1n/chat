import React, { useEffect } from "react";
import classes from './MessageInput.module.css';

const MessageInput = React.forwardRef(({ className, value, onChange, onKeyDown, placeholder }, ref) => {

  useEffect(() => {
    if (ref?.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  const handleInput = (e) => {
    onChange?.({ target: { value: e.currentTarget.textContent } });
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`${classes.input} ${className || ''}`}
      onInput={handleInput}
      onKeyDown={onKeyDown}
      data-placeholder={placeholder}
    />
  );
});

export default MessageInput;