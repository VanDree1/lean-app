import { useState } from 'react';
import { useOnboarding } from './components/Onboarding/useOnboarding';
import Onboarding from './components/Onboarding/Onboarding';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Profile from './pages/Profile';

export default function App() {
  const { isComplete } = useOnboarding();
  const [currentView, setCurrentView] = useState('hem');

  if (!isComplete) return <Onboarding />;

  return (
    <>
      <Header />
      {currentView === 'hem' && <Home />}
      {currentView === 'recept' && <div style={{ color: '#fff', padding: '1.5rem 1rem 7rem' }}>Recept kommer snart</div>}
      {currentView === 'profil' && <Profile />}
      <BottomNav active={currentView} onChange={setCurrentView} />
    </>
  );
}
