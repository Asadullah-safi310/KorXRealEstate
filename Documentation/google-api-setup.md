# Google API Setup Guide

This guide explains how to enable Google API features in your KorX Real Estate app.

## Features Using Google APIs

Currently, the following features are **disabled** and show "unavailable" messages:

1. **Location Search** (Mobile - Add Property Wizard)
   - Search for places/addresses on the map
   - File: `mobile/src/components/property/AddProperty/steps/StepLocation.tsx`

2. **Nearby Places** (Mobile - Property Details)
   - Show nearby mosques, schools, markets, squares, hospitals
   - File: `mobile/src/components/property/NearbyPlaces.tsx`

Both features are fully implemented but require a Google Maps API key to function.

---

## Step 1: Get Google Maps API Key

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Create Project** or select an existing project
3. Name it (e.g., "KorX Real Estate")
4. Click **Create**

### 1.2 Enable Required APIs

Enable these APIs for your project:

- ✅ **Maps SDK for Android**
- ✅ **Maps SDK for iOS**
- ✅ **Places API** (for nearby places)
- ✅ **Geocoding API** (for location search)

**How to enable:**
1. Go to **APIs & Services** → **Library**
2. Search for each API name
3. Click **Enable**

### 1.3 Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key (format: `AIza...`)

### 1.4 Restrict Your API Key (Important for Security)

1. Click on your API key to edit
2. Under **API restrictions**:
   - Select **Restrict key**
   - Choose the 4 APIs you enabled above
3. Under **Application restrictions**:
   - For **backend**: Restrict by IP address (your server IP)
   - For **mobile**: Restrict by iOS apps / Android apps
     - Add your app bundle IDs
4. Click **Save**

⚠️ **Security Warning**: Never commit unrestricted API keys to your repository!

---

## Step 2: Configure Backend (Nearby Places)

### 2.1 Add API Key to Backend

Edit `services/backend/.env`:

```env
# Google Maps API (Nearby Places)
GOOGLE_MAPS_API_KEY=AIza...your_key_here
NEARBY_RADIUS_M=1000
NEARBY_TTL_DAYS=30
```

### 2.2 Restart Backend Server

```bash
cd services/backend
npm run dev
```

### 2.3 Test Nearby Places

1. Open a parent property (Tower/Market/Sharak) in the app
2. View its details
3. Scroll to **Nearby Places** section
4. You should see nearby mosques, schools, etc.

✅ **Backend nearby places is now enabled!**

---

## Step 3: Configure Mobile (Location Search + Nearby Places)

### 3.1 Add API Key to app.json

Edit `mobile/app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "AIza...your_key_here"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIza...your_key_here"
        }
      }
    }
  }
}
```

⚠️ **Important**: 
- Use a **restricted** API key (restrict by app bundle ID)
- Do NOT commit this file with your API key to public repositories
- Add `app.json` to `.gitignore` or use environment variables

### 3.2 Enable Location Search

Edit `mobile/src/components/property/AddProperty/steps/StepLocation.tsx`:

**Find this section (around line 90):**

```typescript
const searchLocation = async () => {
  if (!searchQuery.trim()) return;
  
  alert('Location Search Unavailable\n\nThe location search feature is currently unavailable...');
  setSearching(false);
  return;
  
  /* Disabled until Google API key is configured
  try {
    setSearching(true);
    setShowResults(true);
    const results = await Location.geocodeAsync(searchQuery);
    // ... rest of the code
  }
  */
};
```

**Change to:**

