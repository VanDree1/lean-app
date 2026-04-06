import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from './components/Onboarding/useOnboarding';
import Onboarding from './components/Onboarding/Onboarding';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Recipes from './pages/Recipes';
import styles from './App.module.css';

const SHARED_PROFILE_KEY = 'djur_juni_profile';
const LEGACY_PROFILE_KEY = 'djur-i-juni:profile';
const DEFAULT_PROFILE = {
  weight: 100,
  goalWeight: 90,
  caloriesGoal: 3150,
  proteinGoal: 220,
};

function loadSharedProfile() {
  try {
    const current = JSON.parse(localStorage.getItem(SHARED_PROFILE_KEY) || 'null');
    const legacy = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || 'null');
    return {
      ...DEFAULT_PROFILE,
      ...(legacy || {}),
      ...(current || {}),
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export default function App() {
  const { isComplete } = useOnboarding();
  const [currentView, setCurrentView] = useState('hem');
  const [displayedView, setDisplayedView] = useState('hem');
  const [isViewVisible, setIsViewVisible] = useState(true);
  const viewTimeoutRef = useRef(null);
  const [profile, setProfileState] = useState(() => loadSharedProfile());

  useEffect(() => {
    return () => {
      if (viewTimeoutRef.current) {
        window.clearTimeout(viewTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function syncProfile() {
      setProfileState(loadSharedProfile());
    }

    window.addEventListener('storage', syncProfile);
    window.addEventListener('djur-i-juni:profile-updated', syncProfile);

    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('djur-i-juni:profile-updated', syncProfile);
    };
  }, []);

  if (!isComplete) return <Onboarding />;

  function setProfile(nextProfile) {
    setProfileState((prev) => {
      const resolved = typeof nextProfile === 'function' ? nextProfile(prev) : nextProfile;
      const merged = { ...prev, ...resolved };
      localStorage.setItem(SHARED_PROFILE_KEY, JSON.stringify(merged));
      localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('djur-i-juni:profile-updated'));
      return merged;
    });
  }

  function handleViewChange(nextView) {
    if (nextView === currentView) return;

    setCurrentView(nextView);
    setIsViewVisible(false);

    if (viewTimeoutRef.current) {
      window.clearTimeout(viewTimeoutRef.current);
    }

    viewTimeoutRef.current = window.setTimeout(() => {
      setDisplayedView(nextView);
      setIsViewVisible(true);
    }, 170);
  }

  return (
    <>
      <Header />
      <div className={[styles.viewShell, isViewVisible ? styles.viewVisible : styles.viewHidden].join(' ')}>
        {displayedView === 'hem' && <Home profile={profile} />}
        {displayedView === 'recept' && <Recipes />}
        {displayedView === 'profil' && <Profile profile={profile} setProfile={setProfile} />}
      </div>
      <BottomNav active={currentView} onChange={handleViewChange} />
    </>
  );
}
