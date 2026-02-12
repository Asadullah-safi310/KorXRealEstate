const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./config/db');

async function migrate() {
  try {
    console.log('Making purpose and area_size nullable...');
    
    // Disable foreign key checks
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Alter table to allow NULL for purpose and area_size
    await sequelize.query("ALTER TABLE properties MODIFY COLUMN purpose VARCHAR(20) NULL");
    await sequelize.query("ALTER TABLE properties MODIFY COLUMN area_size VARCHAR(50) NULL");
    await sequelize.query("ALTER TABLE properties MODIFY COLUMN title VARCHAR(255) NULL");

    // Re-enable foreign key checks
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
