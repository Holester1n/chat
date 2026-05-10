import React from "react";
import classes from './Input.module.css';

const Input = React.forwardRef(({className, ...props}, ref) => {
  return (
    <input ref={ref} className={`${classes.input} ${className || ''}`} {...props}/>
  );
});

export default Input;
