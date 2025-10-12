import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AGENT_CONFIG = [
  { id: 'flight', name: 'Flight Agent', icon: '✈️' },
  { id: 'accommodation', name: 'Accommodation Agent', icon: '🏨' },
  { id: 'activity', name: 'Activity Agent', icon: '🎯' },
  { id: 'restaurant', name: 'Restaurant Agent', icon: '🍽️' },
  { id: 'transportation', name: 'Transportation Agent', icon: '🚗' }
];

const POLL_INTERVAL = 3000; // 3 seconds

// Status icon components
function PendingIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
    </div>
  );
}

function RunningIcon() {
  return (
    <div className="w-6 h-6">
      <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}

function CompletedIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
  );
}

function FailedIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
  );
}

function AgentStatusIcon({ status }) {
  switch (status) {
    case 'running':
      return <RunningIcon />;
    case 'completed':
      return <CompletedIcon />;
    case 'failed':
      return <FailedIcon />;
    default:
      return <PendingIcon />;
  }
}

function AgentStatusText({ status, count }) {
  switch (status) {
    case 'running':
      return <span className="text-blue-600">Searching...</span>;
    case 'completed':
      return <span className="text-green-600">Found {count || 0} recommendation{count !== 1 ? 's' : ''}</span>;
    case 'failed':
      return <span className="text-red-600">Failed - will retry</span>;
    default:
      return <span className="text-gray-500">Waiting...</span>;
  }
}

export default function Status() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [tripData, setTripData] = useState(null);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [recommendationCounts, setRecommendationCounts] = useState({});
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const pollIntervalRef = useRef(null);

  const fetchTripStatus = async () => {
    try {
      const response = await fetch(`http://jamess-mac-mini:3006/api/trip/${tripId}/status`);

      if (!response.ok) {
        throw new Error(`Failed to fetch trip status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      const { data } = result;
      setTripData(data);
      setAgentStatuses(data.execution?.agents || {});
      setRecommendationCounts(data.recommendationCounts || {});
      setError(null);

      // Check if planning is complete
      if (data.status === 'recommendations_ready') {
        setIsPolling(false);
        // Navigate to recommendations page after a short delay
        setTimeout(() => {
          navigate(`/trip/${tripId}/recommendations`);
        }, 1500);
      }

    } catch (err) {
      console.error('Error fetching trip status:', err);
      setError(err.message);
      setIsPolling(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTripStatus();

    // Set up polling interval
    if (isPolling) {
      pollIntervalRef.current = setInterval(fetchTripStatus, POLL_INTERVAL);
    }

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [tripId, isPolling]);

  const handleRetry = () => {
    setError(null);
    setIsPolling(true);
  };

  const calculateOverallProgress = () => {
    const totalAgents = AGENT_CONFIG.length;
    const completedAgents = Object.values(agentStatuses).filter(status => status === 'completed').length;
    return Math.round((completedAgents / totalAgents) * 100);
  };

  const overallProgress = calculateOverallProgress();
  const destination = tripData?.destination || 'your destination';

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Error Loading Trip Status</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RunningIcon />
            <p className="mt-4 text-gray-600">Loading trip status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">
        Planning your trip to {destination}
      </h1>
      <p className="text-gray-600 mb-8">Our AI agents are working to find the best options for you</p>

      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Agent Status List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Agent Status
          </h3>
          {AGENT_CONFIG.map((agent) => {
            const status = agentStatuses[agent.id] || 'pending';
            const count = recommendationCounts[agent.id] || 0;

            return (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <AgentStatusIcon status={status} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{agent.icon}</span>
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                    <div className="text-sm mt-1">
                      <AgentStatusText status={status} count={count} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Message */}
      {tripData.status === 'recommendations_ready' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-fade-in">
          <div className="text-green-600 text-4xl mb-2">✓</div>
          <p className="text-green-800 font-semibold text-lg">Planning Complete!</p>
          <p className="text-green-700 text-sm mt-1">Redirecting to recommendations...</p>
        </div>
      )}
    </div>
  );
}
