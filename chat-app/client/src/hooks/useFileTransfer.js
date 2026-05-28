import { CLOUDINARY_CLOUD, CLOUDINARY_PRESET } from "../config";
import { useState } from "react";

export function useFileTransfer(
  socket,
  { username, activeChat, onFileReceived }
) {
  const [transferProgress, setTransferProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);

  const sendFile = async (file) => {
    if (!file || !activeChat) return;
    setIsTransferring(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      const fileMsg = {
        sender: username,
        receiver: activeChat,
        fileUrl: data.secure_url,
        fileName: file.name,
        fileType: file.type,
        isFile: true,
        timestamp: new Date().toISOString(),
        id: Date.now(),
      };

      socket.emit("send_direct_message", {
        ...fileMsg,
      });
      onFileReceived?.({ ...fileMsg, from: username });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsTransferring(false);
      setTransferProgress(0);
    }
  };

  return { sendFile, transferProgress, isTransferring };
}
