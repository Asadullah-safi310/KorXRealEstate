const { sequelize } = require('../config/db');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const adminPhone = '0000000000';
    const adminEmail = 'admin@realestate.com';
    const adminPassword = 'admin123';
    const adminUsername = 'admin';

    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { phone: adminPhone } });

    if (existingAdmin) {
      console.log('Admin user already exists.');
      // Update to ensure role is admin
      existingAdmin.role = 'admin';
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
