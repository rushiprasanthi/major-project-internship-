import db from '../config/db.js';

export async function getSummary(req, res, next) {
  try {
    const totalResourcesQuery = db.query('SELECT COUNT(*) AS total_resources FROM resources', []);
    const activeBookingsQuery = db.query("SELECT COUNT(*) AS active_bookings FROM bookings WHERE status = 'Approved'", []);
    const pendingApprovalsQuery = db.query("SELECT COUNT(*) AS pending_approvals FROM bookings WHERE status = 'Pending'", []);
    const totalAssetsQuery = db.query('SELECT COUNT(*) AS total_assets FROM assets', []);
    const openTicketsQuery = db.query("SELECT COUNT(*) AS open_tickets FROM maintenance_requests WHERE status != 'Resolved'", []);

    const [totalResourcesResult, activeBookingsResult, pendingApprovalsResult, totalAssetsResult, openTicketsResult] = await Promise.all([
      totalResourcesQuery,
      activeBookingsQuery,
      pendingApprovalsQuery,
      totalAssetsQuery,
      openTicketsQuery,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: {
        totalResources: Number(totalResourcesResult.rows[0].total_resources),
        activeBookings: Number(activeBookingsResult.rows[0].active_bookings),
        pendingApprovals: Number(pendingApprovalsResult.rows[0].pending_approvals),
        totalAssets: Number(totalAssetsResult.rows[0].total_assets),
        openTickets: Number(openTicketsResult.rows[0].open_tickets),
      },
    });
  } catch (error) {
    console.error('Dashboard getSummary error:', error);
    return next(error);
  }
}
