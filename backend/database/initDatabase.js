import db from '../config/db.js';

const schema = `
  CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('Classroom', 'Laboratory', 'Seminar Hall')),
      capacity INTEGER NOT NULL CHECK (capacity > 0),
      status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      booking_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (start_time < end_time)
  );

  CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      asset_name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      serial_number VARCHAR(100) NOT NULL UNIQUE,
      condition VARCHAR(50) NOT NULL CHECK (condition IN ('Available', 'Assigned', 'Damaged', 'Under Repair')),
      assigned_resource_id INTEGER REFERENCES resources(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS maintenance_requests (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      reported_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      issue TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'resources'
        AND c.conname = 'resources_name_unique'
    ) THEN
      ALTER TABLE resources ADD CONSTRAINT resources_name_unique UNIQUE (name);
    END IF;
  END$$;

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_resource_date ON bookings(resource_id, booking_date);
  CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time);
  CREATE INDEX IF NOT EXISTS idx_assets_resource ON assets(assigned_resource_id);
  CREATE INDEX IF NOT EXISTS idx_assets_condition ON assets(condition);
  CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance_requests(asset_id);
  CREATE INDEX IF NOT EXISTS idx_maintenance_reporter ON maintenance_requests(reported_by);
  CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
`;

const createTables = async () => {
  try {
    console.log('Initializing PostgreSQL Database...');
    await db.query('BEGIN');
    await db.query(schema);
    await db.query('COMMIT');
    console.log('All tables created successfully!');
    process.exit(0);
  } catch (err) {
    try {
      await db.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback failed:', rollbackErr);
    }

    console.error('Error creating tables:', err);
    process.exit(1);
  }
};

createTables();
