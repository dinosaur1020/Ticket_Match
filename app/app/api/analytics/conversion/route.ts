import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await query(
      `SELECT 
        e.event_id,
        e.event_name,
        e.venue,
        COUNT(*) FILTER (WHERE l.status = 'Active') AS active_listings,
        COUNT(*) FILTER (WHERE l.status = 'Completed') AS completed_listings,
        COUNT(*) FILTER (WHERE l.status = 'Canceled') AS canceled_listings,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(*) FILTER (WHERE l.status = 'Completed')::NUMERIC / COUNT(*)) * 100, 2)
          ELSE 0
        END AS conversion_rate
       FROM event e
       LEFT JOIN listing l ON e.event_id = l.event_id
       GROUP BY e.event_id
       HAVING COUNT(l.listing_id) > 0
       ORDER BY conversion_rate DESC, completed_listings DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({
      title: 'Event Listing Conversion Rates',
      data: result.rows.map(row => ({
        ...row,
        active_listings: parseInt(row.active_listings),
        completed_listings: parseInt(row.completed_listings),
        canceled_listings: parseInt(row.canceled_listings),
        conversion_rate: parseFloat(row.conversion_rate),
      })),
    });

  } catch (error) {
    console.error('Conversion analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion data' },
      { status: 500 }
    );
  }
}

