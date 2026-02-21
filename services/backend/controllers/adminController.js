const { User, Property, Deal, Person, Province, District, Area, UserPermission, AgentContainerLimit } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { ALL_PERMISSIONS } = require('../constants/permissions');

const ALLOWED_CONTAINER_TYPES = ['tower', 'market', 'sharak'];

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalAgents = await User.count({ where: { role: 'agent' } });
    const totalProperties = await Property.count({ where: { record_kind: 'listing' } });
    const totalActiveListings = await Property.count({ where: { status: 'available', record_kind: 'listing' } });
    const totalDeals = await Deal.count();
    
    const activeDeals = await Deal.count({ where: { status: 'active' } });
    const completedDeals = await Deal.count({ where: { status: 'completed' } });
    const canceledDeals = await Deal.count({ where: { status: 'canceled' } });

    const propertiesForSale = await Property.count({ where: { is_available_for_sale: true, record_kind: 'listing' } });
    const propertiesForRent = await Property.count({ where: { is_available_for_rent: true, record_kind: 'listing' } });

    // Recently added properties
    const recentProperties = await Property.findAll({
      where: { record_kind: 'listing' },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Person, as: 'Owner', attributes: ['full_name'] },
        { model: Province, as: 'ProvinceData', attributes: ['name'] }
      ]
    });

    // Recently created users
    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['user_id', 'full_name', 'email', 'role', 'createdAt']
    });

    const stats = {
      totalUsers,
      totalAgents,
      totalProperties,
      totalActiveListings,
      totalDeals,
      activeDeals,
      completedDeals,
      canceledDeals,
      propertiesForSale,
      propertiesForRent,
      recentProperties,
      recentUsers
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

// Get All Users (with filters & pagination)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, status, id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (id) where.user_id = id;
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { 
        exclude: ['password_hash'],
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM properties AS p
              WHERE p.agent_id = User.user_id AND p.record_kind = 'listing'
            )`),
            'property_count'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM deals AS d
              WHERE d.agent_user_id = User.user_id
            )`),
            'deal_count'
          ],
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(price), 0)
              FROM deals AS d
              WHERE d.agent_user_id = User.user_id AND d.status = 'completed'
            )`),
            'total_volume'
          ]
        ]
      },
      include: [
        {
          model: UserPermission,
          as: 'Permissions',
          attributes: ['permission_key']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const usersWithPermissions = rows.map(user => {
      const userData = user.toJSON();
      userData.permissions = userData.Permissions?.map(p => p.permission_key) || [];
      delete userData.Permissions;
      return userData;
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      users: usersWithPermissions
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Update User Role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'user', 'agent'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ role });
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Get All Properties (Admin View with filters & pagination)
exports.getAllProperties = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      province_id, 
      district_id, 
      area_id,
      property_type,
      property_category,
      owner_name,
      created_by_user_id,
      bedrooms,
      bathrooms,
      min_price,
      max_price,
      purpose, 
      status,
      is_promoted,
      agent_id
    } = req.query;
    
    const offset = (page - 1) * limit;

    const where = { record_kind: 'listing' };
    if (province_id) where.province_id = province_id;
    if (district_id) where.district_id = district_id;
    if (area_id) where.area_id = area_id;
    if (property_type) where.property_type = property_type;
    if (property_category) where.property_category = property_category;
    if (owner_name) where.owner_name = { [Op.like]: `%${owner_name}%` };
    if (created_by_user_id) where.created_by_user_id = created_by_user_id;
    if (bedrooms) where.bedrooms = parseInt(bedrooms, 10);
    if (bathrooms) where.bathrooms = parseInt(bathrooms, 10);
    if (status) where.status = status;
    if (is_promoted !== undefined) {
      // is_promoted doesn't exist in model yet, so we skip it or use a default
      // where.is_promoted = is_promoted === 'true';
    }
    if (agent_id) {
      if (agent_id === 'none') where.agent_id = null;
      else where.agent_id = agent_id;
    }

    if (purpose) {
      const normalizedPurpose = String(purpose).toUpperCase();
      if (normalizedPurpose === 'SALE') where.is_available_for_sale = true;
      if (normalizedPurpose === 'RENT') where.is_available_for_rent = true;
    }

    const hasMinPrice = min_price !== undefined && min_price !== '';
    const hasMaxPrice = max_price !== undefined && max_price !== '';
    if (hasMinPrice || hasMaxPrice) {
      const min = hasMinPrice ? Number(min_price) : 0;
      const max = hasMaxPrice ? Number(max_price) : Number.MAX_SAFE_INTEGER;
      const normalizedPurpose = String(purpose || '').toUpperCase();

      if (normalizedPurpose === 'RENT') {
        where.rent_price = { [Op.between]: [min, max] };
      } else if (normalizedPurpose === 'SALE') {
        where.sale_price = { [Op.between]: [min, max] };
      } else {
        where[Op.or] = [
          { sale_price: { [Op.between]: [min, max] } },
          { rent_price: { [Op.between]: [min, max] } }
        ];
      }
    }

    if (search) {
      const searchConditions = [
        { title: { [Op.like]: `%${search}%` } },
        { property_code: { [Op.like]: `%${search}%` } },
        { property_type: { [Op.like]: `%${search}%` } },
        { property_category: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
        { owner_name: { [Op.like]: `%${search}%` } }
      ];
      if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, { [Op.or]: searchConditions }];
        delete where[Op.or];
      } else {
        where[Op.or] = searchConditions;
      }
    }

    const { count, rows } = await Property.findAndCountAll({
      where,
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name'] },
        { model: Province, as: 'ProvinceData' },
        { model: District, as: 'DistrictData' },
        { model: Area, as: 'AreaData' },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      properties: rows
    });
  } catch (error) {
    console.error('Error in getAllProperties:', error);
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
};

// Get All Deals (Admin View with filters & pagination)
exports.getAllDeals = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      agent_id, 
      property_id,
      startDate,
      endDate
    } = req.query;
    
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (agent_id) where.agent_user_id = agent_id;
    if (property_id) where.property_id = property_id;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await Deal.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'Property', include: [{ model: Person, as: 'Owner', attributes: ['full_name'] }] },
        { model: Person, as: 'Seller', attributes: ['id', 'full_name'] },
        { model: Person, as: 'Buyer', attributes: ['id', 'full_name'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      deals: rows
    });
  } catch (error) {
    console.error('Error in getAllDeals:', error);
    res.status(500).json({ message: 'Error fetching deals', error: error.message });
  }
};

exports.getUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      include: [
        {
          model: UserPermission,
          as: 'Permissions',
          attributes: ['permission_key']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = user.Permissions?.map(p => p.permission_key) || [];
    
    res.json({ 
      user_id: user.user_id,
      role: user.role,
      permissions,
      availablePermissions: ALL_PERMISSIONS
    });
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    res.status(500).json({ message: 'Error fetching permissions', error: error.message });
  }
};

exports.updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions must be an array' });
    }

    const invalidPermissions = permissions.filter(p => !ALL_PERMISSIONS.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid permissions detected',
        invalid: invalidPermissions 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify permissions for admin users' });
    }

    await UserPermission.destroy({ where: { user_id: id } });

    if (permissions.length > 0) {
      const permissionRecords = permissions.map(permission => ({
        user_id: id,
        permission_key: permission
      }));
      await UserPermission.bulkCreate(permissionRecords);
    }

    const updatedPermissions = await UserPermission.findAll({
      where: { user_id: id },
      attributes: ['permission_key']
    });

    res.json({ 
      message: 'Permissions updated successfully',
      permissions: updatedPermissions.map(p => p.permission_key)
    });
  } catch (error) {
    console.error('Error in updateUserPermissions:', error);
    res.status(500).json({ message: 'Error updating permissions', error: error.message });
  }
};

exports.getAvailablePermissions = async (req, res) => {
  try {
    const { ALL_PERMISSIONS, PERMISSION_DISPLAY_NAMES } = require('../constants/permissions');

    const permissionsList = [...new Set(ALL_PERMISSIONS)]
      .filter((permission) => typeof permission === 'string')
      .map((permission) => ({
        key: permission,
        label: PERMISSION_DISPLAY_NAMES[permission] || permission,
        description: PERMISSION_DISPLAY_NAMES[permission] || permission,
      }));

    res.json({ permissions: permissionsList });
  } catch (error) {
    console.error('Error in getAvailablePermissions:', error);
    res.status(500).json({ message: 'Error fetching available permissions', error: error.message });
  }
};

exports.getUserContainerLimits = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['user_id', 'role'],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const limits = await AgentContainerLimit.findAll({
      where: { user_id: id },
      attributes: ['container_type', 'max_count'],
    });

    const result = {
      tower: null,
      market: null,
      sharak: null,
    };

    for (const limit of limits) {
      result[limit.container_type] = limit.max_count;
    }

    res.json({
      user_id: user.user_id,
      role: user.role,
      limits: result,
    });
  } catch (error) {
    console.error('Error in getUserContainerLimits:', error);
    res.status(500).json({ message: 'Error fetching container limits', error: error.message });
  }
};

exports.updateUserContainerLimits = async (req, res) => {
  try {
    const { id } = req.params;
    const { limits } = req.body;

    if (!limits || typeof limits !== 'object') {
      return res.status(400).json({ message: 'limits object is required' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot set container limits for admin users' });
    }

    const updates = [];
    for (const containerType of ALLOWED_CONTAINER_TYPES) {
      if (!(containerType in limits)) continue;

      const rawValue = limits[containerType];
      const normalizedValue =
        rawValue === '' || rawValue === undefined || rawValue === null || rawValue === 'null'
          ? null
          : Number(rawValue);

      if (normalizedValue !== null) {
        if (!Number.isInteger(normalizedValue) || normalizedValue < 1) {
          return res.status(400).json({
            message: `${containerType} limit must be a positive integer or null (unlimited)`,
          });
        }
      }

      updates.push({ containerType, value: normalizedValue });
    }

    await sequelize.transaction(async (transaction) => {
      for (const { containerType, value } of updates) {
        if (value === null) {
          await AgentContainerLimit.destroy({
            where: {
              user_id: id,
              container_type: containerType,
            },
            transaction,
          });
          continue;
        }

        await AgentContainerLimit.upsert(
          {
            user_id: id,
            container_type: containerType,
            max_count: value,
          },
          { transaction }
        );
      }
    });

    const freshLimits = await AgentContainerLimit.findAll({
      where: { user_id: id },
      attributes: ['container_type', 'max_count'],
    });

    const result = {
      tower: null,
      market: null,
      sharak: null,
    };
    for (const limit of freshLimits) {
      result[limit.container_type] = limit.max_count;
    }

    res.json({
      message: 'Container limits updated successfully',
      limits: result,
    });
  } catch (error) {
    console.error('Error in updateUserContainerLimits:', error);
    res.status(500).json({ message: 'Error updating container limits', error: error.message });
  }
};
