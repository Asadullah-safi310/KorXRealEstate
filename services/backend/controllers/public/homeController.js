const { Property, Province, District } = require('../../models');
const { sequelize } = require('../../config/db');
const { Op } = require('sequelize');

const getHomeContainers = async (req, res) => {
  try {
    const categories = ['tower', 'market', 'sharak', 'apartment'];
    
    const results = {};

    for (const category of categories) {
      const parents = await Property.findAll({
        where: {
          property_category: category,
          parent_id: null,
          status: { [Op.in]: ['active', 'draft'] },
          record_kind: 'container'
        },
        attributes: [
          'property_id',
          'title',
          'photos',
          'city',
          'total_units',
          'property_category',
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM properties AS children
              WHERE
                children.parent_id = Property.property_id
                AND (children.status = 'available' OR children.status = 'active')
            )`),
            'availableUnits'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM properties AS children
              WHERE
                children.parent_id = Property.property_id
                AND children.is_available_for_sale = true
                AND (children.status = 'available' OR children.status = 'active')
            )`),
            'forSaleUnits'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM properties AS children
              WHERE
                children.parent_id = Property.property_id
                AND children.is_available_for_rent = true
                AND (children.status = 'available' OR children.status = 'active')
            )`),
            'forRentUnits'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM properties AS children
              WHERE
                children.parent_id = Property.property_id
            )`),
            'childCount'
          ]
        ],
        include: [
          { model: Province, as: 'ProvinceData', attributes: ['name'] },
          { model: District, as: 'DistrictData', attributes: ['name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      results[category + 's'] = parents.map(p => {
        const pJson = p.toJSON();
        
        let photosArr = [];
        try {
          if (Array.isArray(pJson.photos)) {
            photosArr = pJson.photos;
          } else if (typeof pJson.photos === 'string' && pJson.photos.length > 0) {
            photosArr = JSON.parse(pJson.photos);
          }
        } catch (e) {
          photosArr = [];
        }

        return {
          id: pJson.property_id,
          title: pJson.title,
          images: photosArr.length > 0 ? photosArr : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6'],
          city: pJson.DistrictData?.name || pJson.city,
          province: pJson.ProvinceData?.name,
          availableUnits: parseInt(pJson.availableUnits) || 0,
          totalUnits: pJson.total_units || parseInt(pJson.childCount) || 0,
          forSaleUnits: parseInt(pJson.forSaleUnits) || 0,
          forRentUnits: parseInt(pJson.forRentUnits) || 0,
          category: pJson.property_category
        };
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching home containers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getHomeContainers
};
