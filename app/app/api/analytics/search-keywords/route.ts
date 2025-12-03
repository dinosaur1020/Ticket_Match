import { NextRequest, NextResponse } from 'next/server';
import { getUserActivityCollection } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const collection = await getUserActivityCollection();

    // MongoDB aggregation pipeline for popular search keywords
    const results = await collection
      .aggregate([
        { $match: { action: 'search' } },
        { $group: { _id: '$keyword', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            keyword: '$_id',
            search_count: '$count',
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      title: '熱門搜尋關鍵字',
      data: results,
    });

  } catch (error) {
    console.error('Search keywords analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search keyword data' },
      { status: 500 }
    );
  }
}

