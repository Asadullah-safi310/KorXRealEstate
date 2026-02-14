const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

const PLACE_TYPE_MAPPING = {
  mosque: 'mosque',
  school: 'school',
  market: 'supermarket',
  square: 'intersection',
  hospital: 'hospital',
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

const searchNearbyPlaces = async (latitude, longitude, radiusMeters = 1000) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.log('⚠️ Google Maps API key not configured - returning unavailable status');
    return {
      available: false,
      message: 'Nearby places feature is not available yet. We will provide this feature soon.',
      categories: {},
    };
  }

  try {
    const categories = {};
    const categoriesConfig = ['mosque', 'school', 'market', 'square', 'hospital'];

    for (const category of categoriesConfig) {
      const googleType = PLACE_TYPE_MAPPING[category];
      
      try {
        const response = await axios.get(GOOGLE_PLACES_BASE_URL, {
          params: {
            location: `${latitude},${longitude}`,
            radius: radiusMeters,
            type: googleType,
            key: GOOGLE_MAPS_API_KEY,
          },
          timeout: 10000,
        });

        if (response.data.status === 'OK' && response.data.results) {
          const places = response.data.results
            .slice(0, 4)
            .map(place => ({
              place_id: place.place_id,
              name: place.name,
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
              distance_m: calculateDistance(
                latitude,
                longitude,
                place.geometry.location.lat,
                place.geometry.location.lng
              ),
              category,
            }))
            .sort((a, b) => a.distance_m - b.distance_m);

          categories[category] = places;
        } else {
          categories[category] = [];
        }
      } catch (error) {
        console.error(`Error fetching ${category}:`, error.message);
        categories[category] = [];
      }
    }

    return {
      available: true,
      categories,
    };
  } catch (error) {
    console.error('Error in searchNearbyPlaces:', error);
    throw error;
  }
};

module.exports = {
  searchNearbyPlaces,
};
