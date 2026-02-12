const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Property = sequelize.define('Property', {
  property_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  owner_person_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Real person who owns the property',
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Agent managing this property (User)',
  },
  created_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'System User who created/added the property',
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'inactive'),
    defaultValue: 'draft',
    allowNull: false,
  },
  property_category: {
    type: DataTypes.ENUM('tower', 'market', 'sharak', 'apartment', 'normal'),
    allowNull: false,
  },
  record_kind: {
    type: DataTypes.ENUM('container', 'listing'),
    defaultValue: 'listing',
    allowNull: false,
  },
  property_type: {
    type: DataTypes.ENUM('house', 'shop', 'office', 'plot', 'land', 'apartment', 'tower', 'market', 'sharak'),
    allowNull: false,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'properties',
      key: 'property_id',
    },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object for category/type-specific fields: {planned_units, floor, apartment_no, shop_number}',
  },
  purpose: {
    type: DataTypes.ENUM('sale', 'rent'),
    allowNull: true,
  },
  sale_price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  rent_price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  province_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'provinces',
      key: 'id',
    },
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'districts',
      key: 'id',
    },
  },
  area_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'areas',
      key: 'id',
    },
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Full formatted address from Google Maps',
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  area_size: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  facilities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object containing amenities like lift, parking, etc.',
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  videos: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  // Keep these for backward compatibility if they are used in code, 
  // but they are mostly redundant now with the new system.
  is_available_for_sale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_available_for_rent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_unavailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_photo_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_attachment_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_video_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_parent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  parent_property_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  unit_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  floor: {
    type: DataTypes.STRING(50),
    allowNull: true,
  }
}, {
  tableName: 'properties',
  timestamps: true,
  indexes: [
    {
      fields: ['parent_id'],
    },
    {
      fields: ['property_category', 'parent_id'],
    },
    {
      fields: ['record_kind'],
    },
    {
      fields: ['record_kind', 'status'],
    }
  ]
});

module.exports = Property;
