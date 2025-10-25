import { useEffect, useRef, useState } from 'react';

interface PlaceResult {
  name: string;
  formatted_address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface UseGooglePlacesAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  onError?: (error: string) => void;
  types?: string[];
}

export function useGooglePlacesAutocomplete({
  onPlaceSelected,
  onError,
  types = ['(cities)'],
}: UseGooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      const errorMsg = 'Google Places API key is not configured';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);

    // Load the Google Maps JavaScript API dynamically
    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if already loaded
        if (window.google?.maps?.places) {
          resolve();
          return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Script load error')));
          return;
        }

        // Create and append script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
      });
    };

    loadGoogleMapsScript()
      .then(() => {
        if (!inputRef.current) return;

        // Initialize autocomplete
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            types,
            fields: ['name', 'formatted_address', 'geometry'],
          }
        );

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();

          if (!place || !place.geometry || !place.geometry.location) {
            const errorMsg = 'Please select a valid city from the dropdown';
            setError(errorMsg);
            onError?.(errorMsg);
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
        onError?.(errorMsg);
        setIsLoading(false);
      });

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
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
