import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!session.roles.includes('BusinessOperator') && !session.roles.includes('Admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only business operators can add performers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { event_id, performer } = body;

    if (!event_id || !performer) {
      return NextResponse.json(
        { error: 'Event ID and performer name are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO event_performer (event_id, performer)
       VALUES ($1, $2)
       RETURNING *`,
      [event_id, performer]
    );

    return NextResponse.json({
      message: 'Performer added successfully',
      performer: result.rows[0],
    }, { status: 201 });

  } catch (error: any) {
    console.error('Add performer error:', error);
    
    // Check for unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Performer already added to this event' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add performer' },
      { status: 500 }
    );
  }
}

