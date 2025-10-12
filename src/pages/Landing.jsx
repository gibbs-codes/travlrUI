import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl font-bold mb-4">Welcome to TravlrAPI</h1>
      <p className="text-xl text-gray-600 mb-8">Plan your perfect trip with AI assistance</p>
      <button
        onClick={() => navigate('/create')}
        className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Plan a Trip
      </button>
    </div>
  );
}
