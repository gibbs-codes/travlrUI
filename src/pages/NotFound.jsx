import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl text-gray-600 mb-8">Page Not Found</p>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
