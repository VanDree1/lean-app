import { useRef, useEffect, useCallback } from 'react';
import s from './WheelPicker.module.css';

const ITEM_H = 48; // px — must match CSS

export default function WheelPicker({ items, value, onChange, width }) {
  const listRef = useRef(null);
  const isScrolling = useRef(null);

  const idx = Math.max(0, items.indexOf(value));

  // Set initial scroll position
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = idx * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback((el) => {
    const rawIdx = el.scrollTop / ITEM_H;
    const snapped = Math.round(rawIdx);
    const clamped = Math.max(0, Math.min(snapped, items.length - 1));
    onChange(items[clamped]);
  }, [items, onChange]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    clearTimeout(isScrolling.current);
    isScrolling.current = setTimeout(() => commit(el), 80);
  }, [commit]);

  // Click an item to snap to it
  function handleClick(item, i) {
    onChange(item);
    listRef.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
  }

  return (
    <div className={s.wheel} style={width ? { width } : undefined}>
      <div className={s.highlight} />
      <div className={s.fadeTop} />
      <div className={s.fadeBottom} />
      <div
        ref={listRef}
        className={s.list}
        onScroll={handleScroll}
      >
        <div className={s.pad} />
        {items.map((item, i) => (
          <div
            key={item}
            className={[s.item, item === value ? s.active : ''].join(' ')}
            onClick={() => handleClick(item, i)}
          >
            {item}
          </div>
        ))}
        <div className={s.pad} />
      </div>
    </div>
  );
}
