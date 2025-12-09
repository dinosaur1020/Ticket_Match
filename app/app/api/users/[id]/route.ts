import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/users/[id] - Get public profile of any user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
        u.user_id, 
        u.username, 
        u.status, 
        u.user_description,
        u.created_at,
        COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
        COUNT(DISTINCT CASE WHEN l.status = 'Active' THEN l.listing_id END) as active_listings_count,
        COUNT(DISTINCT CASE WHEN l.status = 'Completed' THEN l.listing_id END) as completed_listings_count,
        COUNT(DISTINCT t.ticket_id) as active_tickets_count,
        COUNT(DISTINCT tp.trade_id) as trade_count
       FROM "USER" u
       LEFT JOIN user_role ur ON u.user_id = ur.user_id
       LEFT JOIN listing l ON u.user_id = l.user_id
       LEFT JOIN ticket t ON u.user_id = t.owner_id AND t.status = 'Active'
       LEFT JOIN trade_participant tp ON u.user_id = tp.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id, u.username, u.status, u.user_description, u.created_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Return public profile (no email, no balance for privacy)
    return NextResponse.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        status: user.status,
        user_description: user.user_description,
        created_at: user.created_at,
        roles: user.roles,
        stats: {
          active_listings: parseInt(user.active_listings_count),
          completed_listings: parseInt(user.completed_listings_count),
          active_tickets: parseInt(user.active_tickets_count),
          total_trades: parseInt(user.trade_count),
        },
      },
    });

  } catch (error: any) {
    console.error('Get user profile error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}


