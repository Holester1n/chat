import { useEffect, useRef, useState } from "react";

const CHUNK_SIZE = 16 * 1024;

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export function useFileTransfer(socket, { username, activeChat }) {
  const [incomingFile, setIncomingFile] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);

  const peerRef = useRef(null);
  const receiveBufferRef = useRef([]);
  const receivedSizeRef = useRef(0);
  const expectedSizeRef = useRef(0);
  const fileNameRef = useRef("");

  const createPeer = () => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("webrtc_ice_candidate", { to: activeChat, candidate });
      }
    };

    return peer;
  };

  const sendFile = async (file) => {
    console.log("sendFile called", file.name);
    const peer = createPeer();
    peerRef.current = peer;

    const channel = peer.createDataChannel("fileTransfer");
    channel.binaryType = "arraybuffer";

    channel.onopen = () => {
      console.log("DataChannel opened");
      channel.send(JSON.stringify({ type: "file_meta", name: file.name, size: file.size }));

      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async (e) => {
        const buffer = e.target.result;
        let offset = 0;
        setIsTransferring(true);

        const sendChunk = () => {
          if (offset >= buffer.byteLength) {
            channel.send(JSON.stringify({ type: "file_done" }));
            setIsTransferring(false);
            setTransferProgress(0);
            return;
          }
          const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
          channel.send(chunk);
          offset += CHUNK_SIZE;
          setTransferProgress(Math.round((offset / buffer.byteLength) * 100));

          if (channel.bufferedAmount > CHUNK_SIZE * 8) {
            setTimeout(sendChunk, 10);
          } else {
            sendChunk();
          }
        };
        sendChunk();
      };
    };

    channel.onerror = (e) => console.error("DataChannel error", e);
    channel.onclose = () => console.log("DataChannel closed");

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    console.log("offer created, emitting to", activeChat);
    socket.emit("webrtc_offer", { to: activeChat, offer });
  };

  useEffect(() => {
    socket.on("webrtc_offer", async ({ from, offer }) => {
      console.log("webrtc_offer received from", from);  
      const peer = createPeer();
      peerRef.current = peer;

      peer.ondatachannel = ({ channel }) => {
        channel.binaryType = "arraybuffer";

        channel.onmessage = ({ data }) => {
          if (typeof data === "string") {
            const msg = JSON.parse(data);
            if (msg.type === "file_meta") {
              fileNameRef.current = msg.name;
              expectedSizeRef.current = msg.size;
              receiveBufferRef.current = [];
              receivedSizeRef.current = 0;
              setIsTransferring(true);
            } else if (msg.type === "file_done") {
              const blob = new Blob(receiveBufferRef.current);
              const url = URL.createObjectURL(blob);
              setIncomingFile({ name: fileNameRef.current, url, size: expectedSizeRef.current });
              setIsTransferring(false);
              setTransferProgress(0);
            }
          } else {
            receiveBufferRef.current.push(data);
            receivedSizeRef.current += data.byteLength;
            setTransferProgress(
              Math.round((receivedSizeRef.current / expectedSizeRef.current) * 100)
            );
          }
        };
      };

      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("webrtc_answer", { to: from, answer });
    });

    socket.on("webrtc_answer", async ({ answer }) => {
      await peerRef.current?.setRemoteDescription(answer);
    });

    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      try {
        await peerRef.current?.addIceCandidate(candidate);
      } catch (e) {
        console.error("ICE candidate error:", e);
      }
    });

    return () => {
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
    };
  }, [activeChat]);

  const clearIncomingFile = () => setIncomingFile(null);

  return {
    sendFile,
    incomingFile,
    clearIncomingFile,
    transferProgress,
    isTransferring,
  };
}