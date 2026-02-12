const { Province, District, Area } = require('../models');

// Public: Get all provinces
exports.getProvinces = async (req, res) => {
  try {
    const provinces = await Province.findAll({ order: [['name', 'ASC']] });
    res.json(provinces);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching provinces', error: error.message });
  }
};

// Public: Get districts by province ID
exports.getDistricts = async (req, res) => {
  try {
    const { provinceId } = req.params;
    console.log('Fetching districts for provinceId:', provinceId);
    const districts = await District.findAll({
      where: { province_id: provinceId },
      order: [['name', 'ASC']],
    });
    console.log(`Found ${districts.length} districts for provinceId ${provinceId}`);
    res.json(districts);
  } catch (error) {
    console.error('Error in getDistricts:', error);
    res.status(500).json({ message: 'Error fetching districts', error: error.message });
  }
};

// Public: Get areas by district ID
exports.getAreas = async (req, res) => {
  try {
    const { districtId } = req.params;
    const areas = await Area.findAll({
      where: { district_id: districtId },
      order: [['name', 'ASC']],
    });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching areas', error: error.message });
  }
};

// Admin: Create Province
exports.createProvince = async (req, res) => {
  try {
    const { name, native_name } = req.body;
    const province = await Province.create({ name, native_name });
    res.status(201).json(province);
  } catch (error) {
    res.status(500).json({ message: 'Error creating province', error: error.message });
  }
};

// Admin: Update Province
exports.updateProvince = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, native_name } = req.body;
    const province = await Province.findByPk(id);
    if (!province) return res.status(404).json({ message: 'Province not found' });

    await province.update({ name, native_name });
    res.json(province);
  } catch (error) {
    res.status(500).json({ message: 'Error updating province', error: error.message });
  }
};

// Admin: Delete Province
exports.deleteProvince = async (req, res) => {
  try {
    const { id } = req.params;
    const province = await Province.findByPk(id);
    if (!province) return res.status(404).json({ message: 'Province not found' });

    await province.destroy();
    res.json({ message: 'Province deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting province', error: error.message });
  }
};

// Admin: Create District
exports.createDistrict = async (req, res) => {
  try {
    const { province_id, name, native_name } = req.body;
    const district = await District.create({ province_id, name, native_name });
    res.status(201).json(district);
  } catch (error) {
    res.status(500).json({ message: 'Error creating district', error: error.message });
  }
};

// Admin: Update District
exports.updateDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, native_name } = req.body;
    const district = await District.findByPk(id);
    if (!district) return res.status(404).json({ message: 'District not found' });

    await district.update({ name, native_name });
    res.json(district);
  } catch (error) {
    res.status(500).json({ message: 'Error updating district', error: error.message });
  }
};

// Admin: Delete District
exports.deleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const district = await District.findByPk(id);
    if (!district) return res.status(404).json({ message: 'District not found' });

    await district.destroy();
    res.json({ message: 'District deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting district', error: error.message });
  }
};

// Admin: Create Area
exports.createArea = async (req, res) => {
  try {
    const { district_id, name, native_name } = req.body;
    const area = await Area.create({ district_id, name, native_name });
    res.status(201).json(area);
  } catch (error) {
    res.status(500).json({ message: 'Error creating area', error: error.message });
  }
};

// Admin: Update Area
exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, native_name } = req.body;
    const area = await Area.findByPk(id);
    if (!area) return res.status(404).json({ message: 'Area not found' });

    await area.update({ name, native_name });
    res.json(area);
  } catch (error) {
    res.status(500).json({ message: 'Error updating area', error: error.message });
  }
};

// Admin: Delete Area
exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findByPk(id);
    if (!area) return res.status(404).json({ message: 'Area not found' });

    await area.destroy();
    res.json({ message: 'Area deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting area', error: error.message });
  }
};
