import { useRef, useEffect, useCallback, useState } from 'react';
import s from './WheelPicker.module.css';

const ITEM_H = 48; // px — must match CSS

export default function WheelPicker({ items, value, onChange, width, variant = 'default', compact = false }) {
  const listRef = useRef(null);
  const isScrolling = useRef(null);
  const [visualIdx, setVisualIdx] = useState(() => Math.max(0, items.indexOf(value)));

  const idx = Math.max(0, items.indexOf(value));

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = idx * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setVisualIdx(idx);
  }, [idx]);

  useEffect(() => {
    return () => clearTimeout(isScrolling.current);
  }, []);

  const commit = useCallback((el) => {
    const rawIdx = el.scrollTop / ITEM_H;
    const snapped = Math.round(rawIdx);
    const clamped = Math.max(0, Math.min(snapped, items.length - 1));
    onChange(items[clamped]);
  }, [items, onChange]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const rawIdx = el.scrollTop / ITEM_H;
    const liveIdx = Math.max(0, Math.min(Math.round(rawIdx), items.length - 1));
    setVisualIdx(liveIdx);

    clearTimeout(isScrolling.current);
    isScrolling.current = setTimeout(() => commit(el), 80);
  }, [commit, items.length]);

  // Click an item to snap to it
  function handleClick(item, i) {
    onChange(item);
    listRef.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
  }

  return (
    <div
      className={[s.wheel, variant === 'decimal' ? s.decimal : '', compact ? s.compact : ''].join(' ')}
      style={width ? { width } : undefined}
    >
      <div className={s.highlight} />
      <div className={s.fadeTop} />
      <div className={s.fadeBottom} />
      <div
        ref={listRef}
        className={s.list}
        onScroll={handleScroll}
      >
        <div className={s.pad} />
        {items.map((item, i) => {
          const distance = Math.abs(i - visualIdx);
          const distanceClass =
            distance === 0 ? s.active : distance === 1 ? s.near : distance === 2 ? s.mid : s.far;

          return (
          <div
            key={item}
            className={[s.item, distanceClass].join(' ')}
            onClick={() => handleClick(item, i)}
          >
            {item}
          </div>
          );
        })}
        <div className={s.pad} />
      </div>
    </div>
  );
}
