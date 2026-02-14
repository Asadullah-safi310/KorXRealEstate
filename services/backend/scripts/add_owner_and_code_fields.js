const { sequelize } = require('../config/db');

async function addOwnerAndCodeFields() {
  try {
    console.log('Adding owner_name and property_code fields to properties table...');
    
    try {
      await sequelize.query(`
        ALTER TABLE properties 
        ADD COLUMN owner_name VARCHAR(255) NULL COMMENT 'Name of the real property owner';
      `);
      console.log('✓ Added owner_name column');
    } catch (err) {
      if (err.original && err.original.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠ owner_name column already exists, skipping...');
      } else {
        throw err;
      }
    }

    try {
      await sequelize.query(`
        ALTER TABLE properties 
        ADD COLUMN property_code VARCHAR(50) NULL COMMENT 'Unique auto-generated property code';
      `);
      console.log('✓ Added property_code column');
    } catch (err) {
      if (err.original && err.original.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠ property_code column already exists, skipping...');
      } else {
        throw err;
      }
    }

    console.log('Creating indexes...');
    
    try {
      await sequelize.query(`
        CREATE INDEX idx_owner_name ON properties(owner_name);
      `);
      console.log('✓ Created index on owner_name');
    } catch (err) {
      if (err.original && err.original.code === 'ER_DUP_KEYNAME') {
        console.log('⚠ Index idx_owner_name already exists, skipping...');
      } else {
        throw err;
      }
    }

    try {
      await sequelize.query(`
        CREATE UNIQUE INDEX idx_property_code ON properties(property_code);
      `);
      console.log('✓ Created unique index on property_code');
    } catch (err) {
      if (err.original && err.original.code === 'ER_DUP_KEYNAME') {
        console.log('⚠ Index idx_property_code already exists, skipping...');
      } else {
        throw err;
      }
    }

    console.log('\n✓ Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

addOwnerAndCodeFields();
