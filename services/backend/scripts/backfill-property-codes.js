const { Property } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

const generatePropertyCode = (number) => {
  return `PROP-${String(number).padStart(7, '0')}`;
};

const backfillPropertyCodes = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting property code backfill...');
    
    // Get all properties without property_code
    const propertiesWithoutCode = await Property.findAll({
      where: {
        [Op.or]: [
          { property_code: null },
          { property_code: '' }
        ]
      },
      order: [['property_id', 'ASC']],
      transaction
    });
    
    console.log(`Found ${propertiesWithoutCode.length} properties without property codes`);
    
    if (propertiesWithoutCode.length === 0) {
      console.log('No properties need backfilling. All properties have codes.');
      await transaction.commit();
      return;
    }
    
    // Get the highest existing property code number
    const latestProperty = await Property.findOne({
      where: { 
        property_code: { [Op.ne]: null },
        property_code: { [Op.like]: 'PROP-%' }
      },
      order: [['property_id', 'DESC']],
      attributes: ['property_code'],
      transaction
    });
    
    let nextNumber = 1;
    if (latestProperty && latestProperty.property_code) {
      const match = latestProperty.property_code.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }
    
    console.log(`Starting from code number: ${nextNumber}`);
    
    // Update each property with a unique code
    let updatedCount = 0;
    for (const property of propertiesWithoutCode) {
      let codeGenerated = false;
      let attempts = 0;
      
      while (!codeGenerated && attempts < 100) {
        const code = generatePropertyCode(nextNumber);
        
        // Check if code already exists
        const existing = await Property.findOne({
          where: { property_code: code },
          transaction
        });
        
        if (!existing) {
          await property.update({ property_code: code }, { transaction });
          console.log(`Property ${property.property_id}: assigned code ${code}`);
          codeGenerated = true;
          updatedCount++;
        }
        
        nextNumber++;
        attempts++;
      }
      
      if (!codeGenerated) {
        throw new Error(`Failed to generate unique code for property ${property.property_id}`);
      }
    }
    
    await transaction.commit();
    console.log(`\nBackfill complete! Updated ${updatedCount} properties.`);
    process.exit(0);
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error during backfill:', error);
    process.exit(1);
  }
};

// Run the backfill
backfillPropertyCodes();
