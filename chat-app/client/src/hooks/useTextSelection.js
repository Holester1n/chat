import { useEffect, useState, useRef } from 'react';

export function useTextSelection(containerRef) {
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    const handle = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setSelection(null); return; }
      const text = sel.toString().trim();
      if (text.length < 2) { setSelection(null); return; }
      const bubble = sel.anchorNode?.parentElement?.closest('[data-msg-id]');
      if (!bubble || !containerRef.current?.contains(bubble)) { setSelection(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelection({ 
        text, 
        messageId: bubble.dataset.msgId, 
        author: bubble.dataset.msgAuthor,
        rect 
      });
    };
    document.addEventListener('mouseup', handle);
    return () => document.removeEventListener('mouseup', handle);
  }, []);

  return { selection, clear: () => setSelection(null) };
}