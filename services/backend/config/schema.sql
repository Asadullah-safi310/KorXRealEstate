-- Create Database
CREATE DATABASE IF NOT EXISTS real_estate_pms;
USE real_estate_pms;

-- Owners Table
CREATE TABLE IF NOT EXISTS owners (
  owner_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  cnic VARCHAR(50),
  address VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Properties Table
-- Note: This schema is simplified. The actual table has many more columns managed by Sequelize.
-- property_type must be one of: 'house', 'shop', 'office', 'plot', 'land', 'apartment', 'tower', 'market', 'sharak'
CREATE TABLE IF NOT EXISTS properties (
  property_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  property_type VARCHAR(50) NOT NULL,
  purpose VARCHAR(20) NOT NULL,
  price DECIMAL(18,2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  area_size VARCHAR(50) NOT NULL,
  bedrooms INT,
  bathrooms INT,
  description TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  status VARCHAR(20) DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(owner_id) ON DELETE CASCADE
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  client_id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  requirement_type VARCHAR(20) NOT NULL,
  property_type VARCHAR(50) NOT NULL,
  min_price DECIMAL(18,2),
  max_price DECIMAL(18,2),
  preferred_location VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Deals Table
CREATE TABLE IF NOT EXISTS deals (
  deal_id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  client_id INT NOT NULL,
  final_price DECIMAL(18,2),
  deal_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'completed',
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

-- User Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  permission_key VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_permission (user_id, permission_key),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert Sample Data
INSERT INTO owners (owner_name, phone, cnic, address) VALUES
('Ali Khan', '03001234567', '42101-1234567-1', 'Karachi'),
('Fatima Ahmed', '03002345678', '42102-2345678-2', 'Lahore'),
('Hassan Ali', '03003456789', '42103-3456789-3', 'Islamabad');



INSERT INTO clients (client_name, phone, requirement_type, property_type, min_price, max_price, preferred_location) VALUES
('Muhammad Hassan', '03101111111', 'rent', 'flat', 40000, 80000, 'Clifton'),
('Ayesha Malik', '03102222222', 'sale', 'house', 4000000, 10000000, 'Karachi'),
('Ahmed Khan', '03103333333', 'sale', 'plot', 1500000, 3000000, 'Lahore');
