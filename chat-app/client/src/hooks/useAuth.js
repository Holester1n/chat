import { useState } from "react";

export function useAuth() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isRegister, setIsRegister] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(
    localStorage.getItem("userId")
  );

  const handleUsernameChange = (newName) => {
    setUsername(newName);
    localStorage.setItem("username", newName);
  };

  return {
    username,
    setUsername,
    handleUsernameChange,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoggedIn,
    setIsLoggedIn,
    token,
    setToken,
    isRegister,
    setIsRegister,
    currentUserId,
    setCurrentUserId,
  };
}
