const { sequelize } = require('./config/db');

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Check if column exists
    const [results] = await sequelize.query("SHOW COLUMNS FROM properties LIKE 'record_kind'");
    
    if (results.length === 0) {
      console.log('Adding record_kind column...');
      await sequelize.query("ALTER TABLE properties ADD COLUMN record_kind ENUM('listing', 'container') NOT NULL DEFAULT 'listing'");
    } else {
      console.log('record_kind column already exists.');
    }

    console.log('Backfilling existing records...');
    
    // For any row where: parent_id IS NULL AND property_category IN ('apartment','market','sharak') -> set record_kind = 'container'
    await sequelize.query(`
      UPDATE properties 
      SET record_kind = 'container' 
      WHERE parent_id IS NULL AND property_category IN ('apartment', 'market', 'sharak')
    `);

    // For any row where: parent_id IS NOT NULL OR property_category='normal' -> set record_kind = 'listing'
    await sequelize.query(`
      UPDATE properties
      SET record_kind = 'listing'
      WHERE parent_id IS NOT NULL OR property_category = 'normal'
    `);

    console.log('Adding indexes...');
    try {
      await sequelize.query("CREATE INDEX idx_record_kind ON properties(record_kind)");
    } catch (e) {
      console.log('Index idx_record_kind might already exist');
    }
    
    try {
      await sequelize.query("CREATE INDEX idx_record_kind_status ON properties(record_kind, status)");
    } catch (e) {
      console.log('Index idx_record_kind_status might already exist');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
