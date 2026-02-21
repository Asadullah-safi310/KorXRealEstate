require('dotenv').config();
const { sequelize } = require('../config/db');

const TABLE_NAME = 'properties';
const TARGET_COLUMNS = ['location', 'city'];

const getExistingColumns = async () => {
  const dbName = process.env.DB_NAME || 'real_estate_pms';
  const [rows] = await sequelize.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = :dbName
        AND TABLE_NAME = :tableName
    `,
    {
      replacements: { dbName, tableName: TABLE_NAME },
    }
  );
  return new Set(rows.map((r) => r.COLUMN_NAME));
};

const migrateUp = async () => {
  const cols = await getExistingColumns();
  const toDrop = TARGET_COLUMNS.filter((c) => cols.has(c));

  if (toDrop.length === 0) {
    console.log('No columns to drop. Schema is already migrated.');
    return;
  }

  const dropSql = `ALTER TABLE ${TABLE_NAME} ${toDrop.map((c) => `DROP COLUMN ${c}`).join(', ')}`;
  await sequelize.query(dropSql);
  console.log(`Dropped columns: ${toDrop.join(', ')}`);
};

const migrateDown = async () => {
  const cols = await getExistingColumns();
  const addParts = [];

  if (!cols.has('location')) {
    addParts.push('ADD COLUMN location VARCHAR(255) NULL AFTER area_id');
  }
  if (!cols.has('city')) {
    addParts.push('ADD COLUMN city VARCHAR(100) NULL AFTER location');
  }

  if (addParts.length === 0) {
    console.log('Nothing to restore. Columns already exist.');
    return;
  }

  const addSql = `ALTER TABLE ${TABLE_NAME} ${addParts.join(', ')}`;
  await sequelize.query(addSql);
  console.log(`Restored columns: ${addParts.map((p) => p.split(' ')[2]).join(', ')}`);
};

const main = async () => {
  const mode = process.argv.includes('--down') ? 'down' : 'up';

  try {
    await sequelize.authenticate();
    console.log(`Connected. Running migration mode: ${mode}`);
    if (mode === 'down') await migrateDown();
    else await migrateUp();
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

main();

