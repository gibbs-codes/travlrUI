import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TripPlannerForm from './pages/PlanTripPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plan" element={<TripPlannerForm />} />
    </Routes>
  );
}