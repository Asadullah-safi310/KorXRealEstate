const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'real_estate_pms',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Clean up orphan records that cause FK constraint failures
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Check if properties table exists and nullify invalid foreign keys
      await sequelize.query(`
        UPDATE properties 
        SET agent_id = NULL 
        WHERE agent_id NOT IN (SELECT user_id FROM users)
      `).catch(() => {});

      await sequelize.query(`
        UPDATE properties 
        SET created_by_user_id = NULL 
        WHERE created_by_user_id NOT IN (SELECT user_id FROM users)
      `).catch(() => {});

      await sequelize.query(`
        UPDATE properties 
        SET owner_person_id = NULL 
        WHERE owner_person_id NOT IN (SELECT id FROM persons)
      `).catch(() => {});

      await sequelize.query(`
        UPDATE properties 
        SET province_id = NULL 
        WHERE province_id NOT IN (SELECT id FROM provinces)
      `).catch(() => {});

      await sequelize.query(`
        UPDATE properties 
        SET district_id = NULL 
        WHERE district_id NOT IN (SELECT id FROM districts)
      `).catch(() => {});

      await sequelize.query(`
        UPDATE properties 
        SET area_id = NULL 
        WHERE area_id NOT IN (SELECT id FROM areas)
      `).catch(() => {});

      // Cleanup deals table
      await sequelize.query(`
        UPDATE deals 
        SET property_id = NULL 
        WHERE property_id NOT IN (SELECT property_id FROM properties)
      `).catch(() => {});

      await sequelize.query(`
        UPDATE deals 
        SET agent_user_id = NULL 
        WHERE agent_user_id NOT IN (SELECT user_id FROM users)
      `).catch(() => {});

      await sequelize.query(`
        UPDATE deals 
        SET seller_person_id = NULL 
        WHERE seller_person_id NOT IN (SELECT id FROM persons)
      `).catch(() => {});

      await sequelize.query(`
        UPDATE deals 
        SET buyer_person_id = NULL 
        WHERE buyer_person_id NOT IN (SELECT id FROM persons)
      `).catch(() => {});
      
    } catch (cleanupError) {
      // Ignore errors if tables don't exist yet
    } finally {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    // Ensure national_id is optional in database level
    try {
      await sequelize.query('ALTER TABLE persons MODIFY national_id VARCHAR(50) NULL');
      await sequelize.query('ALTER TABLE users MODIFY national_id VARCHAR(50) NULL');
    } catch (alterError) {
      // Tables might not exist or column might already be NULL
    }

    await sequelize.sync({ force: false });
    console.log('All models synchronized successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, initDB };
