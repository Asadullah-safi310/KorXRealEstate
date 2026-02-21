require('dotenv').config();
const { sequelize } = require('../config/db');

const TABLE_NAME = 'properties';
const LEGACY_COLUMN = 'parent_property_id';
const PRIMARY_COLUMN = 'parent_id';

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
  if (!cols.has(LEGACY_COLUMN)) {
    console.log(`${LEGACY_COLUMN} does not exist. Nothing to drop.`);
    return;
  }

  if (cols.has(PRIMARY_COLUMN)) {
    await sequelize.query(
      `
        UPDATE ${TABLE_NAME}
        SET ${PRIMARY_COLUMN} = ${LEGACY_COLUMN}
        WHERE ${PRIMARY_COLUMN} IS NULL
          AND ${LEGACY_COLUMN} IS NOT NULL
      `
    );
    console.log(`Backfilled ${PRIMARY_COLUMN} from ${LEGACY_COLUMN} where needed.`);
  }

  await sequelize.query(`ALTER TABLE ${TABLE_NAME} DROP COLUMN ${LEGACY_COLUMN}`);
  console.log(`Dropped column: ${LEGACY_COLUMN}`);
};

const migrateDown = async () => {
  const cols = await getExistingColumns();
  if (!cols.has(LEGACY_COLUMN)) {
    await sequelize.query(`ALTER TABLE ${TABLE_NAME} ADD COLUMN ${LEGACY_COLUMN} INT NULL AFTER ${PRIMARY_COLUMN}`);
    console.log(`Restored column: ${LEGACY_COLUMN}`);
  }

  const latestCols = await getExistingColumns();
  if (latestCols.has(PRIMARY_COLUMN) && latestCols.has(LEGACY_COLUMN)) {
    await sequelize.query(
      `
        UPDATE ${TABLE_NAME}
        SET ${LEGACY_COLUMN} = ${PRIMARY_COLUMN}
        WHERE ${LEGACY_COLUMN} IS NULL
          AND ${PRIMARY_COLUMN} IS NOT NULL
      `
    );
    console.log(`Backfilled ${LEGACY_COLUMN} from ${PRIMARY_COLUMN} where needed.`);
  }
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

