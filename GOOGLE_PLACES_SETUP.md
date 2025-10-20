# Google Places Autocomplete Setup

This project uses Google Places Autocomplete API to validate destination and origin city inputs, preventing users from entering invalid locations that could break the API.

## Features

- ✅ City-only autocomplete (filters to `(cities)` type)
- ✅ Dropdown suggestions as user types
- ✅ Validation to ensure selection from dropdown
- ✅ Stores city name and coordinates
- ✅ Loading states during API initialization
- ✅ Error handling for invalid selections or API failures

## Setup Instructions

### 1. Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** for your project:
   - Navigate to **APIs & Services** > **Library**
   - Search for "Places API"
   - Click **Enable**
4. Create credentials:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy your API key

### 2. Restrict Your API Key (Recommended)

To prevent unauthorized use:

1. Click on your API key in the Credentials page
2. Under **Application restrictions**:
   - Choose **HTTP referrers (web sites)**
   - Add your domains (e.g., `localhost:3000/*`, `yourdomain.com/*`)
3. Under **API restrictions**:
   - Choose **Restrict key**
   - Select **Places API** only
4. Click **Save**

### 3. Configure Environment Variables

Create a `.env.local` file in the project root (or update your existing `.env` file):

```bash
# For Next.js (app/create/page.tsx)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here

# For React/Vite (src/pages/Create.jsx)
VITE_GOOGLE_PLACES_API_KEY=your_api_key_here

# For Create React App
REACT_APP_GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Important:**
- Never commit your `.env.local` file to version control
- The `.env.example` file is provided as a template
- API keys with `NEXT_PUBLIC_`, `VITE_`, or `REACT_APP_` prefixes are exposed to the browser (this is expected for Google Places)

### 4. Restart Development Server

After adding the environment variables, restart your development server:

```bash
npm run dev
```

## Usage

The autocomplete is automatically integrated into both create forms:

### Next.js Version (`app/create/page.tsx`)
- Uses `useGooglePlacesAutocomplete` hook from `app/hooks/useGooglePlacesAutocomplete.ts`
- Validates selection before form submission
- Stores coordinates in `formData.destinationCoordinates` and `formData.originCoordinates`

### React Version (`src/pages/Create.jsx`)
- Uses `useGooglePlacesAutocomplete` hook from `src/hooks/useGooglePlacesAutocomplete.js`
- Same validation and coordinate storage as Next.js version

## Validation Behavior

1. **User types in field** → Google Places suggestions appear
2. **User selects from dropdown** → City name and coordinates are saved
3. **User manually types without selecting** → Form validation error: "Please select a destination from the dropdown suggestions"
4. **API fails to load** → Warning message shown, form still allows submission (graceful degradation)

## Error Handling

The implementation includes comprehensive error handling:

- **No API key configured**: Shows warning message, allows fallback to manual entry
- **API fails to load**: Shows error message, form remains functional
- **Invalid selection**: Prompts user to select from dropdown
- **Network issues**: Gracefully degrades to manual entry

## Cost Considerations

Google Places API has usage limits and pricing:

- **Free tier**: $200/month credit (approximately 40,000 requests)
- **Cost per request**: $0.017 per Autocomplete session
- **Optimization**: The hook only initializes once per page load

For development, the free tier is usually sufficient. For production, monitor usage in [Google Cloud Console](https://console.cloud.google.com/).

## Troubleshooting

### Autocomplete not appearing
1. Check that your API key is correctly set in `.env.local`
2. Verify the API key has Places API enabled
3. Check browser console for errors
4. Ensure you've restarted the development server after adding environment variables

### "API key not configured" error
- Make sure you're using the correct environment variable prefix:
  - Next.js: `NEXT_PUBLIC_`
  - Vite: `VITE_`
  - Create React App: `REACT_APP_`

### Dropdown appears but selection doesn't work
- This is expected behavior - the autocomplete is listening for the `place_changed` event
- Make sure to click an option from the dropdown, not just type and blur

### "Request failed" or CORS errors
1. Check that your API key has HTTP referrer restrictions properly configured
2. Verify your domain is added to the allowed referrers list
3. Ensure Places API is enabled for your project

## Development vs Production

### Development
- Use `localhost:3000` in HTTP referrer restrictions
- Monitor usage to stay within free tier

### Production
- Add your production domain to HTTP referrer restrictions
- Set up billing alerts in Google Cloud Console
- Consider implementing rate limiting or caching strategies
- Monitor API usage regularly

## Additional Resources

- [Google Places Autocomplete Documentation](https://developers.google.com/maps/documentation/javascript/place-autocomplete)
- [Google Maps JavaScript API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Places API Usage and Billing](https://developers.google.com/maps/billing-and-pricing/billing)
