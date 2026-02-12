const { sequelize } = require('../config/db');
const { UserPermission } = require('../models');

const migratePermissions = async () => {
  try {
    console.log('Starting permissions table migration...');
    
    await sequelize.authenticate();
    console.log('Database connection established');

    await UserPermission.sync({ force: false });
    console.log('user_permissions table created/verified successfully');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migratePermissions();
