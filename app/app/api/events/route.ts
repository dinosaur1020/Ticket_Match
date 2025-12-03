import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logUserActivity } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Log search activity to MongoDB
    const session = await getSession();
    if (search && session.isLoggedIn) {
      await logUserActivity({
        user_id: session.user_id,
        action: 'search',
        keyword: search,
      });
    }

    let sql = `
      SELECT 
        e.event_id,
        e.event_name,
        e.venue,
        e.description,
        COUNT(DISTINCT et.eventtime_id) as session_count,
        MIN(et.start_time) as earliest_date,
        MAX(et.start_time) as latest_date,
        array_agg(DISTINCT ep.performer) as performers
      FROM event e
      LEFT JOIN eventtime et ON e.event_id = et.event_id
      LEFT JOIN event_performer ep ON e.event_id = ep.event_id
    `;

    const params: any[] = [];
    if (search) {
      sql += ` WHERE e.event_name ILIKE $1 OR e.venue ILIKE $1 OR ep.performer ILIKE $1`;
      params.push(`%${search}%`);
    }

    sql += `
      GROUP BY e.event_id
      ORDER BY e.event_id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM event e`;
    const countParams: any[] = [];
    if (search) {
      countSql += ` LEFT JOIN event_performer ep ON e.event_id = ep.event_id WHERE e.event_name ILIKE $1 OR e.venue ILIKE $1 OR ep.performer ILIKE $1`;
      countParams.push(`%${search}%`);
    }
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      events: result.rows.map(row => ({
        ...row,
        performers: row.performers.filter((p: string | null) => p !== null),
      })),
      pagination: {
        limit,
        offset,
        count: result.rows.length,
        total,
      },
    });

  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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

    // Check if user has BusinessOperator role
    if (!session.roles.includes('BusinessOperator') && !session.roles.includes('Admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only business operators can create events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { event_name, venue, description } = body;

    if (!event_name || !venue) {
      return NextResponse.json(
        { error: 'Event name and venue are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO event (event_name, venue, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [event_name, venue, description || null]
    );

    return NextResponse.json({
      message: 'Event created successfully',
      event: result.rows[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

