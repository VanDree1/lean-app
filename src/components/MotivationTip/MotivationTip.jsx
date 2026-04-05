import { useEffect, useState } from 'react';
import styles from './MotivationTip.module.css';

const CACHE_KEY = 'djur-i-juni:daily-quote';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const FALLBACK_QUOTES = [
  { text: 'Absorb what is useful, discard what is useless, and add what is specifically your own.', author: 'Bruce Lee' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
];

function getFallbackQuote() {
  return FALLBACK_QUOTES[Math.floor(Date.now() / 86_400_000) % FALLBACK_QUOTES.length];
}

function readCachedQuote() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.text || !parsed?.author || !parsed?.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isFresh(cache) {
  return Boolean(cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS);
}

export default function MotivationTip() {
  const [quote, setQuote] = useState(() => {
    const cached = readCachedQuote();
    return cached || { ...getFallbackQuote(), source: 'fallback' };
  });

  useEffect(() => {
    const cached = readCachedQuote();
    if (isFresh(cached)) {
      setQuote(cached);
      return undefined;
    }

    const controller = new AbortController();

    async function loadQuote() {
      try {
        const response = await fetch('https://api.quotable.io/random?tags=wisdom|inspirational', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Quote request failed with ${response.status}`);
        }

        const data = await response.json();
        if (!data?.content || !data?.author) {
          throw new Error('Quote response was incomplete');
        }

        const nextQuote = {
          text: data.content,
          author: data.author,
          fetchedAt: Date.now(),
          source: 'online',
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify(nextQuote));
        setQuote(nextQuote);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        const fallback = cached || { ...getFallbackQuote(), source: 'fallback', fetchedAt: Date.now() };
        setQuote(fallback);
      }
    }

    loadQuote();

    return () => controller.abort();
  }, []);

  const statusText = quote.source === 'online' ? 'Online' : 'Arkiv';

  return (
    <section className={styles.card} aria-label="Dagens citat">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Dagens citat</p>
        <span className={styles.status}>{statusText}</span>
      </div>

      <p className={styles.quote}>&ldquo;{quote.text}&rdquo;</p>
      <p className={styles.author}>{quote.author}</p>
    </section>
  );
}
