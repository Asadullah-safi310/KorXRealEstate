const { validationResult } = require('express-validator');
const { Deal, Property, User, Person, PropertyHistory } = require('../models');
const { sequelize } = require('../config/db');

const createDeal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const transaction = await sequelize.transaction();

  try {
    const { 
      deal_type, 
      property_id, 
      seller_person_id, 
      buyer_person_id, 
      price, 
      start_date, 
      end_date,
      notes,
    } = req.body;

    const property = await Property.findByPk(property_id, { transaction });
    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Property not found' });
    }

    // Backend enforcement: Deal creation is allowed only if the property is available for sale or rent.
    if (!property.is_available_for_sale && !property.is_available_for_rent) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Deal creation is allowed only if the property is available for sale or rent.' });
    }

    // Check if the logged-in user is an agent or admin
    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Only agents and admins can create deals' });
    }

    // Check if the agent is authorized for this property (assigned agent or creator or admin)
    if (req.user.role === 'agent') {
      if (property.agent_id !== req.user.user_id && property.created_by_user_id !== req.user.user_id) {
        await transaction.rollback();
        return res.status(403).json({ error: 'You are not authorized to create a deal for this property.' });
      }
    }

    // Fetch seller and buyer for snapshots
    const seller = await Person.findByPk(seller_person_id || property.owner_person_id, { transaction });
    const buyer = await Person.findByPk(buyer_person_id, { transaction });

    if (!seller) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Seller (Person) not found' });
    }

    if (!buyer) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Buyer/Tenant (Person) not found' });
    }

    const deal = await Deal.create({
      property_id,
      agent_user_id: req.user.user_id,
      seller_person_id: seller.id,
      buyer_person_id: buyer.id,
      deal_type,
      price,
      start_date,
      end_date,
      notes,
      seller_name_snapshot: seller.full_name,
      seller_phone_snapshot: seller.phone,
      buyer_name_snapshot: buyer.full_name,
      buyer_phone_snapshot: buyer.phone,
      status: 'completed',
      deal_completed_at: new Date(),
    }, { transaction });

    // Update Property status and availability
    const updateData = {
      status: 'under_deal',
      is_available_for_sale: false,
      is_available_for_rent: false,
    };

    // If it's a SALE, transfer ownership to the buyer
    if (deal_type === 'SALE') {
      updateData.owner_person_id = buyer.id;
    }

    await property.update(updateData, { transaction });

    // Create History
    await PropertyHistory.create({
      property_id,
      previous_owner_id: null, // Legacy field, might want to refactor history too later
      new_owner_id: null,
      change_type: deal_type === 'SALE' ? 'TRANSFERRED_SALE' : 'RENTED',
      change_date: new Date(),
      details: { 
        deal_id: deal.deal_id,
        price, 
        seller: seller.full_name, 
        buyer: buyer.full_name 
      },
    }, { transaction });

    await transaction.commit();
    
    res.status(201).json({ 
      message: `${deal_type} deal created successfully`,
      deal_id: deal.deal_id
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

const getDeals = async (req, res) => {
  try {
    const deals = await Deal.findAll({
      include: [
        { model: Property, as: 'Property' },
        { model: Person, as: 'Seller', attributes: ['id', 'full_name', 'phone'] },
        { model: Person, as: 'Buyer', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDealById = async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await Deal.findByPk(id, {
      include: [
        { model: Property, as: 'Property' },
        { model: Person, as: 'Seller' },
        { model: Person, as: 'Buyer' },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'email'] },
      ],
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDealsByUser = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const deals = await Deal.findAll({
      where: { agent_user_id: userId },
      include: [
        { model: Property, as: 'Property' },
        { model: Person, as: 'Seller', attributes: ['id', 'full_name'] },
        { model: Person, as: 'Buyer', attributes: ['id', 'full_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createDeal, getDeals, getDealById, getDealsByUser };
