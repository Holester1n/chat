import React from "react";
import classes from './LogOut.module.css';

const Logout = ({ setIsLoggedIn, setToken, setUsername, className }) => {
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setIsLoggedIn(false);
        setToken("");
        setUsername("");
    }
    
    return (
        <button onClick={handleLogout} className={className}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4H6a2 2 0 00-2 2v12a2 2 0 002 2h7"/>
                <path d="M17 8l4 4-4 4"/>
                <path d="M21 12H9"/>
            </svg>
            Выйти
        </button>
    );
};

export default Logout;