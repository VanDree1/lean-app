import { useEffect, useMemo, useState } from 'react';
import { useStreak } from '../../hooks/useStreak';
import { getGoalTone, useGoalTone } from '../../hooks/useGoalTone';
import styles from './MotivationTip.module.css';

const CACHE_KEY_PREFIX = 'djur-i-juni:daily-quote';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

function getCacheKey(goal) {
  return `${CACHE_KEY_PREFIX}:${goal || 'default'}`;
}

function getFallbackQuote(tone) {
  const quotes = tone.quote.fallbacks;
  return quotes[Math.floor(Date.now() / 86_400_000) % quotes.length];
}

function readCachedQuote(goal) {
  try {
    const raw = localStorage.getItem(getCacheKey(goal));
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

export default function MotivationTip({ profile = {}, lowEnergyMode = false, recoveryTone = null }) {
  const { loggedToday } = useStreak();
  const tone = useGoalTone(profile);
  const goal = tone.goal || 'fat_loss';
  const mode = loggedToday ? 'ground' : 'reflect';
  const fallbackQuote = useMemo(() => getFallbackQuote(getGoalTone({ goal })), [goal]);
  const [quote, setQuote] = useState(() => {
    const cached = readCachedQuote(goal);
    return cached || { ...fallbackQuote, source: 'fallback' };
  });

  useEffect(() => {
    const cached = readCachedQuote(goal);
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

        localStorage.setItem(getCacheKey(goal), JSON.stringify(nextQuote));
        setQuote(nextQuote);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        const fallback = cached || { ...fallbackQuote, source: 'fallback', fetchedAt: Date.now() };
        setQuote(fallback);
      }
    }

    loadQuote();

    return () => controller.abort();
  }, [goal, fallbackQuote]);

  const statusText = loggedToday ? 'Klar' : lowEnergyMode && recoveryTone ? recoveryTone.quoteStatus : tone.quote.status;
  const quoteLead = lowEnergyMode && recoveryTone ? recoveryTone.quoteLead : mode === 'ground' ? 'Behåll rytmen.' : tone.quote.lead;

  return (
    <section className={styles.card} aria-label="Dagens citat">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Dagens citat</p>
        <span className={styles.status}>{statusText}</span>
      </div>

      <p className={styles.lead}>{quoteLead}</p>
      <p className={styles.quote}>&ldquo;{quote.text}&rdquo;</p>
      <p className={styles.author}>{quote.author}</p>
    </section>
  );
}
