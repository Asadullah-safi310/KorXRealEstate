const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../config/db');

async function migrate() {
  const transaction = await sequelize.transaction();
  try {
    console.log('Starting migration v2...');

    // Disable foreign key checks temporarily
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { transaction });

    // 1. Rename 'apartment' category to 'tower' if it exists in the ENUM
    // Since MySQL doesn't easily allow renaming ENUM values without re-defining the column,
    // we will first change the column type to VARCHAR, update data, then back to ENUM.

    console.log('Updating property_category and status columns...');

    // Temporarily change to VARCHAR to allow any value during transition
    await sequelize.query("ALTER TABLE properties MODIFY COLUMN property_category VARCHAR(50)", { transaction });
    await sequelize.query("ALTER TABLE properties MODIFY COLUMN status VARCHAR(50)", { transaction });
    await sequelize.query("ALTER TABLE properties MODIFY COLUMN property_type VARCHAR(50)", { transaction });

    // 2. Data Mapping
    console.log('Mapping existing data...');
    
    // category: apartment -> tower
    await sequelize.query("UPDATE properties SET property_category = 'tower' WHERE property_category = 'apartment'", { transaction });
    // category: standalone -> normal
    await sequelize.query("UPDATE properties SET property_category = 'normal' WHERE property_category = 'standalone'", { transaction });
    
    // status: available/under_deal -> active
    await sequelize.query("UPDATE properties SET status = 'active' WHERE status IN ('available', 'under_deal')", { transaction });
    // status: unavailable -> inactive
    await sequelize.query("UPDATE properties SET status = 'inactive' WHERE status = 'unavailable'", { transaction });
    // Default remaining to draft
    await sequelize.query("UPDATE properties SET status = 'draft' WHERE status NOT IN ('active', 'inactive')", { transaction });

    // property_type mapping (normalize to lowercase)
    await sequelize.query("UPDATE properties SET property_type = LOWER(property_type)", { transaction });
    await sequelize.query("UPDATE properties SET property_type = 'house' WHERE property_type IN ('home', 'house')", { transaction });
    await sequelize.query("UPDATE properties SET property_type = 'apartment' WHERE property_type IN ('flat', 'apartment')", { transaction });
    await sequelize.query("UPDATE properties SET property_type = 'shop' WHERE property_type IN ('shop')", { transaction });
    await sequelize.query("UPDATE properties SET property_type = 'office' WHERE property_type IN ('office')", { transaction });
    await sequelize.query("UPDATE properties SET property_type = 'plot' WHERE property_type IN ('plot')", { transaction });
    await sequelize.query("UPDATE properties SET property_type = 'land' WHERE property_type IN ('land')", { transaction });
    
    // Set default for any other value to 'house' to avoid truncation
    await sequelize.query("UPDATE properties SET property_type = 'house' WHERE property_type NOT IN ('house', 'shop', 'office', 'plot', 'land', 'apartment')", { transaction });

    // 3. Set record_kind based on rules
    console.log('Setting record_kind...');
    // If parent_id IS NULL AND property_category IN ('tower','market','sharak') -> set record_kind='container'
    await sequelize.query(`
      UPDATE properties 
      SET record_kind = 'container' 
      WHERE parent_id IS NULL AND property_category IN ('tower', 'market', 'sharak')
    `, { transaction });

    // Otherwise -> record_kind='listing'
    await sequelize.query(`
      UPDATE properties 
      SET record_kind = 'listing' 
      WHERE record_kind IS NULL OR (parent_id IS NOT NULL OR property_category = 'normal')
    `, { transaction });

    // 4. Apply new ENUM constraints
    console.log('Applying ENUM constraints...');
    await sequelize.query(`
      ALTER TABLE properties 
      MODIFY COLUMN property_category ENUM('tower', 'market', 'sharak', 'normal') NOT NULL
    `, { transaction });

    await sequelize.query(`
      ALTER TABLE properties 
      MODIFY COLUMN property_type ENUM('house', 'shop', 'office', 'plot', 'land', 'apartment') NOT NULL
    `, { transaction });

    await sequelize.query(`
      ALTER TABLE properties 
      MODIFY COLUMN status ENUM('draft', 'active', 'inactive') NOT NULL DEFAULT 'draft'
    `, { transaction });

    await sequelize.query(`
      ALTER TABLE properties 
      MODIFY COLUMN record_kind ENUM('container', 'listing') NOT NULL DEFAULT 'listing'
    `, { transaction });

    // 5. Ensure parent_id is indexed
    console.log('Ensuring indexes exist...');
    const [indexes] = await sequelize.query("SHOW INDEX FROM properties", { transaction });
    const indexNames = indexes.map(i => i.Key_name);

    if (!indexNames.includes('parent_id')) {
      await sequelize.query("CREATE INDEX idx_parent_id ON properties(parent_id)", { transaction });
    }
    if (!indexNames.includes('idx_category_parent')) {
      await sequelize.query("CREATE INDEX idx_category_parent ON properties(property_category, parent_id)", { transaction });
    }
    if (!indexNames.includes('idx_record_kind')) {
      await sequelize.query("CREATE INDEX idx_record_kind ON properties(record_kind)", { transaction });
    }
    if (!indexNames.includes('idx_record_kind_status')) {
      await sequelize.query("CREATE INDEX idx_record_kind_status ON properties(record_kind, status)", { transaction });
    }

    // Re-enable foreign key checks
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { transaction });

    await transaction.commit();
    console.log('Migration v2 completed successfully!');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Migration v2 failed:', error);
    process.exit(1);
  }
}

migrate();
