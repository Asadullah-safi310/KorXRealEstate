const { validationResult } = require('express-validator');
const { Property, Deal, User, Person, Province, District, Area } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const path = require('path');
const PERMISSIONS = require('../constants/permissions');

// Helper to check permissions
const hasPermission = (user, permission) => {
  if (user.role === 'admin') return true;
  if (user.role === 'agent') {
    return true; // Simplified for now
  }
  return false;
};

// Helper to sanitize integer fields (convert empty strings to null)
const sanitizeInt = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value === '' || value === 'null' || value === 'undefined') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

// Helper to generate unique property code
const generatePropertyCode = async (ownerName, agentName) => {
  // Extract initials (uppercase, default to 'X' if missing)
  const ownerInitial = (ownerName && ownerName.trim()) 
    ? ownerName.trim()[0].toUpperCase() 
    : 'X';
  const agentInitial = (agentName && agentName.trim()) 
    ? agentName.trim()[0].toUpperCase() 
    : 'X';
  
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    // Find the latest property code to determine next sequence number
    const latestProperty = await Property.findOne({
      where: { 
        property_code: { [Op.ne]: null },
        property_code: { [Op.like]: '%-KorX-%' }
      },
      order: [['property_id', 'DESC']],
      attributes: ['property_code']
    });

    let nextNumber = 1;
    if (latestProperty && latestProperty.property_code) {
      // Extract the 6-digit sequence from format: XX-KorX-NNNNNN
      const match = latestProperty.property_code.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    // Format: {OwnerInitial}{AgentInitial}-KorX-{6-digit sequence}
    const code = `${ownerInitial}${agentInitial}-KorX-${String(nextNumber).padStart(6, '0')}`;
    
    // Check for duplicates
    const exists = await Property.findOne({ where: { property_code: code } });
    if (!exists) {
      return code;
    }
  }
  
  // Fallback if unable to generate unique code after max attempts
  return `${ownerInitial}${agentInitial}-KorX-${Date.now()}`;
};

const createProperty = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { 
      owner_person_id,
      owner_name,
      agent_id, 
      property_type, 
      purpose, 
      sale_price, 
      rent_price, 
      address, 
      province_id, 
      district_id, 
      area_id, 
      city, 
      area_size, 
      bedrooms, 
      bathrooms, 
      description, 
      latitude, 
      longitude,
      is_available_for_sale,
      is_available_for_rent,
      facilities,
      details,
      title,
      unit_number,
      floor,
      photos
    } = req.body;

    // Sanitize integer fields
    const sanitizedOwnerId = sanitizeInt(owner_person_id);
    const sanitizedAgentId = sanitizeInt(agent_id);
    const sanitizedProvinceId = sanitizeInt(province_id);
    const sanitizedDistrictId = sanitizeInt(district_id);
    const sanitizedAreaId = sanitizeInt(area_id);
    const sanitizedBedrooms = sanitizeInt(bedrooms);
    const sanitizedBathrooms = sanitizeInt(bathrooms);

    // Parse facilities to ensure it's a proper JSON array/object
    let parsedFacilities = facilities;
    if (facilities !== undefined && facilities !== null) {
      if (typeof facilities === 'string') {
        try {
          parsedFacilities = JSON.parse(facilities);
        } catch (e) {
          parsedFacilities = null; // Set to null if parse fails
        }
      }
    }

    // Check if owner exists (if provided)
    if (sanitizedOwnerId) {
      const owner = await Person.findByPk(sanitizedOwnerId, { transaction });
      if (!owner) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Owner (Person) not found' });
      }
    }

    // Permission check
    if (!hasPermission(req.user, PERMISSIONS.NORMAL.CREATE)) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Not authorized to create normal properties' });
    }

    // Validate required fields for standalone property
    if (!sanitizedProvinceId || !sanitizedDistrictId || !address) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Province, District, and Address are required for standalone properties' });
    }

    // Generate unique property code with owner and agent initials
    const agentName = req.user ? req.user.full_name : null;
    const propertyCode = await generatePropertyCode(owner_name, agentName);

    // Standalone properties: category='normal', record_kind='listing', is_parent=0, parent_property_id=NULL
    // Enforce standalone property rules per requirements
    const property = await Property.create({
      owner_person_id: sanitizedOwnerId,
      owner_name: owner_name || null,
      property_code: propertyCode,
      agent_id: sanitizedAgentId,
      created_by_user_id: req.user ? req.user.user_id : null,
      property_category: 'normal', // Standalone properties are ALWAYS 'normal' (enforced)
      record_kind: 'listing', // Standalone properties are listings, not containers (enforced)
      is_parent: false, // Standalone properties are NOT parent containers (is_parent=0, enforced)
      parent_property_id: null, // Standalone properties have NO parent (enforced)
      parent_id: null, // Standalone properties have NO parent (enforced)
      property_type,
      purpose,
      sale_price: sale_price || null,
      rent_price: rent_price || null,
      address,
      province_id: sanitizedProvinceId,
      district_id: sanitizedDistrictId,
      area_id: sanitizedAreaId,
      city,
      area_size,
      bedrooms: sanitizedBedrooms,
      bathrooms: sanitizedBathrooms,
      description,
      latitude: latitude || null,
      longitude: longitude || null,
      status: 'active',
      title,
      unit_number,
      floor,
      is_available_for_sale: !!is_available_for_sale,
      is_available_for_rent: !!is_available_for_rent,
      facilities: parsedFacilities || null,
      details: details || {},
      photos: photos || [],
    }, { transaction });

    await transaction.commit();
    res.status(201).json({ message: 'Property created successfully', property_id: property.property_id });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error creating property:', error);
    res.status(500).json({ error: error.message });
  }
};

