const jwt = require('jsonwebtoken');
const { User, UserPermission } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: UserPermission,
            as: 'Permissions',
            attributes: ['permission_key'],
          }
        ],
      });

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user.userPermissions = req.user.Permissions?.map(p => p.permission_key) || [];

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const agent = (req, res, next) => {
  if (req.user && (req.user.role === 'agent' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Agent role required.' });
  }
};

const hasPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Access denied. Agent role required for this action.' });
    }

    const userPermissions = req.user.userPermissions || [];
    const hasRequiredPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        message: 'Access denied. Required permission not granted.',
        required: requiredPermissions 
      });
    }

    next();
  };
};

module.exports = { protect, admin, agent, hasPermission };
