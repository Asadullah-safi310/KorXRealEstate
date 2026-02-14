const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NearbyCache = sequelize.define('NearbyCache', {
  cache_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  entity_type: {
    type: DataTypes.ENUM('PARENT_CONTAINER', 'PROPERTY'),
    allowNull: false,
    comment: 'Type of entity: PARENT_CONTAINER (Tower/Market/Sharak) or PROPERTY (standalone)',
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the parent container or standalone property',
  },
  radius_m: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000,
    comment: 'Search radius in meters',
  },
  types: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['mosque', 'school', 'market', 'square', 'hospital'],
    comment: 'Array of place types searched',
  },
  data_json: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Cached nearby places data organized by category',
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Cache expiration timestamp',
  },
}, {
  tableName: 'nearby_cache',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['entity_type', 'entity_id'],
      name: 'unique_entity_cache',
    },
    {
      fields: ['expires_at'],
      name: 'idx_expires_at',
    },
  ],
});

module.exports = NearbyCache;
