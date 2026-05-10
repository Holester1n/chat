import React from "react";
import classes from './Sidebar.module.css';
import Logout from "../UI/LogOut/LogOut";

const Sidebar = ({setIsLoggedIn, setToken, setUsername}) => {
    return (
        <div className={classes.sidebar}>
            <h2 className={classes.title}>Flicker</h2>
            <Logout setIsLoggedIn={setIsLoggedIn} setToken={setToken} setUsername={setUsername}></Logout>
        </div>
    )
}

export default Sidebar;