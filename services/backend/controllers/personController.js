const { validationResult } = require('express-validator');
const { Person, Property, User } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

const createPerson = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { full_name, phone, email, national_id, address } = req.body;
    const id_card_path = req.file ? `/uploads/${req.file.filename}` : null;

    // Convert empty strings to null for optional unique fields
    const formattedNationalId = national_id === '' ? null : national_id;

    // Check if person with this national_id already exists
    if (formattedNationalId) {
      const existingPerson = await Person.findOne({ where: { national_id: formattedNationalId } });
      if (existingPerson) {
        return res.status(400).json({ 
          error: 'Person with this National ID already exists.', 
          code: 'DUPLICATE_NATIONAL_ID',
          person: {
            id: existingPerson.id,
            full_name: existingPerson.full_name
          }
        });
      }
    }

    // Check if person with this phone already exists
    if (phone) {
      const existingPerson = await Person.findOne({ where: { phone } });
      if (existingPerson) {
        return res.status(400).json({ error: 'Person with this phone already exists', person: existingPerson });
      }
    }

    const person = await Person.create({
      full_name,
      phone,
      email,
      national_id: formattedNationalId,
      address,
      id_card_path,
    });

    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPersons = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const persons = await Person.findAll({
      where,
      include: [
        {
          model: Property,
          as: 'OwnedProperties',
          attributes: ['property_id', 'property_type', 'city'],
          where: { record_kind: 'listing' },
          required: false
        },
      ],
      limit: 20,
    });

    res.json(persons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findByPk(id, {
      include: [
        {
          model: Property,
          as: 'OwnedProperties',
          where: { record_kind: 'listing' },
          required: false
        },
        {
          model: User,
          as: 'User',
          attributes: ['user_id', 'username', 'role'],
        }
      ],
    });

    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePerson = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { full_name, phone, email, national_id, address } = req.body;
    
    // Convert empty strings to null for optional unique fields
    const formattedNationalId = national_id === '' ? null : national_id;
    
    const person = await Person.findByPk(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const updateData = {
      full_name,
      phone,
      email,
      national_id: formattedNationalId,
      address,
    };

    if (req.file) {
      updateData.id_card_path = `/uploads/${req.file.filename}`;
    }

    await person.update(updateData);

    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findByPk(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const propertyCount = await Property.count({ where: { owner_person_id: id } });
    if (propertyCount > 0) {
      return res.status(400).json({ error: 'Cannot delete person who owns properties.' });
    }

    await person.destroy();
    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAgents = async (req, res) => {
  try {
    const agents = await User.findAll({
      where: { 
        role: { [Op.in]: ['agent', 'admin'] } 
      },
      attributes: ['user_id', 'full_name', 'phone', 'email', 'profile_picture', 'role'],
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { full_name, phone, email, national_id, address } = req.body;
    const profilePictureUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Convert empty strings to null for optional unique fields
    const formattedNationalId = national_id === '' ? null : national_id;
    
    let person = await Person.findOne({ where: { user_id: req.user.user_id } });
    
    if (!person) {
      person = await Person.create({
        user_id: req.user.user_id,
        full_name,
        phone,
        email: email || req.user.email,
        national_id: formattedNationalId,
        address,
      });
    } else {
      await person.update({
        full_name,
        phone,
        email: email || person.email,
        national_id: formattedNationalId,
        address,
      });
    }

    let user = await User.findByPk(req.user.user_id);
    if (user) {
      const updateData = {};
      if (profilePictureUrl) updateData.profile_picture = profilePictureUrl;
      if (full_name) updateData.full_name = full_name;
      if (phone) updateData.phone = phone;
      if (email) updateData.email = email;
      if (formattedNationalId !== undefined) updateData.national_id = formattedNationalId;
      if (address) updateData.address = address;
      
      await user.update(updateData);
    }

    res.json({
      ...person.toJSON(),
      profile_picture: user.profile_picture,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      national_id: user.national_id,
      address: user.address
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      return res.status(400).json({ 
        error: `Validation error: ${field} already exists.`,
        message: `${field} is already in use by another account.` 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const person = await Person.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['user_id', 'username', 'role', 'profile_picture'],
        }
      ],
    });

    if (!person) {
      return res.json({
        full_name: req.user.full_name,
        phone: req.user.phone,
        email: req.user.email,
        national_id: req.user.national_id,
        address: req.user.address,
        profile_picture: req.user.profile_picture,
        User: {
          user_id: req.user.user_id,
          username: req.user.username,
          role: req.user.role
        }
      });
    }

    res.json({
      ...person.toJSON(),
      profile_picture: person.User ? person.User.profile_picture : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPerson,
  getPersons,
  getPersonById,
  updatePerson,
  deletePerson,
  getAgents,
  getProfile,
  updateProfile,
};
