import { useEffect, useRef, useState } from 'react';

/// <reference types="google.maps" />

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
  const autocompleteRef = useRef<any>(null);
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

    // Function to check if Google Maps Places is fully loaded
    const isGoogleMapsPlacesReady = () => {
      return (
        typeof window !== 'undefined' &&
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        window.google.maps.places.Autocomplete
      );
    };

    // Function to initialize autocomplete
    const initializeAutocomplete = () => {
      if (!inputRef.current) {
        console.warn('Input ref not available yet');
        return;
      }

      try {
        // Create autocomplete instance
        const google = (window as any).google;
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            types,
            fields: ['name', 'formatted_address', 'geometry'],
          }
        );

        // Add place changed listener
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
        console.log('Google Places Autocomplete initialized successfully');
      } catch (err) {
        const errorMsg = 'Failed to initialize Google Places Autocomplete';
        console.error(errorMsg, err);
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
      }
    };

    // Load Google Maps script
    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if already fully loaded
        if (isGoogleMapsPlacesReady()) {
          console.log('Google Maps Places already loaded');
          resolve();
          return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com/maps/api/js"]'
        );

        if (existingScript) {
          console.log('Google Maps script tag exists, waiting for places library...');
          
          // Script exists but places might not be loaded yet
          // Poll until places is ready
          const checkInterval = setInterval(() => {
            if (isGoogleMapsPlacesReady()) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!isGoogleMapsPlacesReady()) {
              reject(new Error('Timeout waiting for Google Places library'));
            }
          }, 10000);

          return;
        }

        // Create new script tag
        console.log('Loading Google Maps script...');
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          console.log('Google Maps script loaded, waiting for places library...');
          
          // Script loaded, now wait for places library to be ready
          const checkInterval = setInterval(() => {
            if (isGoogleMapsPlacesReady()) {
              clearInterval(checkInterval);
              console.log('Google Places library ready!');
              resolve();
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!isGoogleMapsPlacesReady()) {
              reject(new Error('Timeout waiting for Google Places library'));
            }
          }, 10000);
        };

        script.onerror = () => {
          reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);
      });
    };

    // Main execution
    loadGoogleMapsScript()
      .then(() => {
        // Wait a tiny bit more to ensure everything is settled
        setTimeout(() => {
          initializeAutocomplete();
        }, 50);
      })
      .catch((err) => {
        const errorMsg = 'Failed to load Google Places API';
        console.error(errorMsg, err);
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
      });

    // Cleanup
    return () => {
      if (autocompleteRef.current && (window as any).google) {
        const google = (window as any).google;
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