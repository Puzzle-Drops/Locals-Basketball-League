import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to the element matching `location.hash` after every navigation.
// Without this, react-router changes the URL but the browser doesn't scroll
// to anchors. Plain top-of-page navigation (no hash) jumps to the top.
//
// Uses a small rAF delay so the target route's content is in the DOM by
// the time we look for the element.
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => {
        const id = decodeURIComponent(hash.slice(1));
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
