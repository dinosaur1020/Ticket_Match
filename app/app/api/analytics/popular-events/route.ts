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
        COUNT(l.listing_id) AS listing_count
       FROM event e
       LEFT JOIN listing l ON e.event_id = l.event_id
       GROUP BY e.event_id
       ORDER BY listing_count DESC, e.event_name
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({
      title: 'Popular Events by Listing Count',
      data: result.rows.map(row => ({
        ...row,
        listing_count: parseInt(row.listing_count),
      })),
    });

  } catch (error) {
    console.error('Popular events analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular events' },
      { status: 500 }
    );
  }
}

