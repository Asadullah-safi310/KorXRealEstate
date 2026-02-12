# Google Maps API Key Setup Guide

## What is this for?

Your KorX Real Estate app uses Google Maps to:
- Show interactive maps when agents add properties
- Let agents search for locations (e.g., "Laghman Tower")
- Display property locations on profile pages

**You MUST add a Google API key before deploying to production.**

---

## Step 1: Create Google Cloud Account

### 1.1 Go to Google Cloud Console
- Open your web browser
- Visit: https://console.cloud.google.com
- Click **"Sign in"** with your Google account (Gmail)

### 1.2 Accept Terms
- If this is your first time, accept Google Cloud terms of service
- You'll get **$200 free credit** for 90 days (for new users)

---

## Step 2: Create a New Project

### 2.1 Create Project
- Click the **project dropdown** at the top (next to "Google Cloud")
- Click **"NEW PROJECT"**
- Enter project name: `KorX Real Estate` (or any name you prefer)
- Click **"CREATE"**
- Wait 10-20 seconds for project creation

### 2.2 Select Your Project
- Click the **project dropdown** again
- Select your newly created project

---

## Step 3: Enable Required APIs

You need to enable 3 APIs for the app to work properly.

### 3.1 Enable Maps SDK for Android
1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search box, type: `Maps SDK for Android`
3. Click on **"Maps SDK for Android"**
4. Click the blue **"ENABLE"** button
5. Wait for it to enable (5-10 seconds)

### 3.2 Enable Maps SDK for iOS
1. Click **"APIs & Services"** → **"Library"** again
2. Search for: `Maps SDK for iOS`
3. Click on **"Maps SDK for iOS"**
4. Click **"ENABLE"**
5. Wait for it to enable

### 3.3 Enable Geocoding API
1. Go back to **"Library"**
2. Search for: `Geocoding API`
3. Click on **"Geocoding API"**
4. Click **"ENABLE"**
5. Wait for it to enable

---

## Step 4: Create API Key

### 4.1 Go to Credentials
1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. Click the **"+ CREATE CREDENTIALS"** button at the top
3. Select **"API key"**

### 4.2 Copy Your API Key
- A popup will appear with your API key
- It looks like: `AIzaSyD1234567890abcdefghijklmnopqrstuvw`
- Click the **"COPY"** button to copy it
- **IMPORTANT**: Keep this window open or save the key somewhere safe

### 4.3 (Optional but Recommended) Restrict Your API Key
1. Click **"EDIT API KEY"** in the popup (or click the key name later)
2. Under **"Application restrictions"**:
   - Select **"Android apps"** and add your app package name
   - Or select **"iOS apps"** and add your bundle ID
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check: Maps SDK for Android, Maps SDK for iOS, Geocoding API
4. Click **"SAVE"**

---

## Step 5: Add API Key to Your App

Now you need to add the API key to your app configuration file.

### 5.1 Open app.json File
1. Go to your project folder: `KorX/mobile/`
2. Open the file named: `app.json`
3. You can use any text editor (Notepad, VS Code, etc.)

### 5.2 Find the iOS Section
Look for this section (around line 12-18):

```json
"ios": {
  "config": {
    "googleMapsApiKey": ""
  }
}
```

### 5.3 Add Your API Key for iOS
Replace the empty quotes `""` with your API key:

```json
"ios": {
  "config": {
    "googleMapsApiKey": "AIzaSyD1234567890abcdefghijklmnopqrstuvw"
  }
}
```

**IMPORTANT**: Keep the quotes around your key!

### 5.4 Find the Android Section
Scroll down to find this section (around line 33-36):

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": ""
    }
  }
}
```

### 5.5 Add Your API Key for Android
Replace the empty quotes with the **same API key**:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "AIzaSyD1234567890abcdefghijklmnopqrstuvw"
    }
  }
}
```

### 5.6 Save the File
- Save the `app.json` file (Ctrl+S or Cmd+S)
- Close the editor

---

## Step 6: Rebuild Your App

After adding the API key, you MUST rebuild your app for changes to take effect.

### For Development:
```bash
# Stop your current app (Ctrl+C in terminal)
# Clear cache and restart
npx expo start -c
```

### For Production:
```bash
# Rebuild your app
eas build --platform android
eas build --platform ios
```

---

## How to Verify It's Working

### Test 1: Map Display
1. Open your app
2. Go to **"Add Property"**
3. Navigate to the **"Property Location"** step
4. You should see a clean map (no watermarks or warnings)

### Test 2: Location Search
1. In the same location step
2. Type a location in the search box: `Kabul`
3. Click the search button
4. You should see search results appear

### Test 3: Current Location
1. Click the **"Current Location"** button (GPS icon)
2. Map should zoom to your current location
3. This works even without API key (uses device GPS)

---

## Costs & Billing

### Free Tier (Forever)
- **Maps Display**: Unlimited FREE on mobile apps
- **Geocoding (Search)**: 10,000 requests/month FREE
- **Reverse Geocoding**: 10,000 requests/month FREE

### If You Exceed Free Tier
- **Geocoding**: $5 per 1,000 additional requests
- For most real estate apps, you'll stay within free limits

### Example Usage
- 10 agents × 30 searches/day = 9,000 searches/month = **FREE**
- Viewing property maps = unlimited = **FREE**

### Enable Billing (Optional)
1. Go to Google Cloud Console
2. Click **"Billing"** in the left sidebar
3. Click **"LINK A BILLING ACCOUNT"**
4. Add your credit card
5. You won't be charged unless you exceed free limits

---

## Troubleshooting

### Problem: Map shows "For development purposes only" watermark
**Solution**: You haven't added the API key correctly. Double-check Step 5.

### Problem: Search doesn't return results
**Solution**: 
- Make sure Geocoding API is enabled (Step 3.3)
- Verify API key is added correctly (Step 5)
- Check you have internet connection

### Problem: "This API project is not authorized to use this API"
**Solution**: 
- Go back to Step 3 and enable all 3 APIs
- Make sure you're in the correct Google Cloud project

### Problem: Maps work in development but not production
**Solution**: 
- Rebuild your production app (Step 6)
- API keys are baked into the app at build time

---

## Security Best Practices

### DO:
✅ Add API key restrictions (Step 4.3)
✅ Use separate keys for development and production
✅ Monitor usage in Google Cloud Console

### DON'T:
❌ Share your API key publicly
❌ Commit API keys to public GitHub repositories
❌ Use the same key across multiple unrelated apps

---

## Need Help?

If you're stuck:
1. Check the troubleshooting section above
2. Verify each step was completed in order
3. Check Google Cloud Console → APIs & Services → Dashboard to see API usage
4. Contact your development team with screenshots of any error messages

---

## Summary Checklist

Before deploying to production, make sure:

- [ ] Google Cloud account created
- [ ] New project created in Google Cloud
- [ ] Maps SDK for Android enabled
- [ ] Maps SDK for iOS enabled  
- [ ] Geocoding API enabled
- [ ] API key created and copied
- [ ] API key added to `app.json` (iOS section)
- [ ] API key added to `app.json` (Android section)
- [ ] App rebuilt after adding keys
- [ ] Map display tested (no watermarks)
- [ ] Location search tested (returns results)
- [ ] (Optional) API key restrictions configured
- [ ] (Optional) Billing account linked

**Estimated Time**: 15-20 minutes for first-time setup

---

*Last Updated: February 2026*
