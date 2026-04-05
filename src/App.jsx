import { useOnboarding } from './components/Onboarding/useOnboarding';
import Onboarding from './components/Onboarding/Onboarding';
import Header from './components/Header';
import Home from './pages/Home';

export default function App() {
  const { isComplete } = useOnboarding();

  if (!isComplete) return <Onboarding />;

  return (
    <>
      <Header />
      <Home />
    </>
  );
}
