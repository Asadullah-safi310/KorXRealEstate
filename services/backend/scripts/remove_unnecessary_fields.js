const { sequelize } = require('../config/db');

async function removeUnnecessaryFields() {
  try {
    console.log('Removing unnecessary fields from properties table...');
    
    // Remove is_photo_available column
    try {
      await sequelize.query(`
        ALTER TABLE properties 
        DROP COLUMN is_photo_available;
      `);
      console.log('✓ Removed is_photo_available column');
    } catch (err) {
      if (err.original && err.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠ is_photo_available column does not exist, skipping...');
      } else {
        throw err;
      }
    }

    // Remove is_attachment_available column
    try {
      await sequelize.query(`
        ALTER TABLE properties 
        DROP COLUMN is_attachment_available;
      `);
      console.log('✓ Removed is_attachment_available column');
    } catch (err) {
      if (err.original && err.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠ is_attachment_available column does not exist, skipping...');
      } else {
        throw err;
      }
    }

    // Remove is_video_available column
    try {
      await sequelize.query(`
        ALTER TABLE properties 
        DROP COLUMN is_video_available;
      `);
      console.log('✓ Removed is_video_available column');
    } catch (err) {
      if (err.original && err.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠ is_video_available column does not exist, skipping...');
      } else {
        throw err;
      }
    }

    // Remove total_floors column
    try {
      await sequelize.query(`
        ALTER TABLE properties 
        DROP COLUMN total_floors;
      `);
      console.log('✓ Removed total_floors column');
    } catch (err) {
      if (err.original && err.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠ total_floors column does not exist, skipping...');
      } else {
        throw err;
      }
    }

    // Remove total_units column (redundant with details.planned_units)
    try {
      await sequelize.query(`
        ALTER TABLE properties 
        DROP COLUMN total_units;
      `);
      console.log('✓ Removed total_units column');
    } catch (err) {
      if (err.original && err.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠ total_units column does not exist, skipping...');
      } else {
        throw err;
      }
    }

    console.log('\n✓ Migration completed successfully');
    console.log('Fields removed: is_photo_available, is_attachment_available, is_video_available, total_floors, total_units');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

removeUnnecessaryFields();
