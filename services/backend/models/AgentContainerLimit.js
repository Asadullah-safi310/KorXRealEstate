const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AgentContainerLimit = sequelize.define('AgentContainerLimit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  container_type: {
    type: DataTypes.ENUM('tower', 'market', 'sharak'),
    allowNull: false,
  },
  max_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'NULL means unlimited',
    validate: {
      min: 1,
    },
  },
}, {
  tableName: 'agent_container_limits',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'container_type'],
      name: 'uniq_user_container_limit',
    },
    {
      fields: ['container_type'],
      name: 'idx_acl_container_type',
    },
  ],
});

module.exports = AgentContainerLimit;
