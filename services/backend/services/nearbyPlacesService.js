const { NearbyCache, Property } = require('../models');
const { searchNearbyPlaces } = require('./googlePlacesClient');
const { Op } = require('sequelize');

const CACHE_TTL_DAYS = parseInt(process.env.NEARBY_TTL_DAYS || '30', 10);
const DEFAULT_RADIUS_M = parseInt(process.env.NEARBY_RADIUS_M || '1000', 10);

const getNearbyCacheForProperty = async (propertyId) => {
  const property = await Property.findByPk(propertyId);

  if (!property) {
    throw new Error('Property not found');
  }

  let entityType;
  let entityId;
  let sourceLatitude = property.latitude;
  let sourceLongitude = property.longitude;

  if (property.parent_id) {
    const parent = await Property.findByPk(property.parent_id);
    if (!parent) {
      throw new Error('Parent container not found');
    }

    entityType = 'PARENT_CONTAINER';
    entityId = property.parent_id;
    sourceLatitude = parent.latitude;
    sourceLongitude = parent.longitude;
  } else {
    entityType = 'PROPERTY';
    entityId = propertyId;
  }

  if (!sourceLatitude || !sourceLongitude) {
    return {
      available: false,
      message: 'Location not set for this property',
      sourceEntity: { entity_type: entityType, entity_id: entityId },
      categories: {},
    };
  }

  let cache = await NearbyCache.findOne({
    where: {
      entity_type: entityType,
      entity_id: entityId,
    },
  });

  const now = new Date();
  const isCacheValid = cache && new Date(cache.expires_at) > now;

  if (isCacheValid) {
    console.log(`✅ Returning cached nearby places for ${entityType}:${entityId}`);
    return {
      available: cache.data_json.available !== false,
      message: cache.data_json.message || null,
      sourceEntity: { entity_type: entityType, entity_id: entityId },
      radius_m: cache.radius_m,
      categories: cache.data_json.categories || {},
      updated_at: cache.updatedAt,
      cached: true,
    };
  }

  console.log(`🔍 Fetching new nearby places from Google for ${entityType}:${entityId}`);

  const googleResult = await searchNearbyPlaces(
    parseFloat(sourceLatitude),
    parseFloat(sourceLongitude),
    DEFAULT_RADIUS_M
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  const cacheData = {
    entity_type: entityType,
    entity_id: entityId,
    radius_m: DEFAULT_RADIUS_M,
    types: ['mosque', 'school', 'market', 'square', 'hospital'],
    data_json: {
      available: googleResult.available,
      message: googleResult.message || null,
      categories: googleResult.categories,
    },
    expires_at: expiresAt,
  };

  if (cache) {
    await cache.update(cacheData);
  } else {
    cache = await NearbyCache.create(cacheData);
  }

  return {
    available: googleResult.available,
    message: googleResult.message || null,
    sourceEntity: { entity_type: entityType, entity_id: entityId },
    radius_m: DEFAULT_RADIUS_M,
    categories: googleResult.categories,
    updated_at: cache.updatedAt,
    cached: false,
  };
};

module.exports = {
  getNearbyCacheForProperty,
};
