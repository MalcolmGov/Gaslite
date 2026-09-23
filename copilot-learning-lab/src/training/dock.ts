import { useEffect, useState, type CSSProperties } from 'react';

/**
 * Where to dock a training card so it never covers an open product panel
 * (artifact preview or citation). Cards move to the left of the panel, or
 * shrink to a pill when there isn't room.
 */
export function useDock(): { style: CSSProperties; compact: boolean } {
  const [panelWidth, setPanelWidth] = useState(0);
  useEffect(() => {
    const measure = () => {
      const panels = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
      const w = panels.reduce((max, p) => Math.max(max, window.innerWidth - p.getBoundingClientRect().left), 0);
      setPanelWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
    };
    measure();
    const id = window.setInterval(measure, 400);
    window.addEventListener('resize', measure);
    return () => { clearInterval(id); window.removeEventListener('resize', measure); };
  }, []);
  if (!panelWidth) return { style: { right: 16, bottom: 16 }, compact: false };
  const room = window.innerWidth - panelWidth;
  if (room < 420) return { style: { left: 16, bottom: 16 }, compact: true };
  return { style: { right: panelWidth + 16, bottom: 16 }, compact: false };
}
