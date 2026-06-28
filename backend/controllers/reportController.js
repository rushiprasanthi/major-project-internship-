import db from '../config/db.js';

export async function getOverview(req, res, next) {
  try {
    const bookingsByStatusQuery = db.query('SELECT status, COUNT(*) AS count FROM bookings GROUP BY status', []);
    const assetsByConditionQuery = db.query('SELECT condition, COUNT(*) AS count FROM assets GROUP BY condition', []);
    const maintenanceByStatusQuery = db.query('SELECT status, COUNT(*) AS count FROM maintenance_requests GROUP BY status', []);
    const resourceUtilizationQuery = db.query(
      `SELECT r.name AS resource_name, COUNT(b.id) AS booking_count
       FROM resources r
       LEFT JOIN bookings b ON b.resource_id = r.id
       GROUP BY r.name
       ORDER BY booking_count DESC`,
      []
    );

    const [bookingsByStatusResult, assetsByConditionResult, maintenanceByStatusResult, resourceUtilizationResult] = await Promise.all([
      bookingsByStatusQuery,
      assetsByConditionQuery,
      maintenanceByStatusQuery,
      resourceUtilizationQuery,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Reports overview retrieved successfully',
      data: {
        bookingsByStatus: bookingsByStatusResult.rows,
        assetsByCondition: assetsByConditionResult.rows,
        maintenanceByStatus: maintenanceByStatusResult.rows,
        resourceUtilization: resourceUtilizationResult.rows,
      },
    });
  } catch (error) {
    console.error('Reports getOverview error:', error);
    return next(error);
  }
}