```typescript
const searchLocation = async () => {
  if (!searchQuery.trim()) return;
  
  try {
    setSearching(true);
    setShowResults(true);
    const results = await Location.geocodeAsync(searchQuery);
    
    // Enrich results with reverse geocoding for better display
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude: result.latitude,
            longitude: result.longitude,
          });
          const address = addresses[0];
          return {
            ...result,
            displayName: [
              address?.name,
              address?.street,
              address?.district,
              address?.city,
              address?.region,
              address?.country
            ].filter(Boolean).join(', ') || 'Unknown Location',
          };
        } catch {
          return {
            ...result,
            displayName: 'Unknown Location',
          };
        }
      })
    );
    
    setSearchResults(enrichedResults);
    
    if (results.length === 0) {
      alert('No locations found. Try a different search term.');
    }
  } catch (error) {
    console.error('Error searching location:', error);
    alert('Failed to search location. Please try again.');
    setSearchResults([]);
  } finally {
    setSearching(false);
  }
};
```

**Also update the UI section (around line 194):**

Remove the unavailable notice and change opacity/disabled states:

```tsx
{/* Search Input */}
{isMapAvailable && (
  <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border, flex: 1 }]}>
        <Ionicons name="search" size={20} color={theme.subtext} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search location (e.g., Laghman Tower, Kabul)"
          placeholderTextColor={theme.text + '40'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchLocation}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setShowResults(false); setSearchResults([]); }}>
            <Ionicons name="close-circle" size={20} color={theme.subtext} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.searchButton, { backgroundColor: theme.primary }]}
        onPress={searchLocation}
        disabled={searching || !searchQuery.trim()}
      >
        {searching ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="search" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
```

### 3.3 Rebuild Your App

After making these changes, rebuild your app:

```bash
cd mobile

# For development
npx expo start --clear

# For production build
eas build --platform android
eas build --platform ios
```

✅ **Location search is now enabled!**

---

## Step 4: Verify Everything Works

### 4.1 Test Nearby Places (Backend)
1. Open property details in the app
2. Scroll to "Nearby Places"
3. Should show nearby locations with distances

### 4.2 Test Location Search (Mobile)
1. Go to Add Property wizard
2. Navigate to Location step
3. Search for "Kabul" or any location
4. Results should appear

---

## Cost Management

Google Maps APIs have usage-based pricing. Here's how KorX minimizes costs:

### Nearby Places (Backend)
- ✅ Parent containers call API **once**, all children inherit
- ✅ Results cached for **30 days** (configurable)
- ✅ Only **3-4 results** per category
- ✅ Small radius (**1000m**)

**Example savings:**
- Tower with 50 apartments = **1 API call** (not 50)
- Standalone house = **1 call every 30 days**

### Location Search (Mobile)
- Only called when user actively searches
- Results cached locally during session
- Expo Location API handles geocoding efficiently

### Free Tier
Google provides:
- **$200 free credit per month**
- Covers ~40,000 geocoding requests
- Or ~5,000 nearby search requests

For most real estate apps, this should be sufficient.

---

## Troubleshooting

### "Location search not working"
- ✅ Check API key is in `app.json`
- ✅ Verify Geocoding API is enabled
- ✅ Rebuild the app (`npx expo start --clear`)
- ✅ Check console for error messages

### "Nearby places shows unavailable"
- ✅ Check backend `.env` has `GOOGLE_MAPS_API_KEY`
- ✅ Verify Places API is enabled in Google Cloud
- ✅ Restart backend server
- ✅ Check backend console logs

### "API key restriction errors"
- ✅ Add your app's bundle ID to API restrictions
- ✅ For development, temporarily use unrestricted key
- ✅ For production, always use restricted keys

---

## Security Best Practices

1. ✅ **Never commit API keys** to version control
2. ✅ **Use restricted keys** (by app bundle ID or IP)
3. ✅ **Different keys** for development and production
4. ✅ **Monitor usage** in Google Cloud Console
5. ✅ **Set spending limits** to avoid unexpected charges

---

## Summary

- **Backend**: Add key to `.env`, restart server
- **Mobile**: Add key to `app.json`, enable code in `StepLocation.tsx`, rebuild app
- **Both features** will automatically work once configured
- **Cost-optimized** with caching and smart API usage

✅ **Setup complete!** Your Google API features are now enabled.
