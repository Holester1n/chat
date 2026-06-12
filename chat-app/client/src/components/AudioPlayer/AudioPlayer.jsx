import { useRef, useState, useEffect } from 'react';
import classes from './AudioPlayer.module.css';

const AudioPlayer = ({ src, fileName, isOwn, timestamp, is_read }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime);
    setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current?.duration || 0);
  };

  const onEnded = () => setPlaying(false);

  const seek = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * a.duration;
  };

  const name = fileName?.replace(/\.[^.]+$/, '') || 'Аудио';

  return (
    <div className={`${classes.player} ${isOwn ? classes.own : ''}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />
      <button className={classes.playBtn} onClick={toggle}>
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        )}
      </button>
      <div className={classes.info}>
        <span className={classes.fileName}>{name}</span>
        <div className={classes.progressWrap} onClick={seek}>
          <div className={classes.progressBg}>
            <div className={classes.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className={classes.time}>{fmt(current)} / {fmt(duration)}</span>
      </div>
      <div className={classes.meta}>
        <span className={classes.metaTime}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOwn && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {is_read ? (
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <path d="M1 5l3 3L10 1" stroke="#05993b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 5l3 3 6-7" stroke="#05993b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ) : (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#a09890" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
            </span>
        )}
        </div>
    </div>
  );
};

export default AudioPlayer;