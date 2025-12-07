import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole('Operator');

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        l.*,
        u.username,
        u.email,
        e.event_name,
        e.venue,
        (SELECT COUNT(*) FROM trade WHERE listing_id = l.listing_id) as trade_count
      FROM listing l
      JOIN "USER" u ON l.user_id = u.user_id
      JOIN event e ON l.event_id = e.event_id
    `;

    const params: any[] = [];
    
    if (status) {
      sql += ` WHERE l.status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM listing l`;
    const countParams: any[] = [];
    
    if (status) {
      countSql += ` WHERE l.status = $1`;
      countParams.push(status);
    }
    
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      listings: result.rows,
      pagination: {
        limit,
        offset,
        count: result.rows.length,
        total,
      },
    });

  } catch (error: any) {
    console.error('Get all listings error:', error);
    
    if (error.message.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

