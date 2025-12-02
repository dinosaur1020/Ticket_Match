import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const event_id = searchParams.get('event_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'Active';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        l.*,
        u.username,
        e.event_name,
        e.venue
      FROM listing l
      JOIN "USER" u ON l.user_id = u.user_id
      JOIN event e ON l.event_id = e.event_id
      WHERE l.status = $1
    `;

    const params: any[] = [status];
    let paramIndex = 2;

    if (event_id) {
      sql += ` AND l.event_id = $${paramIndex++}`;
      params.push(parseInt(event_id));
    }

    if (type) {
      sql += ` AND l.type = $${paramIndex++}`;
      params.push(type);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return NextResponse.json({
      listings: result.rows,
      pagination: {
        limit,
        offset,
        count: result.rows.length,
      },
    });

  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event_id, event_date, content, type } = body;

    // Validation
    if (!event_id || !event_date || !type) {
      return NextResponse.json(
        { error: 'Event ID, event date, and type are required' },
        { status: 400 }
      );
    }

    if (!['Sell', 'Buy', 'Exchange'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be Sell, Buy, or Exchange' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO listing (user_id, event_id, event_date, content, type, status)
       VALUES ($1, $2, $3, $4, $5, 'Active')
       RETURNING *`,
      [session.user_id, event_id, event_date, content || null, type]
    );

    return NextResponse.json({
      message: 'Listing created successfully',
      listing: result.rows[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

