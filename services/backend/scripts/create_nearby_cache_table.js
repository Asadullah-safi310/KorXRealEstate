const { sequelize } = require('../config/db');
const NearbyCache = require('../models/NearbyCache');

const createNearbyCacheTable = async () => {
  try {
    console.log('Creating nearby_cache table...');
    
    await NearbyCache.sync({ force: false });
    
    console.log('✅ nearby_cache table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating nearby_cache table:', error);
    process.exit(1);
  }
};

createNearbyCacheTable();
