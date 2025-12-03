import { NextRequest, NextResponse } from 'next/server';
import { getPopularContent } from '@/lib/mongodb';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'both'; // 'event', 'listing', or 'both'

    const results: any = {
      title: '熱門內容排行',
      events: [],
      listings: [],
    };

    // Fetch popular events
    if (type === 'event' || type === 'both') {
      const popularEvents = await getPopularContent('event', limit);
      
      if (popularEvents.length > 0) {
        const eventIds = popularEvents.map(e => e.content_id);
        const eventDetails = await query(
          `SELECT event_id, event_name, venue 
           FROM event 
           WHERE event_id = ANY($1)`,
          [eventIds]
        );

        const eventMap = new Map(
          eventDetails.rows.map(e => [e.event_id, e])
        );

        results.events = popularEvents.map(item => ({
          event_id: item.content_id,
          event_name: eventMap.get(item.content_id)?.event_name || 'Unknown',
          venue: eventMap.get(item.content_id)?.venue || '',
          view_count: item.view_count,
          unique_users: item.unique_users,
        }));
      }
    }

    // Fetch popular listings
    if (type === 'listing' || type === 'both') {
      const popularListings = await getPopularContent('listing', limit);
      
      if (popularListings.length > 0) {
        const listingIds = popularListings.map(l => l.content_id);
        const listingDetails = await query(
          `SELECT l.listing_id, l.type, e.event_name, e.venue
           FROM listing l
           JOIN event e ON l.event_id = e.event_id
           WHERE l.listing_id = ANY($1)`,
          [listingIds]
        );

        const listingMap = new Map(
          listingDetails.rows.map(l => [l.listing_id, l])
        );

        results.listings = popularListings.map(item => ({
          listing_id: item.content_id,
          event_name: listingMap.get(item.content_id)?.event_name || 'Unknown',
          venue: listingMap.get(item.content_id)?.venue || '',
          listing_type: listingMap.get(item.content_id)?.type || '',
          view_count: item.view_count,
          unique_users: item.unique_users,
        }));
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Popular views analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular views' },
      { status: 500 }
    );
  }
}

