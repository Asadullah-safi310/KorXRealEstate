const { sequelize } = require('../config/db');
const { User } = require('../models');
const { Op } = require('sequelize');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const adminPhone = '0774804914';
    const adminEmail = 'starone310@gmail.com';
    const adminPassword = 'admin123';
    const adminUsername = 'admin';

    // Find existing admin by phone OR username OR email
    const existingAdmin = await User.findOne({
      where: {
        [Op.or]: [
          { phone: adminPhone },
          { username: adminUsername },
          { email: adminEmail },
        ],
      },
    });

    if (existingAdmin) {
      console.log('Admin user already exists.');
      // Update to ensure role is admin
      existingAdmin.role = 'admin';
      existingAdmin.phone = adminPhone;
      existingAdmin.email = adminEmail;
      existingAdmin.username = adminUsername;
      existingAdmin.password_hash = adminPassword; // Hook will hash this
      await existingAdmin.save();
      console.log(`Admin user updated. Phone: ${adminPhone}, Password: ${adminPassword}`);
    } else {
      await User.create({
        username: adminUsername,
        email: adminEmail,
        password_hash: adminPassword, // Hook will hash this
        full_name: 'System Administrator',
        phone: adminPhone,
        role: 'admin',
        is_active: true
      });
      console.log(`Admin user created. Phone: ${adminPhone}, Password: ${adminPassword}`);
    }

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await sequelize.close();
  }
};

createAdmin();
