import { useState, useEffect } from "react";
import classes from './ProfileModal.module.css';
import Button from "../UI/button/Button";
import Input from "../UI/input/Input";
import { CLOUDINARY_CLOUD, CLOUDINARY_PRESET } from "../../config";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";


const ProfileModal = ({ username, currentUser, onClose, onStartChat, onUsernameChange, onSave }) => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
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
        setAvatarUrl(data.avatar_url || "");
        setNewUsername(data.username || username);
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
      body: JSON.stringify({ bio, avatar_url: avatarUrl, newUsername })
    });
    setProfile(prev => ({ ...prev, bio, avatar_url: avatarUrl, username: newUsername }));
    if (newUsername !== currentUser) {
      onUsernameChange(newUsername);
    }
    setEditing(false);
    if (newUsername !== currentUser) {
      onUsernameChange(newUsername);
      onSave(currentUser, newUsername);
    }
  };

  if (!profile) return null;

  return (
  <div className={classes.overlay} onClick={editing ? null : onClose}>
    <div className={classes.modal} onClick={e => e.stopPropagation()}>
      <div className={classes.banner} />
      <button className={classes.close} onClick={onClose}>✕</button>

      <div className={classes.body}>
        <div className={classes.avatarWrapper}>
          <label style={{ cursor: editing ? 'pointer' : 'default', display: 'block', position: 'relative' }}>
            <img
              className={classes.avatar}
              src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`}
              alt="avatar"
            />
            {editing && (
              <div className={classes.avatarOverlay}>
                {uploading ? "..." : "✎"}
              </div>
            )}
            {editing && (
              <input autoComplete="off" type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            )}
          </label>
        </div>

        {editing ? (
          <Input autoComplete="off" className={classes.usernameInput} value={newUsername} onChange={e => setNewUsername(e.target.value)} />
        ) : (
          <h2 className={classes.username}>{profile.username}</h2>
        )}

        {editing ? (
          <textarea className={classes.bioInput} placeholder="О себе" value={bio} onChange={e => setBio(e.target.value)} />
        ) : (
          <p className={classes.bio}>{profile.bio || ""}</p>
        )}

        <div className={classes.actions}>
          {isOwn ? (
            editing
              ? <Button onClick={handleSave}>Сохранить</Button>
              : <Button onClick={() => setEditing(true)}>Редактировать</Button>
          ) : (
            <Button onClick={() => { onStartChat(profile.username); onClose(); }}>Написать</Button>
          )}
        </div>
      </div>
    </div>
  </div>
);
}

export default ProfileModal;