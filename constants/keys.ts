/**
 * ─────────────────────────────────────────────────────────────────
 *  GOOGLE MAPS API KEY
 * ─────────────────────────────────────────────────────────────────
 *  1. Go to https://console.cloud.google.com/
 *  2. Create (or select) a project.
 *  3. Enable these APIs:
 *       • Places API
 *       • Geocoding API
 *       • Maps SDK for Android  (for production Android builds)
 *       • Maps SDK for iOS      (for production iOS builds)
 *  4. Under "Credentials" → "Create credentials" → "API key".
 *  5. Paste the key below.
 *
 *  RESTRICT YOUR KEY BEFORE GOING TO PRODUCTION:
 *    iOS     → restrict by iOS bundle ID (see app.json → expo.ios.bundleIdentifier)
 *    Android → restrict by package name + SHA-1 fingerprint
 *    Web     → restrict by HTTP referrer (your deployed domain)
 *
 *  NATIVE MAP TILES (standalone builds only — not needed for Expo Go):
 *    In app.json add:
 *      "android": { "config": { "googleMaps": { "apiKey": "<key>" } } }
 *      "ios":     { "config": { "googleMapsApiKey": "<key>" } }
 * ─────────────────────────────────────────────────────────────────
 */
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDEXKYofAMnXCBqDSOLakEhCkF7Hmt6AFY';
