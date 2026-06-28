import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const seedData = async () => {
  try {
    await db.query('BEGIN');

    const roles = ['admin', 'faculty', 'student', 'maintenance'];
    for (const role of roles) {
      await db.query(
        'INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [role]
      );
    }

    const roleRows = await db.query('SELECT id, name FROM roles');
    const roleMap = Object.fromEntries(roleRows.rows.map((row) => [row.name, row.id]));

    const users = [
      { name: 'Admin One', email: 'admin1@rms.com', role: 'admin' },
      { name: 'Faculty One', email: 'faculty1@rms.com', role: 'faculty' },
      { name: 'Student One', email: 'student1@rms.com', role: 'student' },
      { name: 'Maintenance One', email: 'maintenance1@rms.com', role: 'maintenance' },
    ];

    const commonPassword = 'Password123!';
    const passwordHash = bcrypt.hashSync(commonPassword, 10);
    // Ensure admin has the known admin password hashed (not plain text)
    const adminPasswordHash = bcrypt.hashSync('password123', 10);

    for (const user of users) {
      const hashToUse = user.email === 'admin1@rms.com' ? adminPasswordHash : passwordHash;
      await db.query(
        `INSERT INTO users (name, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, hashToUse, roleMap[user.role]]
      );
    }

    const resourceRows = [
      { name: 'Room 101', type: 'Classroom', capacity: 40, status: 'Available' },
      { name: 'Lab A', type: 'Laboratory', capacity: 24, status: 'Available' },
      { name: 'Seminar Hall 1', type: 'Seminar Hall', capacity: 80, status: 'Available' },
    ];

    for (const resource of resourceRows) {
      await db.query(
        `INSERT INTO resources (name, type, capacity, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING`,
        [resource.name, resource.type, resource.capacity, resource.status]
      );
    }

    const usersDb = await db.query('SELECT id, email FROM users');
    const resourcesDb = await db.query('SELECT id, name FROM resources');

    const userMap = Object.fromEntries(usersDb.rows.map((row) => [row.email, row.id]));
    const resourceMap = Object.fromEntries(resourcesDb.rows.map((row) => [row.name, row.id]));

    const assets = [
      {
        asset_name: 'Projector X100',
        category: 'Electronics',
        serial_number: 'SN-001',
        condition: 'Available',
        assigned_resource_id: resourceMap['Room 101'],
      },
      {
        asset_name: '3D Printer',
        category: 'Equipment',
        serial_number: 'SN-002',
        condition: 'Assigned',
        assigned_resource_id: resourceMap['Lab A'],
      },
      {
        asset_name: 'Sound System',
        category: 'Electronics',
        serial_number: 'SN-003',
        condition: 'Damaged',
        assigned_resource_id: resourceMap['Seminar Hall 1'],
      },
    ];

    for (const asset of assets) {
      await db.query(
        `INSERT INTO assets (asset_name, category, serial_number, condition, assigned_resource_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (serial_number) DO NOTHING`,
        [
          asset.asset_name,
          asset.category,
          asset.serial_number,
          asset.condition,
          asset.assigned_resource_id,
        ]
      );
    }

    const bookings = [
      {
        user_email: 'faculty1@rms.com',
        resource_name: 'Room 101',
        booking_date: '2026-07-01',
        start_time: '09:00',
        end_time: '11:00',
        status: 'Approved',
      },
      {
        user_email: 'student1@rms.com',
        resource_name: 'Lab A',
        booking_date: '2026-07-02',
        start_time: '14:00',
        end_time: '16:00',
        status: 'Pending',
      },
    ];

    for (const booking of bookings) {
      await db.query(
        `INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          userMap[booking.user_email],
          resourceMap[booking.resource_name],
          booking.booking_date,
          booking.start_time,
          booking.end_time,
          booking.status,
        ]
      );
    }

    const assetsDb = await db.query('SELECT id, serial_number FROM assets');
    const assetMap = Object.fromEntries(assetsDb.rows.map((row) => [row.serial_number, row.id]));

    const maintenanceRequests = [
      {
        asset_serial: 'SN-003',
        reported_by_email: 'maintenance1@rms.com',
        issue: 'Sound system not powering on',
        status: 'Open',
      },
      {
        asset_serial: 'SN-002',
        reported_by_email: 'faculty1@rms.com',
        issue: '3D printer filament feed jammed',
        status: 'In Progress',
      },
    ];

    for (const request of maintenanceRequests) {
      await db.query(
        `INSERT INTO maintenance_requests (asset_id, reported_by, issue, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [
          assetMap[request.asset_serial],
          userMap[request.reported_by_email],
          request.issue,
          request.status,
        ]
      );
    }

    await db.query('COMMIT');
    console.log('PostgreSQL sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed data error:', error);
    await db.query('ROLLBACK');
    process.exit(1);
  }
};

seedData();
