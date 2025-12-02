import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await query(
      `SELECT 
        u.user_id,
        u.username,
        u.email,
        SUM(ubl.change) AS total_income
       FROM user_balance_log ubl
       JOIN "USER" u ON ubl.user_id = u.user_id
       WHERE ubl.change > 0
       GROUP BY u.user_id
       ORDER BY total_income DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({
      title: 'Top Users by Income',
      data: result.rows.map(row => ({
        ...row,
        total_income: parseFloat(row.total_income),
      })),
    });

  } catch (error) {
    console.error('User income analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user income data' },
      { status: 500 }
    );
  }
}

