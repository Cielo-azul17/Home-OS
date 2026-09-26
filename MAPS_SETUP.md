# Google Maps API Setup

## Overview
The provider details modal now includes an interactive Google Maps view showing:
- Provider location with red marker
- User's current location (blue marker) via geolocation
- Route line connecting both locations
- Distance calculation

## Setup Instructions

### 1. Get a Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable these APIs:
   - Maps JavaScript API
   - Geometry Library (for distance calculations)
4. Go to Credentials → Create API Key
5. Copy your API key

### 2. Add API Key to Environment
Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE',
  geminiApiKey: 'your_gemini_api_key_here',
};
```

### 3. Test
1. Start the dev server: `npm start`
2. Navigate to an asset detail page
3. Click "Request Service"
4. Select a provider from the list
5. The map should now display with provider location

## Features
- **Geolocation**: Automatically gets user's current location
- **Fallback**: If geolocation is denied, defaults to Pune city center (18.5204, 73.8567)
- **Distance**: Calculates distance between user and provider
- **Interactive**: Map supports zoom, pan, and full-screen controls

## API Key Security
⚠️ The API key in `environment.ts` is currently visible in source code. For production:
1. Move the key to a backend service
2. Use environment variables during build time
3. Or restrict the API key to specific domains in Google Cloud Console
