const { sequelize } = require('../config/db');

async function migrate() {
  const transaction = await sequelize.transaction();
  try {
    console.log('Starting Property System migration...');

    // 1. Core columns
    console.log('Ensuring core columns exist...');
    
    // Add record_kind if it doesn't exist
    const [recordKindCols] = await sequelize.query("SHOW COLUMNS FROM properties LIKE 'record_kind'");
    if (recordKindCols.length === 0) {
      await sequelize.query("ALTER TABLE properties ADD COLUMN record_kind ENUM('container', 'listing') NOT NULL DEFAULT 'listing'");
    }

    // Update property_category ENUM
    await sequelize.query("ALTER TABLE properties MODIFY COLUMN property_category ENUM('tower', 'market', 'sharak', 'normal') NOT NULL");

    // Update property_type ENUM
    await sequelize.query("ALTER TABLE properties MODIFY COLUMN property_type ENUM('house', 'shop', 'office', 'plot', 'land', 'apartment') NOT NULL");

    // Add parent_id if it doesn't exist
    const [parentIdCols] = await sequelize.query("SHOW COLUMNS FROM properties LIKE 'parent_id'");
    if (parentIdCols.length === 0) {
      await sequelize.query("ALTER TABLE properties ADD COLUMN parent_id INT NULL");
      await sequelize.query("ALTER TABLE properties ADD CONSTRAINT fk_properties_parent FOREIGN KEY (parent_id) REFERENCES properties(property_id) ON DELETE SET NULL");
    }

    // Add details JSON if it doesn't exist
    const [detailsCols] = await sequelize.query("SHOW COLUMNS FROM properties LIKE 'details'");
    if (detailsCols.length === 0) {
      await sequelize.query("ALTER TABLE properties ADD COLUMN details JSON NULL");
    }

    // 2. Backfill / Rules
    console.log('Backfilling records based on rules...');
    
    // If parent_id IS NULL AND property_category IN ('tower','market','sharak') -> set record_kind='container'
    await sequelize.query(`
      UPDATE properties 
      SET record_kind = 'container' 
      WHERE parent_id IS NULL AND property_category IN ('tower', 'market', 'sharak')
    `);

    // Otherwise -> record_kind='listing'
    await sequelize.query(`
      UPDATE properties
      SET record_kind = 'listing'
      WHERE parent_id IS NOT NULL OR property_category = 'normal'
    `);

    // 3. Indexes
    console.log('Adding indexes...');
    
    const indexes = [
      { name: 'idx_parent_id', fields: 'parent_id' },
      { name: 'idx_category_parent', fields: 'property_category, parent_id' },
      { name: 'idx_record_kind', fields: 'record_kind' },
      { name: 'idx_record_kind_status', fields: 'record_kind, status' }
    ];

    for (const index of indexes) {
      try {
        await sequelize.query(`CREATE INDEX ${index.name} ON properties(${index.fields})`);
      } catch (e) {
        console.log(`Index ${index.name} might already exist, skipping...`);
      }
    }

    await transaction.commit();
    console.log('Property System migration completed successfully!');
    process.exit(0);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
