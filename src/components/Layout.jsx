import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              TravlrAPI
            </Link>

            {!isHomePage && (
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
