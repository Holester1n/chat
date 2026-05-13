import { useState, useEffect } from "react";
import classes from './ProfileModal.module.css';
import Button from "../UI/button/Button";
import Input from "../UI/input/Input";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";
const CLOUDINARY_CLOUD = "dvgaqltvv";
const CLOUDINARY_PRESET = "flicker";

const ProfileModal = ({ username, currentUser, onClose, onStartChat, onUsernameChange }) => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [uploading, setUploading] = useState(false);

  const isOwn = username === currentUser;

  useEffect(() => {
    fetch(`${SERVER_URL}/users/${username}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setBio(data.bio || "");
        setStatus(data.status || "");
        setAvatarUrl(data.avatar_url || "");
        setNewUsername(data.username);
      });
  }, [username]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    setAvatarUrl(data.secure_url);
    setUploading(false);
  };

  const handleSave = async () => {
    await fetch(`${SERVER_URL}/users/${currentUser}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, status, avatar_url: avatarUrl, newUsername })
    });
    setProfile(prev => ({ ...prev, bio, status, avatar_url: avatarUrl, username: newUsername }));
    if (newUsername !== currentUser) {
      onUsernameChange(newUsername);
    }
    setEditing(false);
  };

  if (!profile) return null;

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.modal} onClick={e => e.stopPropagation()}>
        <Button className={classes.close} onClick={onClose}>✕</Button>

        <div className={classes.avatarWrapper}>
          <img
            className={classes.avatar}
            src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`}
            alt="avatar"
          />
          {editing && (
            <label className={classes.uploadLabel}>
              {uploading ? "Загрузка..." : "Изменить"}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
          )}
        </div>

        {editing ? (
          <Input
            className={classes.usernameInput}
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
          />
        ) : (
          <h2 className={classes.username}>{profile.username}</h2>
        )}

        {editing ? (
          <Input
            className={classes.statusInput}
            placeholder="Статус"
            value={status}
            onChange={e => setStatus(e.target.value)}
          />
        ) : (
          <p className={classes.status}>{profile.status || "Нет статуса"}</p>
        )}

        {editing ? (
          <textarea
            className={classes.bioInput}
            placeholder="О себе"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
        ) : (
          <p className={classes.bio}>{profile.bio || "Нет информации"}</p>
        )}

        <div className={classes.actions}>
          {isOwn ? (
            editing ? (
              <Button onClick={handleSave}>Сохранить</Button>
            ) : (
              <Button onClick={() => setEditing(true)}>Редактировать</Button>
            )
          ) : (
            <Button onClick={() => { onStartChat(profile.username); onClose(); }}>Написать</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;