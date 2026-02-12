const { sequelize } = require('../config/db');

async function fixPropertyTypeEnum() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    console.log('Updating property_type ENUM to include tower, market, sharak...');
    
    await sequelize.query(`
      ALTER TABLE properties 
      MODIFY COLUMN property_type ENUM('house', 'shop', 'office', 'plot', 'land', 'apartment', 'tower', 'market', 'sharak') 
      NOT NULL
    `);
    
    console.log('✓ property_type ENUM updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating property_type ENUM:', error);
    process.exit(1);
  }
}

fixPropertyTypeEnum();
