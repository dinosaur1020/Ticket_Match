import { NextRequest, NextResponse } from 'next/server';
import { getUserBrowsingHistory } from '@/lib/mongodb';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await getUserBrowsingHistory(session.user_id, limit);

    // Separate events and listings
    const eventIds = history
      .filter(h => h.action === 'view_event' && h.event_id)
      .map(h => h.event_id);
    const listingIds = history
      .filter(h => h.action === 'view_listing' && h.listing_id)
      .map(h => h.listing_id);

    // Fetch event details
    const eventDetailsMap = new Map();
    if (eventIds.length > 0) {
      const eventDetails = await query(
        `SELECT event_id, event_name, venue 
         FROM event 
         WHERE event_id = ANY($1)`,
        [eventIds]
      );
      eventDetails.rows.forEach(e => {
        eventDetailsMap.set(e.event_id, e);
      });
    }

    // Fetch listing details
    const listingDetailsMap = new Map();
    if (listingIds.length > 0) {
      const listingDetails = await query(
        `SELECT l.listing_id, l.type, e.event_name, e.venue
         FROM listing l
         JOIN event e ON l.event_id = e.event_id
         WHERE l.listing_id = ANY($1)`,
        [listingIds]
      );
      listingDetails.rows.forEach(l => {
        listingDetailsMap.set(l.listing_id, l);
      });
    }

    // Combine history with details
    const enrichedHistory = history.map(item => {
      const base = {
        action: item.action,
        timestamp: item.timestamp,
      };

      if (item.action === 'view_event' && item.event_id) {
        const eventDetail = eventDetailsMap.get(item.event_id);
        return {
          ...base,
          type: 'event',
          id: item.event_id,
          name: eventDetail?.event_name || 'Unknown Event',
          venue: eventDetail?.venue || '',
        };
      } else if (item.action === 'view_listing' && item.listing_id) {
        const listingDetail = listingDetailsMap.get(item.listing_id);
        return {
          ...base,
          type: 'listing',
          id: item.listing_id,
          name: listingDetail?.event_name || 'Unknown Listing',
          venue: listingDetail?.venue || '',
          listing_type: listingDetail?.type || '',
        };
      }

      return base;
    });

    return NextResponse.json({
      title: '我的瀏覽記錄',
      data: enrichedHistory,
    });

  } catch (error) {
    console.error('User browsing history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch browsing history' },
      { status: 500 }
    );
  }
}

