const User = require('./User');
const Person = require('./Person');
const Property = require('./Property');
const Deal = require('./Deal');
const PropertyHistory = require('./PropertyHistory');
const Province = require('./Province');
const District = require('./District');
const Area = require('./Area');
const OTP = require('./OTP');
const UserPermission = require('./UserPermission');
const NearbyCache = require('./NearbyCache');
const AgentContainerLimit = require('./AgentContainerLimit');

// --- User & Person Associations ---
User.hasOne(Person, { foreignKey: 'user_id', as: 'PersonProfile' });
Person.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

User.hasMany(OTP, { foreignKey: 'user_id', as: 'OTPs' });
OTP.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

User.hasMany(UserPermission, { foreignKey: 'user_id', as: 'Permissions' });
UserPermission.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

User.hasMany(AgentContainerLimit, { foreignKey: 'user_id', as: 'ContainerLimits' });
AgentContainerLimit.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// --- Property Associations ---
Property.belongsTo(Person, { foreignKey: 'owner_person_id', as: 'Owner' });
Person.hasMany(Property, { foreignKey: 'owner_person_id', as: 'OwnedProperties' });

Property.belongsTo(User, { foreignKey: 'agent_id', as: 'Agent' });
User.hasMany(Property, { foreignKey: 'agent_id', as: 'ManagedProperties' });

Property.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'Creator' });
User.hasMany(Property, { foreignKey: 'created_by_user_id', as: 'CreatedProperties' });

Property.hasMany(Deal, { foreignKey: 'property_id', onDelete: 'CASCADE' });
Deal.belongsTo(Property, { foreignKey: 'property_id', as: 'Property' });

Property.hasMany(PropertyHistory, { foreignKey: 'property_id', onDelete: 'CASCADE' });
PropertyHistory.belongsTo(Property, { foreignKey: 'property_id', as: 'Property' });

Property.hasMany(Property, { foreignKey: 'parent_id', as: 'Children' });
Property.belongsTo(Property, { foreignKey: 'parent_id', as: 'Parent' });

// --- Deal Associations ---
Deal.belongsTo(User, { foreignKey: 'agent_user_id', as: 'Agent' });
User.hasMany(Deal, { foreignKey: 'agent_user_id', as: 'AgentDeals' });

Deal.belongsTo(Person, { foreignKey: 'seller_person_id', as: 'Seller' });
Person.hasMany(Deal, { foreignKey: 'seller_person_id', as: 'Sales' });

Deal.belongsTo(Person, { foreignKey: 'buyer_person_id', as: 'Buyer' });
Person.hasMany(Deal, { foreignKey: 'buyer_person_id', as: 'Purchases' });

// --- Location Associations ---
Province.hasMany(District, { foreignKey: 'province_id', as: 'Districts', onDelete: 'CASCADE' });
District.belongsTo(Province, { foreignKey: 'province_id', as: 'Province' });

District.hasMany(Area, { foreignKey: 'district_id', as: 'Areas', onDelete: 'CASCADE' });
Area.belongsTo(District, { foreignKey: 'district_id', as: 'District' });

// Property Location Associations
Property.belongsTo(Province, { foreignKey: 'province_id', as: 'ProvinceData' });
Property.belongsTo(District, { foreignKey: 'district_id', as: 'DistrictData' });
Property.belongsTo(Area, { foreignKey: 'area_id', as: 'AreaData' });

// Property History Associations
PropertyHistory.belongsTo(User, { foreignKey: 'previous_owner_id', as: 'PreviousOwner' });
PropertyHistory.belongsTo(User, { foreignKey: 'new_owner_id', as: 'NewOwner' });

module.exports = {
  User,
  Person,
  Property,
  Deal,
  PropertyHistory,
  Province,
  District,
  Area,
  OTP,
  UserPermission,
  NearbyCache,
  AgentContainerLimit,
};
