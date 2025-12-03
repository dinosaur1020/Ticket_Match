import { NextRequest, NextResponse } from 'next/server';
import { getBrowsingTrends } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : undefined;

    const rawResults = await getBrowsingTrends(days);

    // Transform results into a more usable format
    const data = rawResults.map(item => {
      const date = item._id;
      let event_views = 0;
      let listing_views = 0;

      item.views.forEach((view: any) => {
        if (view.action === 'view_event') {
          event_views = view.count;
        } else if (view.action === 'view_listing') {
          listing_views = view.count;
        }
      });

      return {
        date,
        event_views,
        listing_views,
        total_views: event_views + listing_views,
      };
    });

    return NextResponse.json({
      title: '瀏覽趨勢分析',
      period: days ? `最近 ${days} 天` : '全部時間',
      data,
    });

  } catch (error) {
    console.error('Browsing trends analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch browsing trends' },
      { status: 500 }
    );
  }
}

