import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export function useGooglePlacesAutocomplete({ onPlaceSelected, onError, types = ['(cities)'] }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      const errorMsg = 'Google Places API key is not configured';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    setIsLoading(true);

    loader
      .load()
      .then(() => {
        if (!inputRef.current) return;

        // Initialize autocomplete
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types,
          fields: ['name', 'formatted_address', 'geometry'],
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();

          if (!place || !place.geometry || !place.geometry.location) {
            const errorMsg = 'Please select a valid city from the dropdown';
            setError(errorMsg);
            if (onError) onError(errorMsg);
            return;
          }

          setError('');
          onPlaceSelected({
            name: place.name || '',
            formatted_address: place.formatted_address || '',
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
          });
        });

        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        const errorMsg = 'Failed to load Google Places API';
        console.error(errorMsg, err);
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setIsLoading(false);
      });

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelected, onError, types]);

  return {
    inputRef,
    isLoading,
    isLoaded,
    error,
  };
}
