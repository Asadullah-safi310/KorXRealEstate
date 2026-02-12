const { Property, Province, District, Area, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
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

const createParent = async (req, res) => {
  try {
    const {
      title,
      property_category,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      description,
      facilities,
      photos,
      details,
      owner_person_id,
      agent_id,
      total_floors,
      planned_units
    } = req.body;

    // Sanitize integer fields
    const sanitizedProvinceId = sanitizeInt(province_id);
    const sanitizedDistrictId = sanitizeInt(district_id);
    const sanitizedAreaId = sanitizeInt(area_id);
    const sanitizedOwnerId = sanitizeInt(owner_person_id);
    const sanitizedAgentId = sanitizeInt(agent_id);
    const sanitizedTotalFloors = sanitizeInt(total_floors);
    const sanitizedPlannedUnits = sanitizeInt(planned_units);

    // Parse facilities to ensure it's a proper JSON array/object
    let parsedFacilities = facilities;
    if (facilities !== undefined && facilities !== null) {
      if (typeof facilities === 'string') {
        try {
          parsedFacilities = JSON.parse(facilities);
        } catch (e) {
          parsedFacilities = null;
        }
      }
    }

    // Normalize category: 'apartment' -> 'tower'
    let normalizedCategory = (property_category || '').toLowerCase().trim();
    if (normalizedCategory === 'apartment') {
      normalizedCategory = 'tower';
    }

    // Enforce parent container category rules: must be tower, market, or sharak
    const allowedParentCategories = ['tower', 'market', 'sharak'];
    if (!allowedParentCategories.includes(normalizedCategory)) {
      return res.status(400).json({ error: 'Invalid parent category. Must be one of: tower, market, sharak' });
    }

    // Permission check
    const categoryKey = normalizedCategory.toUpperCase();
    if (PERMISSIONS[categoryKey] && !hasPermission(req.user, PERMISSIONS[categoryKey].PARENT_CREATE)) {
      return res.status(403).json({ error: `Not authorized to create ${normalizedCategory} containers` });
    }

    const detailsObj = details || {};
    if (sanitizedPlannedUnits) {
      detailsObj.planned_units = sanitizedPlannedUnits;
    }

    // Parent containers: record_kind='container', is_parent=1, category=tower|market|sharak, parent_property_id=NULL
    const parent = await Property.create({
      title,
      property_category: normalizedCategory, // Normalized category (tower, market, or sharak)
      record_kind: 'container', // Parent containers are containers, not listings
      is_parent: true, // Parent containers have is_parent=1
      parent_id: null, // Parent containers have no parent
      parent_property_id: null, // Parent containers have no parent
      property_type: normalizedCategory, // Set property_type to match category for containers
      province_id: sanitizedProvinceId,
      district_id: sanitizedDistrictId,
      area_id: sanitizedAreaId,
      address,
      latitude,
      longitude,
      description,
      facilities: parsedFacilities,
      photos: photos || [],
      details: detailsObj,
      owner_person_id: sanitizedOwnerId,
      agent_id: sanitizedAgentId,
      total_floors: sanitizedTotalFloors,
      total_units: sanitizedPlannedUnits, // Keep for compatibility if needed, but primary is details
      created_by_user_id: req.user.user_id,
      status: 'active',
      purpose: null, // Containers must NOT be listed for sale/rent
      sale_price: null,
      rent_price: null
    });

    console.log('Parent container created successfully:', parent.property_id);
    res.status(201).json({ 
      message: 'Parent container created successfully', 
      property_id: parent.property_id,
      id: parent.property_id // For backward compatibility
    });
  } catch (error) {
    console.error('Error creating parent container:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message) });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Unique constraint error' });
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

const getAgentParents = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Permission check
    const permKey = category.toUpperCase();
    if (PERMISSIONS[permKey] && !hasPermission(req.user, PERMISSIONS[permKey].PARENT_READ)) {
      return res.status(403).json({ error: `Not authorized to read ${category} containers` });
    }

    const where = {
      property_category: category,
      record_kind: 'container',
      parent_id: null
    };

    if (req.user.role !== 'admin') {
      where.created_by_user_id = req.user.user_id;
    }

    const parents = await Property.findAll({
      where,
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        { 
          model: Property, 
          as: 'Children', 
          attributes: ['property_id', 'status'] 
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    // Enforce derived counts
    const enrichedParents = parents.map(parent => {
      const p = parent.toJSON();
      p.id = p.property_id;
      p.total_children = p.Children ? p.Children.length : 0;
      p.available_children = p.Children ? p.Children.filter(c => c.status === 'active').length : 0;
      delete p.Children;
      return p;
    });

    res.json(enrichedParents);
  } catch (error) {
    console.error('Error fetching agent containers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getParentById = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await Property.findByPk(id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        { model: User, as: 'Agent', attributes: ['full_name', 'email'] },
        { 
          model: Property, 
          as: 'Children', 
          attributes: ['property_id', 'status'] 
        }
      ],
    });

    if (!parent || parent.record_kind !== 'container') {
      return res.status(404).json({ error: 'Container not found' });
    }

    const parentJson = parent.toJSON();
    parentJson.id = parentJson.property_id;
    parentJson.total_children = parentJson.Children ? parentJson.Children.length : 0;
    parentJson.available_children = parentJson.Children ? parentJson.Children.filter(c => c.status === 'active').length : 0;
    delete parentJson.Children;

    res.json(parentJson);
  } catch (error) {
    console.error('Error fetching container details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getParentChildren = async (req, res) => {
  try {
    const { id } = req.params;
    const where = { 
      parent_id: id,
      record_kind: 'listing'
    };

    const children = await Property.findAll({
      where,
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const enrichedChildren = children.map(child => {
      const c = child.toJSON();
      c.id = c.property_id;
      c.forSale = !!c.is_available_for_sale;
      c.forRent = !!c.is_available_for_rent;
      return c;
    });

    res.json(enrichedChildren);
  } catch (error) {
    console.error('Error fetching container units:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createChild = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('========== CREATE CHILD UNIT ==========');
    console.log('Parent ID:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    const parent = await Property.findByPk(id);
    console.log('Parent found:', parent ? `Yes (${parent.property_category})` : 'No');

    if (!parent || parent.record_kind !== 'container') {
      console.log('ERROR: Parent not found or not a container');
      return res.status(404).json({ error: 'Parent container not found' });
    }

    const {
      title,
      property_type,
      description,
      photos,
      purpose,
      sale_price,
      rent_price,
      area_size,
      bedrooms,
      bathrooms,
      unit_number,
      floor,
      is_available_for_sale,
      is_available_for_rent,
      details,
      facilities,
      amenities
    } = req.body;
    
    // Sanitize integer fields
    const sanitizedBedrooms = sanitizeInt(bedrooms);
    const sanitizedBathrooms = sanitizeInt(bathrooms);

    // Parse facilities/amenities for unit-specific amenities
    let unitFacilities = facilities || amenities;
    if (unitFacilities !== undefined && unitFacilities !== null) {
      if (typeof unitFacilities === 'string') {
        try {
          unitFacilities = JSON.parse(unitFacilities);
        } catch (e) {
          unitFacilities = null;
        }
      }
    }
    
    console.log('Extracted fields - Title:', title, 'Type:', property_type, 'Purpose:', purpose);

    const allowedTypes = {
      tower: ['apartment', 'shop', 'office'],
      market: ['shop', 'office'],
      sharak: ['apartment', 'shop', 'office', 'land', 'house']
    };

    // Normalize parent category: 'apartment' -> 'tower'
    let parentCategory = (parent.property_category || '').toLowerCase().trim();
    if (parentCategory === 'apartment') {
      parentCategory = 'tower';
    }

    // Ensure parent category is valid
    if (!['tower', 'market', 'sharak'].includes(parentCategory)) {
      return res.status(400).json({ error: 'Invalid parent container category' });
    }

    const typeLower = (property_type || '').toLowerCase();

    if (!allowedTypes[parentCategory] || !allowedTypes[parentCategory].includes(typeLower)) {
      return res.status(400).json({ 
        error: `Invalid unit type for ${parentCategory}. Allowed: ${allowedTypes[parentCategory].join(', ')}` 
      });
    }

    // Permission check
    const permKey = parentCategory.toUpperCase();
    if (PERMISSIONS[permKey] && !hasPermission(req.user, PERMISSIONS[permKey].CHILD_CREATE)) {
      return res.status(403).json({ error: `Not authorized to create ${parentCategory} units` });
    }

    const isTowerOrMarket = parentCategory === 'tower' || parentCategory === 'market';
    const activeBedrooms = (isTowerOrMarket && typeLower !== 'apartment') ? null : sanitizedBedrooms;
    const activeBathrooms = (isTowerOrMarket && typeLower !== 'apartment') ? null : sanitizedBathrooms;

    // Child units: record_kind='listing', is_parent=0, category inherited from parent, parent_property_id=parent.id
    // According to requirements: Child units inherit category from parent container
    const childData = {
      parent_id: id,
      parent_property_id: id, // Child units must reference parent
      property_category: parentCategory, // Inherit from parent: tower, market, or sharak (normalized)
      record_kind: 'listing', // Child units are always listings, not containers
      is_parent: false, // Child units are never parents (is_parent=0)
      property_type: typeLower,
      title,
      description,
      photos: photos || [],
      purpose: purpose || 'sale',
      sale_price,
      rent_price,
      area_size: area_size || '0',
      bedrooms: activeBedrooms,
      bathrooms: activeBathrooms,
      unit_number,
      floor,
      is_available_for_sale: !!is_available_for_sale,
      is_available_for_rent: !!is_available_for_rent,
      details: details || {},
      created_by_user_id: req.user.user_id,
      status: 'active',
      // Inherit location from parent container
      province_id: parent.province_id,
      district_id: parent.district_id,
      area_id: parent.area_id,
      address: parent.address,
      latitude: parent.latitude,
      longitude: parent.longitude,
      city: parent.city,
      // Use unit-specific facilities if provided, otherwise inherit from parent
      facilities: unitFacilities !== undefined ? unitFacilities : parent.facilities
    };
    
    console.log('Creating child with data:', JSON.stringify(childData, null, 2));
    const child = await Property.create(childData);
    console.log('Child created successfully! ID:', child.property_id);

    const enrichedChild = await Property.findByPk(child.property_id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
      ]
    });
    
    console.log('Enriched child fetched:', enrichedChild ? 'Yes' : 'No');
    console.log('Returning response with property_id:', child.property_id);
    console.log('========== CREATE CHILD COMPLETE ==========');

    res.status(201).json({
      message: 'Unit created successfully',
      property_id: child.property_id,
      id: child.property_id,
      property: enrichedChild
    });
  } catch (error) {
    console.error('========== ERROR CREATING CHILD UNIT ==========');
    console.error('Error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors.map(e => e.message));
      return res.status(400).json({ error: error.errors.map(e => e.message) });
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

const updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('========== UPDATE PARENT CONTAINER ==========');
    console.log('Parent ID:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const parent = await Property.findByPk(id);
    console.log('Parent found:', parent ? `Yes (${parent.property_category})` : 'No');

    if (!parent || parent.record_kind !== 'container') {
      console.log('ERROR: Parent not found or not a container');
      return res.status(404).json({ error: 'Container not found' });
    }

    if (req.user.role !== 'admin' && parent.created_by_user_id !== req.user.user_id) {
      console.log('ERROR: Not authorized');
      return res.status(403).json({ error: 'Not authorized to update this container' });
    }

    const {
      title,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      description,
      facilities,
      details,
      status,
      planned_units,
      total_floors,
      agent_id,
      owner_person_id
    } = req.body;

    // Sanitize integer fields
    const sanitizedProvinceId = sanitizeInt(province_id);
    const sanitizedDistrictId = sanitizeInt(district_id);
    const sanitizedAreaId = sanitizeInt(area_id);
    const sanitizedPlannedUnits = sanitizeInt(planned_units);
    const sanitizedTotalFloors = sanitizeInt(total_floors);
    const sanitizedAgentId = sanitizeInt(agent_id);
    const sanitizedOwnerId = sanitizeInt(owner_person_id);

    // Parse facilities to ensure it's a proper JSON array/object
    let parsedFacilities = facilities;
    if (facilities !== undefined && facilities !== null) {
      if (typeof facilities === 'string') {
        try {
          parsedFacilities = JSON.parse(facilities);
        } catch (e) {
          parsedFacilities = parent.facilities;
        }
      }
    }

    const detailsObj = details || parent.details || {};
    if (sanitizedPlannedUnits !== undefined) {
      detailsObj.planned_units = sanitizedPlannedUnits;
    }
    if (sanitizedTotalFloors !== undefined) {
      detailsObj.total_floors = sanitizedTotalFloors;
    }

    const updateData = {
      title: title !== undefined ? title : parent.title,
      province_id: sanitizedProvinceId !== undefined ? sanitizedProvinceId : parent.province_id,
      district_id: sanitizedDistrictId !== undefined ? sanitizedDistrictId : parent.district_id,
      area_id: sanitizedAreaId !== undefined ? sanitizedAreaId : parent.area_id,
      address: address !== undefined ? address : parent.address,
      latitude: latitude !== undefined ? latitude : parent.latitude,
      longitude: longitude !== undefined ? longitude : parent.longitude,
      description: description !== undefined ? description : parent.description,
      facilities: parsedFacilities !== undefined ? parsedFacilities : parent.facilities,
      details: detailsObj,
      status: status !== undefined ? status : parent.status,
      total_floors: sanitizedTotalFloors !== undefined ? sanitizedTotalFloors : parent.total_floors,
      total_units: sanitizedPlannedUnits !== undefined ? sanitizedPlannedUnits : parent.total_units,
      agent_id: sanitizedAgentId !== undefined ? sanitizedAgentId : parent.agent_id,
      owner_person_id: sanitizedOwnerId !== undefined ? sanitizedOwnerId : parent.owner_person_id
    };

    console.log('Update data:', JSON.stringify(updateData, null, 2));
    await parent.update(updateData);
    console.log('✓ Parent updated successfully');

    const updatedParent = await Property.findByPk(id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        { model: User, as: 'Agent', attributes: ['full_name', 'email'] }
      ],
    });

    console.log('========== UPDATE PARENT COMPLETE ==========');
    res.json(updatedParent);
  } catch (error) {
    console.error('========== ERROR UPDATING PARENT ==========');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteParent = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await Property.findByPk(id);

    if (!parent || parent.record_kind !== 'container') {
      return res.status(404).json({ error: 'Container not found' });
    }

    if (req.user.role !== 'admin' && parent.created_by_user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to delete this container' });
    }

    const childCount = await Property.count({ where: { parent_id: id } });
    if (childCount > 0) {
      await parent.update({ status: 'inactive' });
      return res.json({ message: 'Container marked as inactive because it has units' });
    } else {
      await parent.destroy();
    }

    res.json({ message: 'Container deleted successfully' });
  } catch (error) {
    console.error('Error deleting container:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createParent,
  getAgentParents,
  getParentById,
  getParentChildren,
  createChild,
  updateParent,
  deleteParent
};
