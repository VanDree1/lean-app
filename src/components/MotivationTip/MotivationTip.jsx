import { useEffect, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useStreak } from '../../hooks/useStreak';
import styles from './MotivationTip.module.css';

const CACHE_KEY_PREFIX = 'djur-i-juni:daily-quote';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const GOAL_LABELS = {
  fat_loss: 'Fettförlust',
  muscle: 'Bygga muskler',
  energy: 'Mer energi',
  target: 'Målvikt',
  default: 'Din riktning',
};

const FALLBACK_QUOTES_BY_GOAL = {
  fat_loss: [
    { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
    { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
    { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
  ],
  muscle: [
    { text: 'Strength does not come from winning. Your struggles develop your strengths.', author: 'Arnold Schwarzenegger' },
    { text: 'The resistance that you fight physically in the gym and the resistance that you fight in life can only build a strong character.', author: 'Arnold Schwarzenegger' },
    { text: 'Absorb what is useful, discard what is useless, and add what is specifically your own.', author: 'Bruce Lee' },
  ],
  energy: [
    { text: 'Nature does not hurry, yet everything is accomplished.', author: 'Lao Tzu' },
    { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
    { text: 'It is not enough to be busy. The question is: what are we busy about?', author: 'Henry David Thoreau' },
  ],
  target: [
    { text: 'A goal without a plan is just a wish.', author: 'Antoine de Saint-Exupery' },
    { text: 'First say to yourself what you would be; and then do what you have to do.', author: 'Epictetus' },
    { text: 'Well begun is half done.', author: 'Aristotle' },
  ],
  default: [
    { text: 'Absorb what is useful, discard what is useless, and add what is specifically your own.', author: 'Bruce Lee' },
    { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
    { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  ],
};

function getCacheKey(goal) {
  return `${CACHE_KEY_PREFIX}:${goal || 'default'}`;
}

function getFallbackQuote(goal) {
  const quotes = FALLBACK_QUOTES_BY_GOAL[goal] || FALLBACK_QUOTES_BY_GOAL.default;
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

export default function MotivationTip() {
  const { profile } = useProfile();
  const { loggedToday } = useStreak();
  const goal = profile.goal || 'default';
  const mode = loggedToday ? 'ground' : 'reflect';
  const [quote, setQuote] = useState(() => {
    const cached = readCachedQuote(goal);
    return cached || { ...getFallbackQuote(goal), source: 'fallback' };
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

        const fallback = cached || { ...getFallbackQuote(goal), source: 'fallback', fetchedAt: Date.now() };
        setQuote(fallback);
      }
    }

    loadQuote();

    return () => controller.abort();
  }, [goal]);

  const statusText = loggedToday ? 'Klar' : GOAL_LABELS[goal] || GOAL_LABELS.default;
  const quoteLead = mode === 'ground'
    ? 'Håll det lugnt.'
    : loggedToday
      ? 'Behåll rytmen.'
      : 'Sätt tonen.';

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
