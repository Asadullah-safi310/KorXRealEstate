# Nearby Places (Google Places) — Parent-only calls + Child inheritance + Standalone caching

## 1. Feature summary

This feature shows nearby places around properties:
- **Mosques**
- **Schools**  
- **Markets**
- **Squares (چهاراهی)**
- **Hospitals and clinics**

### Key rules:
- **Parent containers** (Tower/Market/Sharak) call Google and cache results
- **Child units** inherit parent's nearby results and **never call Google**
- **Standalone properties** call Google once and cache results

## 2. Data model (important concepts)

### Property types
- **Parent container**: `record_kind="container"`, `is_parent=1`, has `lat/lng`
- **Child unit**: `record_kind="listing"`, `is_parent=0`, has `parent_id`
- **Standalone listing**: `record_kind="listing"`, `is_parent=0`, `parent_id=NULL`, has its own `lat/lng`

### Nearby Cache entity types
We cache by entity:
- `PARENT_CONTAINER` + `parent_id`
- `PROPERTY` + `property_id` (standalone only)

## 3. Database schema

### Table: `nearby_cache`

**Columns:**
- `cache_id` (PK, INT, AUTO_INCREMENT)
- `entity_type` (ENUM: 'PARENT_CONTAINER' | 'PROPERTY')
- `entity_id` (INT) - parent_id or property_id
- `radius_m` (INT) - search radius in meters
- `types` (JSON) - array of place types searched
- `data_json` (JSON) - cached response with minimal fields
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)
- `expires_at` (DATETIME)

**Indexes:**
- `(entity_type, entity_id)` UNIQUE
- `expires_at`

## 4. Backend endpoint

### `GET /api/public/properties/:id/nearby`

**Flow:**
1. Load property from database
2. If child with `parent_id` → use parent cache key (`PARENT_CONTAINER`, `parent_id`)
3. Else standalone → use (`PROPERTY`, `property_id`)
4. Check `nearby_cache` table
5. If fresh cache exists → return cached data
6. If expired/missing → call Google Places Nearby Search
7. Save/update cache → return results

**Return shape:**
```json
{
  "available": true,
  "message": null,
  "sourceEntity": { 
    "entity_type": "PARENT_CONTAINER", 
    "entity_id": 123 
  },
  "radius_m": 1000,
  "categories": {
    "mosque": [
      { 
        "place_id": "ChIJ...", 
        "name": "Central Mosque", 
        "distance_m": 250, 
        "lat": 34.5234, 
        "lng": 69.1823,
        "category": "mosque"
      }
    ],
    "school": [...],
    "market": [...],
    "square": [...],
    "hospital": [...]
  },
  "updated_at": "2024-01-15T10:30:00.000Z",
  "cached": true
}
```

**When unavailable (no API key):**
```json
{
  "available": false,
  "message": "Nearby places feature is not available yet. We will provide this feature soon.",
  "categories": {}
}
```

## 5. Caching policy

- **Cache per entity** (not per user)
- Only call Google when:
  - No cache found, OR
  - Cache expired, OR
  - Location changed
- **Limit results**: top 3-4 per category
- **Small radius**: default 1000m (configurable via `NEARBY_RADIUS_M`)
- **Child units never call Google** (always inherit parent)
- **Cache TTL**: 30 days (configurable via `NEARBY_TTL_DAYS`)

**⚠️ NOTE:**  
Google Places has caching restrictions. Store `place_id` safely. Refresh results as needed (every 30 days by default).

## 6. Google setup (when you get the real API)

1. Create **Google Cloud project**
2. Enable **Places API (Nearby Search)**
3. Create **API key**
4. **Restrict key**:
   - Restrict to your backend server IP / domain
   - ❌ **Do NOT ship unrestricted key in mobile app**
5. Add key to backend `.env`:
   ```env
   GOOGLE_MAPS_API_KEY=AIza...your_key_here
   NEARBY_RADIUS_M=1000
   NEARBY_TTL_DAYS=30
   ```
6. Restart backend server
7. **Test with parent container**:
   - Open a parent container with `lat/lng` set
   - Call `GET /api/public/properties/:id/nearby`
   - Confirm cache row created in `nearby_cache` table
8. **Confirm child unit behavior**:
   - Call endpoint for a child property
   - It should return parent cached data (no new Google call)

## 7. Mobile UI behavior

- Property details screen calls `GET /api/public/properties/:id/nearby`
- Show **loader** until response arrives
- Render **4-5 category sections** with place names and distances
- If no results → show "No nearby places found"
- If unavailable → show: _"Nearby places information is not available yet. We will provide this feature soon."_

## 8. Files touched (implementation reference)

### Backend:
- ✅ `services/backend/models/NearbyCache.js` - Database model
- ✅ `services/backend/models/index.js` - Export model
- ✅ `services/backend/scripts/create_nearby_cache_table.js` - Migration script
- ✅ `services/backend/services/googlePlacesClient.js` - Google API client
- ✅ `services/backend/services/nearbyPlacesService.js` - Caching logic
- ✅ `services/backend/controllers/propertyController.js` - `getNearbyPlaces` controller
- ✅ `services/backend/routes/public/propertyRoutes.js` - Route definition
- ✅ `services/backend/.env.example` - Environment variables

### Mobile:
- ✅ `mobile/src/services/property.service.ts` - API call method
- ✅ `mobile/src/components/property/NearbyPlaces.tsx` - UI component
- ✅ `mobile/src/features/property/screens/[id].tsx` - Integrated into PropertyDetails

### Documentation:
- ✅ `Documentation/nearby-places.md` - This file

## 9. Running the migration

To create the `nearby_cache` table, run:

```bash
cd services/backend
node scripts/create_nearby_cache_table.js
```

## 10. Testing without Google API key

Until you add a real Google API key:
- The feature will show: _"Nearby places information is not available yet. We will provide this feature soon."_
- No errors will occur
- The cache table and endpoints are ready
- Once you add `GOOGLE_MAPS_API_KEY` to `.env`, the feature will automatically start working

## 11. Cost optimization notes

- ✅ Parent containers call Google **once** and all child units reuse the same data
- ✅ Standalone properties cache results for 30 days
- ✅ Only 3-4 results per category (small API response)
- ✅ Small radius (1000m default) reduces search scope
- ✅ Cache expiration prevents unnecessary API calls

**Example cost savings:**
- A tower with 50 apartments = **1 Google API call** (not 50)
- A standalone house = **1 call per 30 days** (not on every view)

---

## ✅ Implementation complete

All backend and mobile components are ready. Add your Google Maps API key when available to enable the feature.
