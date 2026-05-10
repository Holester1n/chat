import React from "react";
import classes from './RegisterWindow.module.css';
import Button from '../UI/button/Button';
import Input from '../UI/input/Input';
import { SERVER_URL } from "../../config";

const RegisterWindow = ({ username, setUsername, password, setPassword, isRegister, setIsRegister, setIsLoggedIn, setToken }) => {
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
            <Button onClick={async () => {
                const url = isRegister ? "/register" : "/login";
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
            <p style={{ marginTop: 10 }}>
                {isRegister ? "Already have an account?" : "No account?"}{" "}
                <Button onClick={() => setIsRegister(!isRegister)}>
                {isRegister ? "Login" : "Register"}
                </Button>
            </p>
        </div>
    )
}

export default RegisterWindow;