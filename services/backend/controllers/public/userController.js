const { User, Property } = require('../../models');
const { Op } = require('sequelize');

const getPublicUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['user_id', 'full_name', 'profile_picture', 'bio', 'phone', 'email', 'role', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPublicAgents = async (req, res) => {
  try {
    const agents = await User.findAll({
      attributes: ['user_id', 'full_name', 'profile_picture', 'phone', 'email'],
      where: { role: 'agent' },
      order: [['full_name', 'ASC']]
    });

    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPublicPropertyListers = async (req, res) => {
  try {
    const users = await Property.findAll({
      attributes: ['created_by_user_id'],
      where: {
        record_kind: 'listing',
        [Op.or]: [
          { is_available_for_sale: true },
          { is_available_for_rent: true }
        ]
      },
      raw: true,
      group: ['created_by_user_id']
    });

    const userIds = users.map(u => u.created_by_user_id).filter(Boolean);
    
    const listers = await User.findAll({
      attributes: ['user_id', 'full_name', 'profile_picture', 'phone', 'email'],
      where: { user_id: userIds },
      order: [['full_name', 'ASC']]
    });

    res.json(listers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPublicUserProfile,
  getPublicAgents,
  getPublicPropertyListers,
};
