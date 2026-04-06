import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from './components/Onboarding/useOnboarding';
import Onboarding from './components/Onboarding/Onboarding';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Recipes from './pages/Recipes';
import { useAppStore } from './store/useAppStore';
import styles from './App.module.css';

export default function App() {
  const { isComplete } = useOnboarding();
  const { state } = useAppStore();
  const [currentView, setCurrentView] = useState('hem');
  const [displayedView, setDisplayedView] = useState('hem');
  const [isViewVisible, setIsViewVisible] = useState(true);
  const viewTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (viewTimeoutRef.current) {
        window.clearTimeout(viewTimeoutRef.current);
      }
    };
  }, []);

  if (!isComplete) return <Onboarding />;

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
        {displayedView === 'hem' && <Home profile={state.profile} />}
        {displayedView === 'recept' && <Recipes />}
        {displayedView === 'profil' && <Profile profile={state.profile} />}
      </div>
      <BottomNav active={currentView} onChange={handleViewChange} />
    </>
  );
}
