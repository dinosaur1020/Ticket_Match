import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();

    const result = await query(
      `SELECT 
        t.*,
        l.type as listing_type,
        l.content as listing_content,
        e.event_name,
        tp.role as my_role,
        tp.confirmed as my_confirmed,
        json_agg(
          json_build_object(
            'user_id', tp2.user_id,
            'username', u2.username,
            'role', tp2.role,
            'confirmed', tp2.confirmed
          )
        ) as participants
       FROM trade t
       JOIN trade_participant tp ON t.trade_id = tp.trade_id
       JOIN trade_participant tp2 ON t.trade_id = tp2.trade_id
       JOIN "USER" u2 ON tp2.user_id = u2.user_id
       JOIN listing l ON t.listing_id = l.listing_id
       JOIN event e ON l.event_id = e.event_id
       WHERE tp.user_id = $1
       GROUP BY t.trade_id, l.listing_id, e.event_id, tp.role, tp.confirmed
       ORDER BY t.created_at DESC`,
      [session.user_id]
    );

    return NextResponse.json({
      trades: result.rows.map(row => ({
        ...row,
        agreed_price: parseFloat(row.agreed_price),
      })),
    });

  } catch (error: any) {
    console.error('Get my trades error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

