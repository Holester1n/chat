import { useRef } from 'react';

export function useSwipeReply(onReply) {
  const startX = useRef(null);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e, messageId, messageText, messageAuthor) => {
    if (startX.current === null) return;
    const dx = startX.current - e.changedTouches[0].clientX;
    if (dx > 60) onReply(messageId, messageText, messageAuthor);
    startX.current = null;
  };

  return { onTouchStart, onTouchEnd };
}