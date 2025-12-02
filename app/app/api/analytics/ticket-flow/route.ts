import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await query(
      `SELECT 
        tt.from_user_id,
        u1.username AS from_username,
        tt.to_user_id,
        u2.username AS to_username,
        COUNT(*) AS transfer_count
       FROM trade_ticket tt
       JOIN "USER" u1 ON tt.from_user_id = u1.user_id
       JOIN "USER" u2 ON tt.to_user_id = u2.user_id
       GROUP BY tt.from_user_id, u1.username, tt.to_user_id, u2.username
       ORDER BY transfer_count DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({
      title: 'Ticket Transfer Flow Analysis',
      data: result.rows.map(row => ({
        ...row,
        transfer_count: parseInt(row.transfer_count),
      })),
    });

  } catch (error) {
    console.error('Ticket flow analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket flow data' },
      { status: 500 }
    );
  }
}

