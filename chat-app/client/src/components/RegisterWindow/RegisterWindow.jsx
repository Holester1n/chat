import React, { useState } from "react";
import classes from './RegisterWindow.module.css';
import Button from '../UI/button/Button';
import Input from '../UI/input/Input';
import { SERVER_URL } from "../../config";

const RegisterWindow = ({ username, setUsername, password, setPassword, isRegister, setIsRegister, setIsLoggedIn, setToken, confirmPassword, setConfirmPassword, setCurrentUserId }) => {
    const [email, setEmail] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState("");

    const handleSubmit = async () => {
        if (isRegister) {
            if (password.trim() !== confirmPassword.trim()) return alert("Passwords do not match");
            const res = await fetch(`${SERVER_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), email: email.trim(), password: password.trim() })
            });
            const data = await res.json();
            if (data.error) return alert(data.error);
            setVerifying(true);
        } else {
            const res = await fetch(`${SERVER_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password: password.trim() })
            });
            const data = await res.json();
            if (data.error) return alert(data.error);
            setToken(data.token);
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            localStorage.setItem("userId", data.id);
            setCurrentUserId(data.id);
            setIsLoggedIn(true);
        }
    };

    const handleVerify = async () => {
        const res = await fetch(`${SERVER_URL}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), code: code.trim() })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);
        alert("Email подтверждён! Теперь войдите.");
        setVerifying(false);
        setIsRegister(false);
    };

    if (verifying) {
        return (
            <div className={classes.container}>
                <h2>Подтверждение email</h2>
                <p style={{ color: '#9c9189', fontSize: 14, marginBottom: 16 }}>Код отправлен на {email}</p>
                <div className={classes.input}>
                    <Input
                        placeholder="Введите код"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className={classes.Input}
                    />
                </div>
                <Button className={classes.button} onClick={handleVerify}>Подтвердить</Button>
            </div>
        );
    }
    return (
        <div className={classes.container}>
            <h2>{isRegister ? "Register" : "Login"}</h2>
            {isRegister && (
                <div className={classes.input}>
                    <Input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={classes.Input}
                    />
                </div>
            )}
            <div className={classes.input}>
                <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={classes.Input}
                />
            </div>
            <div className={classes.input}>
                <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={classes.Input}
                />
            </div>
            {isRegister && (
                <div className={classes.input}>
                    <Input
                        placeholder="Confirm password"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={classes.Input}
                    />
                </div>
            )}
            <Button className={classes.button} onClick={handleSubmit}>
                {isRegister ? "Register" : "Login"}
            </Button>
            <p onClick={() => setIsRegister(!isRegister)} className={classes.switch}>
                {isRegister ? "Already have an account? Login" : "No account? Register"}
            </p>
        </div>
    )
}

export default RegisterWindow;