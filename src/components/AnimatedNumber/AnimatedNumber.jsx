import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({
  value,
  duration = 800,
  decimals = 0,
  locale = 'sv-SE',
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    let frameId;
    let startTime;
    const from = previousValueRef.current;
    const to = Number(value) || 0;

    function tick(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = from + ((to - from) * eased);
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        previousValueRef.current = to;
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <>{displayValue.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}</>
  );
}
