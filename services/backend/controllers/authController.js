const { User, OTP, UserPermission } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `**@${domain}`;
  const maskedLocal = local.substring(0, 2) + '••••' + local.substring(local.length - 1);
  return `${maskedLocal}@${domain}`;
};

exports.forgotPassword = async (req, res) => {
  try {
    const { identifier, email: submittedEmail } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: 'Phone or username is required' });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ phone: identifier }, { username: identifier }]
      }
    });

    if (!user) {
      // Do not reveal if user exists for security? 
      // Actually requirement says "Validation Rules: User must enter the exact email associated with their account. Backend must: Check if the email exists Ensure the email belongs to an active user"
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(400).json({ message: 'User account is inactive' });
    }

    if (!user.email) {
      return res.status(400).json({ message: 'This account does not have an email registered. Please contact an administrator.' });
    }

    if (!submittedEmail) {
      // Step 1: Just identification, return masked email
      return res.json({
        user_id: user.user_id,
        maskedEmail: maskEmail(user.email)
      });
    }

    // Step 2: Verify email and send OTP
    if (user.email !== submittedEmail) {
      return res.status(400).json({ message: 'The email does not match the one registered with this account.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await OTP.create({
      user_id: user.user_id,
      otp: otpCode,
      expiresAt,
      used: false
    });

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Code',
        message: `Your password reset code is ${otpCode}. This code will expire in 10 minutes.`,
        html: `<p>Your password reset code is <strong>${otpCode}</strong>.</p><p>This code will expire in 10 minutes.</p>`
      });

      res.json({ message: 'OTP sent to your email' });
    } catch (mailError) {
      console.error('Mail Error:', mailError);
      
      // If it's a configuration error, tell the user
      if (mailError.message.includes('not configured')) {
        return res.status(500).json({ 
          message: 'Email service is not configured on the server.',
          error: mailError.message 
        });
      }

      return res.status(500).json({ message: 'Error sending email. Please check your SMTP settings.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [{ phone: identifier }, { username: identifier }]
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpRecord = await OTP.findOne({
      where: {
        user_id: user.user_id,
        otp,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      // Check if it's expired or just wrong
      const wrongOtp = await OTP.findOne({
        where: { user_id: user.user_id, otp },
        order: [['createdAt', 'DESC']]
      });

      if (wrongOtp && wrongOtp.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Code expired' });
      }

      return res.status(400).json({ message: 'Invalid code' });
    }

    res.json({ message: 'Code verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    // Password validation
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long.' 
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ phone: identifier }, { username: identifier }]
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpRecord = await OTP.findOne({
      where: {
        user_id: user.user_id,
        otp,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Update password
    user.password_hash = newPassword; // Hooks will hash it
    await user.save();

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    console.log(`[AUDIT] Password reset successful for user_id: ${user.user_id} at ${new Date().toISOString()}`);

    res.json({ message: 'Your password has been reset successfully. Please log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const userExists = await User.findOne({ 
      where: { 
        [Op.or]: [
          { phone }, //Checks if a user already has this phone number
          ...(email ? [{ email }] : []),    //... is the spread operator means, "Take everything inside this array and insert it here.”
          { username }  // Checks if a user already has this username in the whole user table
        ]
      } 
    });

    if (userExists) {
      if (userExists.phone === phone) {
        return res.status(400).json({ message: 'User with this phone number already exists' });
      }
      if (email && userExists.email === email) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (userExists.username === username) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    // create user or add new user into user table
    const user = await User.create({
      username,
      email,
      password_hash: password,
      full_name,
      phone,
    });

    if (user) {
      const token = generateToken(user.user_id);
      
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(201).json({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions: [],
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }


  /* 
  Notes:
  [Op.or]: means ANY ONE of the following conditions can match
  If any condition is true → it means the user exists, and the database will return that user if any of 3 conditions match
  */
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    const identifier = phone.trim();
    console.log(`[AUTH] Login attempt for: ${identifier}`);

    // Find user by phone OR username
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { phone: identifier }, 
          { username: identifier }
        ]
      } 
    });

    if (!user) {
      console.log(`[AUTH] Login failed: User not found for ${identifier}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      console.log(`[AUTH] Login failed: Account inactive for ${identifier}`);
      return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
    }

    const isMatch = await user.validatePassword(password);
    
    if (isMatch) {
      console.log(`[AUTH] Login successful for: ${user.username} (${user.role})`);
      const token = generateToken(user.user_id);

      const permissions = await UserPermission.findAll({
        where: { user_id: user.user_id },
        attributes: ['permission_key']
      });

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions: permissions.map(p => p.permission_key),
        token,
      });
    } else {
      console.log(`[AUTH] Login failed: Incorrect password for ${identifier}`);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: UserPermission,
          as: 'Permissions',
          attributes: ['permission_key']
        }
      ]
    });

    if (user) {
      const userData = user.toJSON();
      userData.permissions = userData.Permissions?.map(p => p.permission_key) || [];
      delete userData.Permissions;
      res.json(userData);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



/*
what is sequelize for?
We write JavaScript objects, Sequelize converts them into SQL queries, then MySQL2 sends those queries to the MySQL database so it can understand and execute them.
You → JavaScript
Sequelize → Translator (JS → SQL)
MySQL2 → Messenger or driver (sends SQL queries to the database)
MySQL → Listener & executor
No matter if you use ORM like Sequelize or raw SQL, you always need a driver/messenger to deliver queries from your code to the database. 
*/
