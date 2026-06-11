import { useRef } from 'react';

export function useSwipeReply(onReply) {
  const startX = useRef(null);
  const currentEl = useRef(null);
  const currentDx = useRef(0);
  const iconEl = useRef(null);

  const onTouchStart = (e, messageId, innerEl, icon) => {
    startX.current = e.touches[0].clientX;
    currentEl.current = innerEl;
    iconEl.current = icon;
    currentDx.current = 0;
  };

  const onTouchMove = (e) => {
    if (startX.current === null || !currentEl.current) return;
    const dx = startX.current - e.touches[0].clientX;
    if (dx < 0) return;
    const clamped = Math.min(dx, 50);
    currentDx.current = clamped;
    currentEl.current.style.transform = `translateX(-${clamped}px)`;
    if (iconEl.current) {
      iconEl.current.style.opacity = Math.min(clamped / 45, 1);
    }
  };

  const onTouchEnd = (e, messageId, messageText, messageAuthor) => {
    if (startX.current === null) return;
    const dx = currentDx.current;

    if (currentEl.current) {
      currentEl.current.style.transition = 'transform 0.2s ease';
      currentEl.current.style.transform = 'translateX(0)';
      setTimeout(() => {
        if (currentEl.current) currentEl.current.style.transition = '';
      }, 200);
    }

    if (iconEl.current) {
      iconEl.current.style.transition = 'opacity 0.2s ease';
      iconEl.current.style.opacity = 0;
      setTimeout(() => {
        if (iconEl.current) iconEl.current.style.transition = '';
      }, 200);
    }

    if (dx > 45) onReply(messageId, messageText, messageAuthor);

    startX.current = null;
    currentEl.current = null;
    iconEl.current = null;
    currentDx.current = 0;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}