const getProperties = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const where = {
      record_kind: 'listing' // Only show listings in property lists
    };
    
    // If not admin, filter by assigned agent or creator
    if (req.user && req.user.role !== 'admin') {
      where[Op.or] = [
        { agent_id: req.user.user_id },
        { created_by_user_id: req.user.user_id }
      ];
    }

    const properties = await Property.findAll({
      where,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture', 'role'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'profile_picture', 'role'] },
        { model: Province, as: 'ProvinceData', attributes: ['id', 'name'] },
        { model: District, as: 'DistrictData', attributes: ['id', 'name'] },
        { model: Area, as: 'AreaData', attributes: ['id', 'name'] },
        { model: Property, as: 'Parent', attributes: ['property_id', 'title', 'property_type', 'address'] },
      ],
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        id: propJson.property_id,
        current_owner: propJson.Owner,
        forSale: !!propJson.is_available_for_sale,
        forRent: !!propJson.is_available_for_rent
      };
    });

    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id, {
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone', 'email', 'address'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'email', 'profile_picture', 'role'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'email', 'profile_picture', 'role'] },
        { model: Province, as: 'ProvinceData', attributes: ['id', 'name'] },
        { model: District, as: 'DistrictData', attributes: ['id', 'name'] },
        { model: Area, as: 'AreaData', attributes: ['id', 'name'] },
        { model: Property, as: 'Parent', attributes: ['property_id', 'title', 'property_type', 'address'] },
        { 
          model: Property, 
          as: 'Children', 
          attributes: ['property_id', 'status', 'purpose'],
          required: false
        },
      ],
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check visibility/permissions
    if (req.user && req.user.role !== 'admin') {
      const isPublic = property.status === 'active';
      if (property.agent_id !== req.user.user_id && property.created_by_user_id !== req.user.user_id && !isPublic) {
        return res.status(403).json({ error: 'Not authorized to view this property' });
      }
    }

    const propJson = property.toJSON();
    
    // Calculate children counts for containers
    if (propJson.Children && propJson.Children.length > 0) {
      propJson.total_children = propJson.Children.length;
      propJson.available_children = propJson.Children.filter(c => c.status === 'active').length;
    }
    
    const enrichedProperty = {
      ...propJson,
      id: propJson.property_id,
      current_owner: propJson.Owner,
      forSale: !!propJson.is_available_for_sale,
      forRent: !!propJson.is_available_for_rent
    };

    res.json(enrichedProperty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchProperties = async (req, res) => {
  try {
    const { 
      city, 
      property_type, 
      purpose, 
      is_available_for_sale,
      is_available_for_rent,
      min_sale_price, 
      max_sale_price, 
      min_rent_price, 
      max_rent_price, 
      bedrooms, 
      status, 
      province_id,
      district_id,
      area_id,
      parent_id,
      record_kind,
      property_category,
      agent_id,
      search,
      limit, 
      offset 
    } = req.query;

    const andCriteria = [];
    if (record_kind) {
      andCriteria.push({ record_kind });
    } else {
      // Default to listings if no specific kind requested
      andCriteria.push({ record_kind: 'listing' });
    }

    if (property_category) andCriteria.push({ property_category });

    if (search) {
      andCriteria.push({
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } },
          { city: { [Op.like]: `%${search}%` } },
          { owner_name: { [Op.like]: `%${search}%` } },
          { property_code: { [Op.like]: `%${search}%` } },
          { '$Agent.full_name$': { [Op.like]: `%${search}%` } },
          { '$Creator.full_name$': { [Op.like]: `%${search}%` } },
          { '$ProvinceData.name$': { [Op.like]: `%${search}%` } },
          { '$DistrictData.name$': { [Op.like]: `%${search}%` } },
          { '$AreaData.name$': { [Op.like]: `%${search}%` } },
          { '$Parent.title$': { [Op.like]: `%${search}%` } },
          { '$Parent.address$': { [Op.like]: `%${search}%` } },
        ]
      });
    }

    // Determine if this is a user querying their own properties
    const isUserPropertyQuery = req.user && (
      req.query.created_by_user_id || 
      req.query.agent_id
    );

    // Public marketplace filters - only apply when not querying own properties
    if (!isUserPropertyQuery) {
      // Public marketplace rule:
      // - Always active listings
      // - Must be available for sale OR rent (BUT NOT for containers)
      andCriteria.push({ status: 'active' });
      
      // Only apply availability filter for listings, not for containers
      if (record_kind !== 'container') {
        andCriteria.push({
          [Op.or]: [
            { is_available_for_sale: true },
            { is_available_for_rent: true }
          ]
        });
      }
    }

    if (city) andCriteria.push({ city: { [Op.like]: `%${city}%` } });
    if (property_type) andCriteria.push({ property_type });
    if (parent_id) andCriteria.push({ parent_id });
    if (purpose) andCriteria.push({ purpose });
    if (is_available_for_sale === 'true' || is_available_for_sale === true) {
      andCriteria.push({ is_available_for_sale: true });
    }
    if (is_available_for_rent === 'true' || is_available_for_rent === true) {
      andCriteria.push({ is_available_for_rent: true });
    }
    if (agent_id) andCriteria.push({ agent_id });
    if (province_id) andCriteria.push({ province_id });
    if (district_id) andCriteria.push({ district_id });
    if (area_id) andCriteria.push({ area_id });
    
    if (bedrooms) {
      if (bedrooms === '5') {
        andCriteria.push({ bedrooms: { [Op.gte]: 5 } });
      } else {
        andCriteria.push({ bedrooms });
      }
    }
    // Ignore status from query for this public endpoint.
    
    if (min_sale_price || max_sale_price) {
      const salePriceFilter = {};
      if (min_sale_price) salePriceFilter[Op.gte] = min_sale_price;
      if (max_sale_price) salePriceFilter[Op.lte] = max_sale_price;
      andCriteria.push({ sale_price: salePriceFilter });
    }

    if (min_rent_price || max_rent_price) {
      const rentPriceFilter = {};
      if (min_rent_price) rentPriceFilter[Op.gte] = min_rent_price;
      if (max_rent_price) rentPriceFilter[Op.lte] = max_rent_price;
      andCriteria.push({ rent_price: rentPriceFilter });
    }

    const properties = await Property.findAll({ 
      where: andCriteria.length > 0 ? { [Op.and]: andCriteria } : {},
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture', 'role'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'profile_picture', 'role'] },
        { model: Province, as: 'ProvinceData', attributes: ['id', 'name'] },
        { model: District, as: 'DistrictData', attributes: ['id', 'name'] },
        { model: Area, as: 'AreaData', attributes: ['id', 'name'] },
        { model: Property, as: 'Parent', attributes: ['property_id', 'title', 'property_type', 'address'] },
      ]
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        id: propJson.property_id,
        current_owner: propJson.Owner,
        forSale: !!propJson.is_available_for_sale,
        forRent: !!propJson.is_available_for_rent
      };
    });

    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('========== UPDATE PROPERTY ==========');
    console.log('Property ID:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user?.user_id, req.user?.role);
    
    const { 
      owner_person_id,
      owner_name,
      agent_id, 
      property_type, 
      purpose, 
      sale_price, 
      rent_price, 
      address, 
      province_id, 
      district_id, 
      area_id, 
      city, 
      area_size, 
      bedrooms, 
      bathrooms, 
      description, 
      latitude, 
      longitude, 
      title, 
      unit_number,
      floor,
      facilities, 
      details,
      is_available_for_sale,
      is_available_for_rent,
      status
    } = req.body;

    const property = await Property.findByPk(id);
    console.log('Property found:', property ? 'Yes' : 'No');
    if (!property || property.record_kind !== 'listing') {
      console.log('ERROR: Property not found or not a listing');
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check ownership
    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.role !== 'admin') {
      console.log('ERROR: Not authorized to update');
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    const isChild = !!property.parent_id;
    const isTowerUnit = isChild && property.property_category === 'tower';

    // Sanitize integer fields to handle empty strings
    const sanitizedOwnerId = sanitizeInt(owner_person_id);
    const sanitizedAgentId = sanitizeInt(agent_id);
    const sanitizedProvinceId = sanitizeInt(province_id);
    const sanitizedDistrictId = sanitizeInt(district_id);
    const sanitizedAreaId = sanitizeInt(area_id);
    const sanitizedBedrooms = sanitizeInt(bedrooms);
    const sanitizedBathrooms = sanitizeInt(bathrooms);

    // Parse facilities to ensure it's a proper JSON array/object
    let parsedFacilities = facilities;
    if (facilities !== undefined) {
      if (typeof facilities === 'string') {
        try {
          parsedFacilities = JSON.parse(facilities);
        } catch (e) {
          parsedFacilities = facilities; // Keep as string if parse fails
        }
      }
    }

    const updateData = {
      owner_person_id: sanitizedOwnerId !== undefined ? sanitizedOwnerId : property.owner_person_id,
      owner_name: owner_name !== undefined ? owner_name : property.owner_name,
      agent_id: sanitizedAgentId !== undefined ? sanitizedAgentId : property.agent_id,
      property_type: property_type !== undefined ? property_type : property.property_type,
      purpose: purpose !== undefined ? purpose : property.purpose,
      title: title !== undefined ? title : property.title,
      unit_number: unit_number !== undefined ? unit_number : property.unit_number,
      floor: floor !== undefined ? floor : property.floor,
      sale_price: sale_price !== undefined ? sale_price : property.sale_price,
      rent_price: rent_price !== undefined ? rent_price : property.rent_price,
      is_available_for_sale: is_available_for_sale !== undefined ? !!is_available_for_sale : property.is_available_for_sale,
      is_available_for_rent: is_available_for_rent !== undefined ? !!is_available_for_rent : property.is_available_for_rent,
      area_size: area_size !== undefined ? area_size : property.area_size,
      description: description !== undefined ? description : property.description,
      details: details !== undefined ? details : property.details,
      status: status !== undefined ? status : property.status,
      facilities: parsedFacilities !== undefined ? parsedFacilities : property.facilities
    };

    // Only update these if NOT a child listing (child listings inherit these from parent)
    if (!isChild) {
      updateData.address = address !== undefined ? address : property.address;
      updateData.province_id = sanitizedProvinceId !== undefined ? sanitizedProvinceId : property.province_id;
      updateData.district_id = sanitizedDistrictId !== undefined ? sanitizedDistrictId : property.district_id;
      updateData.area_id = sanitizedAreaId !== undefined ? sanitizedAreaId : property.area_id;
      updateData.city = city !== undefined ? city : property.city;
      updateData.latitude = latitude !== undefined ? latitude : property.latitude;
      updateData.longitude = longitude !== undefined ? longitude : property.longitude;
    }

    // Handle Bedrooms/Bathrooms based on Tower rules
    if (isTowerUnit) {
      const activeType = property_type || property.property_type;
      if (activeType === 'apartment') {
        updateData.bedrooms = sanitizedBedrooms !== undefined ? sanitizedBedrooms : property.bedrooms;
        updateData.bathrooms = sanitizedBathrooms !== undefined ? sanitizedBathrooms : property.bathrooms;
      } else {
        // Force null for Office/Shop in Towers
        updateData.bedrooms = null;
        updateData.bathrooms = null;
      }
    } else {
      updateData.bedrooms = sanitizedBedrooms !== undefined ? sanitizedBedrooms : property.bedrooms;
      updateData.bathrooms = sanitizedBathrooms !== undefined ? sanitizedBathrooms : property.bathrooms;
    }

    console.log('Update data:', JSON.stringify(updateData, null, 2));
    await property.update(updateData);

    console.log('✓ Property updated successfully');
    console.log('========== UPDATE PROPERTY COMPLETE ==========');
    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('========== ERROR UPDATE PROPERTY ==========');
    console.error('Error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors.map(e => e.message));
      return res.status(400).json({ error: error.errors.map(e => e.message) });
    }
    res.status(500).json({ error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id);
    if (!property || property.record_kind !== 'listing') {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this property' });
    }

    const dealCount = await Deal.count({ where: { property_id: id } });
    if (dealCount > 0) {
      return res.status(400).json({ error: 'Cannot delete property with existing deals' });
    }

    await property.destroy();
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyProperties = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const properties = await Property.findAll({
      where: {
        record_kind: 'listing',
        [Op.or]: [
          { created_by_user_id: userId },
          { agent_id: userId }
        ]
      },
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture', 'role'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'profile_picture', 'role'] },
      ],
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Managed: All properties assigned to OR created by the agent
    const totalManaged = await Property.count({
      where: {
        [Op.or]: [
          { created_by_user_id: userId },
          { agent_id: userId }
        ]
      }
    });

    // Listed: All properties created by this user/agent (not assigned, just created)
    const totalListed = await Property.count({
      where: {
        created_by_user_id: userId
      }
    });

    // Public: Active properties available for sale or rent managed by the user
    const publicListings = await Property.count({
      where: {
        [Op.and]: [
          { status: 'active' },
          {
            [Op.or]: [
              { is_available_for_sale: true },
              { is_available_for_rent: true }
            ]
          },
          {
            [Op.or]: [
              { created_by_user_id: userId },
              { agent_id: userId }
            ]
          }
        ]
      }
    });

    // Active Deals: Active deals for the agent
    const activeDeals = await Deal.count({
      where: {
        status: 'active',
        agent_id: userId
      }
    });

    res.json({
      total_managed: totalManaged,
      total_listed: totalListed,
      public_listings: publicListings,
      active_deals: activeDeals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Simplified upload/delete file functions (keeping logic but cleaning up)
const uploadFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const photos = [];
    if (req.files) {
      req.files.forEach(file => {
        photos.push(`/uploads/${file.filename}`);
      });
    }

    const existingPhotos = Array.isArray(property.photos) ? property.photos : [];
    await property.update({ photos: [...existingPhotos, ...photos] });

    res.json({ message: 'Files uploaded successfully', photos: property.photos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPublicProperties = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const properties = await Property.findAll({
      where: {
        record_kind: 'listing',
        status: 'active'
      },
      limit: limit ? parseInt(limit) : 6,
      offset: offset ? parseInt(offset) : 0,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
      ],
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPublicPropertiesByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;
    const properties = await Property.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          { agent_id: id },
          { created_by_user_id: id }
        ]
      },
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        { 
          model: Property, 
          as: 'Children', 
          attributes: ['property_id', 'status'],
          required: false
        },
      ],
    });
    
    // Enrich container properties with children counts
    const enrichedProperties = properties.map(p => {
      const prop = p.toJSON();
      prop.id = prop.property_id;
      
      // Calculate children counts for containers
      if (prop.Children && prop.Children.length > 0) {
        prop.total_children = prop.Children.length;
        prop.available_children = prop.Children.filter(c => c.status === 'active').length;
        delete prop.Children;
      }
      
      return prop;
    });
    
    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAvailableProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      where: {
        record_kind: 'listing',
        status: 'active'
      },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertiesByOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const properties = await Property.findAll({
      where: {
        owner_person_id: id,
        record_kind: 'listing'
      }
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertyChildren = async (req, res) => {
  try {
    const { id } = req.params;
    const properties = await Property.findAll({
      where: {
        parent_id: id,
        record_kind: 'listing'
      },
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
      ]
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    await property.update({ status });
    res.json({ message: 'Property status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePropertyAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available_for_sale, is_available_for_rent } = req.body;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    await property.update({ is_available_for_sale, is_available_for_rent });
    res.json({ message: 'Property availability updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl } = req.body;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    
    const photos = Array.isArray(property.photos) ? property.photos : [];
    const updatedPhotos = photos.filter(p => p !== fileUrl);
    await property.update({ photos: updatedPhotos });
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertiesByTenant = async (req, res) => {
  // Simplified for now, returning by owner if tenant logic is not fully defined
  try {
    const { id } = req.params;
    const properties = await Property.findAll({
      where: {
        owner_person_id: id,
        record_kind: 'listing'
      }
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addChildProperty = async (req, res) => {
  // This is a bridge to the parentController logic if called via property routes
  const parentController = require('./parentController');
  return parentController.createChild(req, res);
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  searchProperties,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getDashboardStats,
  getPublicProperties,
  getPublicPropertiesByUser,
  getAvailableProperties,
  getPropertiesByOwner,
  getPropertyChildren,
  updatePropertyStatus,
  updatePropertyAvailability,
  deleteFile,
  getPropertiesByTenant,
  addChildProperty,
  uploadFiles
};
