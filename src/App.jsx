import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Create from './pages/Create';
import Status from './pages/Status';
import Recommendations from './pages/Recommendations';
import Overview from './pages/Overview';
import NotFound from './pages/NotFound';

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<Landing />} />
            <Route path="create" element={<Create />} />

            {/* Protected routes - require valid tripId */}
            <Route
              path="trip/:tripId/status"
              element={
                <ProtectedRoute>
                  <Status />
                </ProtectedRoute>
              }
            />
            <Route
              path="trip/:tripId/recommendations"
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="trip/:tripId/overview"
              element={
                <ProtectedRoute>
                  <Overview />
                </ProtectedRoute>
              }
            />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
