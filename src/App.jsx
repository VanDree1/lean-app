import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from './components/Onboarding/useOnboarding';
import Onboarding from './components/Onboarding/Onboarding';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Profile from './pages/Profile';
import styles from './App.module.css';

export default function App() {
  const { isComplete } = useOnboarding();
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
        {displayedView === 'hem' && <Home />}
        {displayedView === 'recept' && <div style={{ color: '#fff', padding: '1.5rem 1rem 7rem' }}>Recept kommer snart</div>}
        {displayedView === 'profil' && <Profile />}
      </div>
      <BottomNav active={currentView} onChange={handleViewChange} />
    </>
  );
}
