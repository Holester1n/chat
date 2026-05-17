import React, { useState } from "react";
import classes from './RegisterWindow.module.css';
import Button from '../UI/button/Button';
import Input from '../UI/input/Input';
import { SERVER_URL } from "../../config";

const RegisterWindow = ({ username, setUsername, password, setPassword, isRegister, setIsRegister, setIsLoggedIn, setToken, confirmPassword, setConfirmPassword, setCurrentUserId }) => {
    const [email, setEmail] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState("");
    const [forgotPassword, setForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [resetStep, setResetStep] = useState(1);

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
            setUsername(data.username);
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
                <h2 style={{marginBottom: 20}}>Подтверждение email</h2>
                <p className={classes.verifyMessage}>Код отправлен на {email}</p>
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

    if (forgotPassword && resetStep === 1) {
        return (
            <div className={classes.container}>
                <h2 style={{marginBottom: 20}}>Сброс пароля</h2>
                <p className={classes.verifyMessage}>Введите email для получения кода</p>
                <div className={classes.input}>
                    <Input
                        placeholder="Email"
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        className={classes.Input}
                    />
                </div>
                <Button className={classes.button} onClick={async () => {
                    const res = await fetch(`${SERVER_URL}/forgot-password`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: resetEmail.trim() })
                    });
                    const data = await res.json();
                    if (data.error) return alert(data.error);
                    setResetStep(2);
                }}>Отправить код</Button>
                <p className={classes.switch} onClick={() => setForgotPassword(false)}>Назад</p>
            </div>
        );
    }

    if (forgotPassword && resetStep === 2) {
        return (
            <div className={classes.container}>
                <h2>Новый пароль</h2>
                <p className={classes.verifyMessage}>Код отправлен на {resetEmail}</p>
                <div className={classes.input}>
                    <Input
                        placeholder="Код из письма"
                        value={resetCode}
                        onChange={e => setResetCode(e.target.value)}
                        className={classes.Input}
                    />
                </div>
                <div className={classes.input}>
                    <Input
                        placeholder="Новый пароль"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className={classes.Input}
                    />
                </div>
                <Button className={classes.button} onClick={async () => {
                    const res = await fetch(`${SERVER_URL}/reset-password`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: resetEmail.trim(), code: resetCode.trim(), newPassword: newPassword.trim() })
                    });
                    const data = await res.json();
                    if (data.error) return alert(data.error);
                    alert("Пароль изменён! Войдите с новым паролем.");
                    setForgotPassword(false);
                    setResetStep(1);
                }}>Сохранить</Button>
                <p className={classes.switch} onClick={() => setResetStep(1)}>Назад</p>
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
            <p className={classes.switch} onClick={() => setForgotPassword(true)}>Забыли пароль?</p>
            <p onClick={() => setIsRegister(!isRegister)} className={classes.switch}>
                {isRegister ? "Already have an account? Login" : "No account? Register"}
            </p>
        </div>
    )
}

export default RegisterWindow;