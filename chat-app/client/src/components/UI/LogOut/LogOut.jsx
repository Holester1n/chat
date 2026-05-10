import React from "react";
import classes from './LogOut.module.css';
import Button from "../button/Button";

const Logout = ({ setIsLoggedIn, setToken, setUsername }) => {
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setIsLoggedIn(false);
        setToken("");
        setUsername(""); 
    }
    
    return (
        <Button onClick={handleLogout}>Logout</Button>
    );
};

export default Logout;