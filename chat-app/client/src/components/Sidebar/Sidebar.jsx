import React from "react";
import classes from './Sidebar.module.css';
import Logout from "../UI/LogOut/LogOut";
import Button from "../UI/button/Button";
import SearchBar from "../SearchBar/SearchBar";

const Sidebar = ({setIsLoggedIn, setToken, setUsername, users, activeChat, setActiveChat, currentUser, isOpen, onProfileClick }) => {
    return (
        <div className={`${classes.sidebar} ${isOpen ? classes.open : ''}`}>
            <h2 className={classes.title}>
                <img src='/IMG_8677.png' alt="Fluxly" className={classes.logo} />
                Fluxly
            </h2>
            <SearchBar currentUser={currentUser} onProfileClick={onProfileClick} />
            <div className={classes.userList}>
                {users
                    .filter(u => u.username !== currentUser)
                    .map(u => (
                        <div key={u.username} className={`${classes.userItem} ${activeChat === u.username ? classes.active : ''}`} onClick={() => setActiveChat(u.username)}>
                            <img 
                                className={classes.userAvatar} 
                                src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`} 
                                alt={u.username}
                            />
                            {u.username}
                        </div>
                    ))
                }
            </div>
            <div className={classes.bottom}>
                <Button className={classes.profileBtn} onClick={() => onProfileClick(currentUser)}> 
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    {currentUser}
                </Button>
            </div>
            <Logout 
                className={classes.profileBtn} 
                setIsLoggedIn={setIsLoggedIn} 
                setToken={setToken} 
                setUsername={setUsername} 
            />
        </div>
    )
}

export default Sidebar;