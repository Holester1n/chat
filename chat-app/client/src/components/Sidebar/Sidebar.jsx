import React from "react";
import classes from './Sidebar.module.css';
import Logout from "../UI/LogOut/LogOut";

const Sidebar = ({setIsLoggedIn, setToken, setUsername, users, activeChat, setActiveChat, currentUser, isOpen }) => {
    return (
        <div className={`${classes.sidebar} ${isOpen ? classes.open : ''}`}>
            <h2 className={classes.title}>Flicker</h2>
            <div className={classes.userList}>
                <div 
                    className={`${classes.userItem} ${!activeChat ? classes.active : ''}`}
                    onClick={() => setActiveChat(null)}
                >
                    General
                </div>
                {users
                    .filter(u => u.username !== currentUser)
                    .map(u => (
                        <div
                            key={u.username}
                            className={`${classes.userItem} ${activeChat === u.username ? classes.active : ''}`}
                            onClick={() => setActiveChat(u.username)}
                        >
                            {u.username}
                        </div>
                    ))
                }
            </div>
            <Logout setIsLoggedIn={setIsLoggedIn} setToken={setToken} setUsername={setUsername}></Logout>
        </div>
    )
}

export default Sidebar;