// Google Maps JavaScript API type declarations
// This file tells TypeScript about the google.maps global object

declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  namespace places {
    class Autocomplete {
      constructor(
        inputField: HTMLInputElement,
        opts?: AutocompleteOptions
      );
      addListener(eventName: string, handler: () => void): void;
      getPlace(): PlaceResult;
    }

    interface AutocompleteOptions {
      types?: string[];
      fields?: string[];
      componentRestrictions?: { country?: string | string[] };
      bounds?: any;
      strictBounds?: boolean;
    }

    interface PlaceResult {
      name?: string;
      formatted_address?: string;
      geometry?: {
        location: LatLng;
      };
      address_components?: any[];
      place_id?: string;
      types?: string[];
    }
  }

  namespace event {
    function clearInstanceListeners(instance: any): void;
  }
}

export {};
