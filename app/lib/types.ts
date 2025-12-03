// Database Types
export interface User {
  user_id: number;
  username: string;
  password_hash: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Warning';
  balance: number;
  created_at: Date;
}

export interface UserRole {
  user_id: number;
  role: string;
}

export interface Event {
  event_id: number;
  event_name: string;
  venue: string;
  description?: string;
}

export interface EventTime {
  eventtime_id: number;
  event_id: number;
  start_time: Date;
  end_time?: Date;
}

export interface EventPerformer {
  event_id: number;
  performer: string;
}

export interface Ticket {
  ticket_id: number;
  eventtime_id: number;
  owner_id: number;
  seat_area: string;
  seat_number: string;
  price: number;
  status: 'Active' | 'Locked' | 'Completed' | 'Expired' | 'Canceled';
  created_at: Date;
}

export interface Listing {
  listing_id: number;
  user_id: number;
  event_id: number;
  event_date: Date;
  content?: string;
  status: 'Active' | 'Canceled' | 'Completed' | 'Expired';
  type: 'Sell' | 'Buy' | 'Exchange';
  offered_ticket_ids?: number[];
  created_at: Date;
}

export interface Trade {
  trade_id: number;
  listing_id: number;
  status: 'Pending' | 'Completed' | 'Canceled' | 'Disputed' | 'Expired';
  agreed_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface TradeParticipant {
  trade_id: number;
  user_id: number;
  role: 'buyer' | 'seller' | 'exchanger';
  confirmed: boolean;
  confirmed_at?: Date;
}

export interface TradeTicket {
  trade_id: number;
  ticket_id: number;
  from_user_id: number;
  to_user_id: number;
}

export interface UserBalanceLog {
  log_id: number;
  user_id: number;
  trade_id?: number;
  change: number;
  reason: string;
  created_at: Date;
}

// Extended types for joined queries
export interface TicketWithEvent extends Ticket {
  event_name: string;
  venue: string;
  start_time: Date;
  end_time?: Date;
}

export interface ListingWithEvent extends Listing {
  event_name: string;
  venue: string;
  username: string;
  offered_tickets?: TicketWithEvent[];
}

export interface TradeWithDetails extends Trade {
  listing_type: string;
  event_name: string;
  participants: TradeParticipant[];
  tickets: TradeTicket[];
}

// MongoDB User Activity Types
export interface UserActivity {
  user_id?: number;
  action: 'search' | 'click' | 'view_event' | 'view_listing';
  keyword?: string;
  listing_id?: number;
  event_id?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface BrowsingHistory {
  user_id: number;
  action: 'view_event' | 'view_listing';
  event_id?: number;
  listing_id?: number;
  timestamp: Date;
  // Extended info from joins
  event_name?: string;
  venue?: string;
  listing_type?: string;
}

export interface BrowsingTrendData {
  date: string;
  event_views: number;
  listing_views: number;
  total_views: number;
}

export interface PopularContentData {
  content_id: number;
  content_type: 'event' | 'listing';
  view_count: number;
  unique_users: number;
  // Extended info
  name?: string;
  venue?: string;
  listing_type?: string;
}

