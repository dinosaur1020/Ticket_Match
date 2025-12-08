import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole('Operator');

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.status,
        u.balance,
        u.user_description,
        u.created_at,
        COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
        COUNT(DISTINCT t.ticket_id) as ticket_count,
        COUNT(DISTINCT l.listing_id) as listing_count,
        COUNT(DISTINCT tr.trade_id) as trade_count
      FROM "USER" u
      LEFT JOIN user_role ur ON u.user_id = ur.user_id
      LEFT JOIN ticket t ON u.user_id = t.owner_id AND t.status = 'Active'
      LEFT JOIN listing l ON u.user_id = l.user_id
      LEFT JOIN trade_participant tp ON u.user_id = tp.user_id
      LEFT JOIN trade tr ON tp.trade_id = tr.trade_id
    `;

    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status) {
      conditions.push(`u.status = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(u.username ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += `
      GROUP BY u.user_id, u.username, u.email, u.status, u.balance, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count for pagination
    let countSql = `SELECT COUNT(DISTINCT u.user_id) as total FROM "USER" u`;
    const countParams: any[] = [];
    const countConditions: string[] = [];

    if (status) {
      countConditions.push(`u.status = $${countParams.length + 1}`);
      countParams.push(status);
    }

    if (search) {
      countConditions.push(`(u.username ILIKE $${countParams.length + 1} OR u.email ILIKE $${countParams.length + 1})`);
      countParams.push(`%${search}%`);
    }

    if (countConditions.length > 0) {
      countSql += ` WHERE ${countConditions.join(' AND ')}`;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      users: result.rows.map(row => ({
        ...row,
        ticket_count: parseInt(row.ticket_count),
        listing_count: parseInt(row.listing_count),
        trade_count: parseInt(row.trade_count),
      })),
      pagination: {
        limit,
        offset,
        count: result.rows.length,
        total,
      },
    });

  } catch (error: any) {
    console.error('Get all users error:', error);
    
    if (error.message.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

