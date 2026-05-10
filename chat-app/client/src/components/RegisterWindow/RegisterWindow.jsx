import React from "react";
import classes from './RegisterWindow.module.css';
import Button from '../UI/button/Button';
import Input from '../UI/input/Input';
import { SERVER_URL } from "../../config";

const RegisterWindow = ({ username, setUsername, password, setPassword, isRegister, setIsRegister, setIsLoggedIn, setToken, confirmPassword, setConfirmPassword }) => {
    return (
        <div className={classes.container}>
            <h2>{isRegister ? "Register" : "Login"}</h2>
            <div className={classes.input}>    
                <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}   
                />
            </div>
            <div className={classes.input}>
                <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>
            {isRegister && (
                <div className={classes.input}>
                    <Input
                        placeholder="Confirm password"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                </div>
            )}
            
            <Button onClick={async () => {
                const url = isRegister ? "/register" : "/login";
                if (isRegister && password.trim() !== confirmPassword.trim()) {
                    return alert("Passwords do not match");
                }
                const res = await fetch(`${SERVER_URL}${url}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: username.trim(), password: password.trim() })
                });
                const data = await res.json();
                if (data.error) return alert(data.error);

                if (!isRegister) {
                    setToken(data.token);
                }
                setIsLoggedIn(true);
            }}>
            {isRegister ? "Register" : "Login"}
            </Button>
            <p 
                onClick={() => setIsRegister(!isRegister)}
                className={classes.switch}
            >
                {isRegister ? "Already have an account? Login" : "No account? Register"}
            </p>
            
        </div>
    )
}

export default RegisterWindow;