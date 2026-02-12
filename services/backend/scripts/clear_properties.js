const { sequelize } = require('../config/db');

async function clearProperties() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await sequelize.query('DELETE FROM properties');
    console.log('✓ All data deleted from properties table');
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✓ Properties table cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing properties table:', error);
    process.exit(1);
  }
}

clearProperties();
