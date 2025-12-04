"""
Ticket Match 核心資料生成器
負責生成所有假資料並確保參考完整性
"""

import psycopg2
from faker import Faker
from taiwan_music_data import *
import uuid
from datetime import datetime, timedelta
import random


class TicketMatchDataGenerator:
    def __init__(self, scale_factor=1.0):
        self.fake = Faker('zh_TW')
        Faker.seed(42)  # 確保重現性

        self.scale = scale_factor
        self.users = []
        self.events = []
        self.eventtimes = []
        self.tickets = []
        self.listings = []
        self.trades = []
        self.trade_participants = []
        self.trade_tickets = []
        self.balance_logs = []

        # 用於追蹤ID
        self.next_ids = {
            'event_id': 1,
            'eventtime_id': 1,
            'ticket_id': 1,
            'listing_id': 1,
            'trade_id': 1,
            'log_id': 1
        }

    def generate_users(self, count=3000):
        """生成用戶資料"""
        print(f"   👥 生成 {count} 個用戶...")
        users = []

        # 先建立測試帳號
        test_users = [
            {'username': 'alice', 'email': 'alice@example.com', 'balance': 25000, 'role': 'User'},
            {'username': 'bob', 'email': 'bob@example.com', 'balance': 30000, 'role': 'User'},
            {'username': 'charlie', 'email': 'charlie@example.com', 'balance': 20000, 'role': 'User'},
            {'username': 'david', 'email': 'david@example.com', 'balance': 45000, 'role': 'User'},
            {'username': 'emma', 'email': 'emma@example.com', 'balance': 35000, 'role': 'User'},
            {'username': 'frank', 'email': 'frank@example.com', 'balance': 28000, 'role': 'User'},
            {'username': 'operator', 'email': 'operator@example.com', 'balance': 100000, 'role': 'Operator'},
            {'username': 'admin', 'email': 'admin@example.com', 'balance': 100000, 'role': 'Operator'}
        ]

        # 建立測試帳號
        for test_user in test_users:
            user = {
                'user_id': str(uuid.uuid4()),
                'username': test_user['username'],
                'password_hash': '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.',  # password123
                'email': test_user['email'],
                'status': 'Active',
                'balance': test_user['balance'],
                'created_at': self.fake.date_time_this_year()
            }
            users.append(user)

        # 生成剩餘的隨機用戶
        remaining_count = count - len(test_users)
        for i in range(remaining_count):
            username = self.fake.user_name()
            # 確保用戶名唯一
            while any(u['username'] == username for u in users):
                username = self.fake.user_name()

            # 確保email唯一
            email = self.fake.email()
            while any(u['email'] == email for u in users):
                email = self.fake.email()

            user = {
                'user_id': str(uuid.uuid4()),
                'username': username,
                'password_hash': '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.',
                'email': email,
                'status': random.choices(['Active', 'Suspended', 'Warning'], weights=[95, 4, 1])[0],
                'balance': self.fake.random_int(1000, 50000),
                'created_at': self.fake.date_time_this_year()
            }
            users.append(user)

        self.users = users
        # Generate user roles
        self.user_roles = self.generate_user_roles(users)
        return users

    def generate_user_roles(self, users):
        """生成用戶角色資料"""
        print("   👤 生成用戶角色...")
        user_roles = []

        # 測試帳號角色對應
        test_user_roles = {
            'alice': 'User',
            'bob': 'User',
            'charlie': 'User',
            'david': 'User',
            'emma': 'User',
            'frank': 'User',
            'operator': 'Operator',
            'admin': 'Operator'
        }

        for user in users:
            # 測試帳號使用預設角色
            if user['username'] in test_user_roles:
                role = test_user_roles[user['username']]
            else:
                # 一般用戶：95% User, 5% Operator
                role = random.choices(['User', 'Operator'], weights=[95, 5])[0]

            user_roles.append({
                'user_id': user['user_id'],
                'role': role
            })

        return user_roles

    def generate_events_and_times(self, event_count=300, sessions_per_event=4):
        """生成活動和場次"""
        print(f"   🎪 生成 {event_count} 個活動和 {event_count * sessions_per_event} 個場次...")
        events = []
        eventtimes = []

        for i in range(event_count):
            artist = self.fake.random_element(TAIWAN_ARTISTS)
            venue = self.fake.random_element(VENUES)

            # 根據藝人知名度調整票價倍率
            artist_multiplier = ARTIST_PRICE_MULTIPLIER[artist['popularity']]
            venue_multiplier = VENUE_PRICE_MULTIPLIER[venue['type']]
            base_multiplier = artist_multiplier * venue_multiplier

            event = {
                'event_id': self.next_ids['event_id'],
                'event_name': f"{artist['name']} {self.fake.random_element(EVENT_TYPES)}",
                'venue': venue['name'],
                'description': self._generate_event_description(artist, venue),
                'artist_popularity': artist['popularity'],
                'venue_capacity': venue['capacity'],
                'price_multiplier': base_multiplier
            }
            events.append(event)
            self.next_ids['event_id'] += 1

            # 生成多個場次
            for j in range(sessions_per_event):
                start_time = self.fake.date_time_between(
                    start_date='+30d', end_date='+180d'
                )

                # 確保不同場次時間不衝突
                while any(et['event_id'] == event['event_id'] and
                         abs((et['start_time'] - start_time).days) < 1
                         for et in eventtimes):
                    start_time = self.fake.date_time_between(
                        start_date='+30d', end_date='+180d'
                    )

                eventtime = {
                    'eventtime_id': self.next_ids['eventtime_id'],
                    'event_id': event['event_id'],
                    'start_time': start_time,
                    'end_time': start_time + timedelta(hours=self.fake.random_element([2.5, 3, 3.5, 4])),
                    'venue': venue['name']
                }
                eventtimes.append(eventtime)
                self.next_ids['eventtime_id'] += 1

        self.events = events
        self.eventtimes = eventtimes
        return events, eventtimes

    def _generate_event_description(self, artist, venue):
        """生成活動描述"""
        templates = [
            f"{artist['name']}帶來精彩演出，千萬別錯過！",
            f"{artist['name']}最新專輯歌曲全收錄，經典金曲一次聽個夠！",
            f"{artist['name']}在{venue['city']}的精彩演出，期待您的蒞臨！",
            f"{artist['name']}巡迴演唱會{venue['city']}站，帶你重溫經典時刻！",
            f"聽{artist['name']}唱歌，感受音樂的魔力！",
        ]
        return self.fake.random_element(templates)

    def generate_tickets(self, ticket_count=10000):
        """生成票券資料"""
        print(f"   🎫 生成 {ticket_count} 張票券...")
        tickets = []

        # Pre-calculate available seats per eventtime (limit to reasonable numbers)
        eventtime_seats = {}
        for et in self.eventtimes:
            venue = next(v for v in VENUES if v['name'] == et['venue'])
            max_seats = min(venue['capacity'], 300)  # Reduced to make it more manageable
            eventtime_seats[et['eventtime_id']] = max_seats

        total_available_seats = sum(eventtime_seats.values())

        # Adjust ticket count if necessary
        if ticket_count > total_available_seats:
            print(f"⚠️  調整票券數量: {ticket_count} → {total_available_seats} (基於可用座位)")
            ticket_count = total_available_seats

        # Track used seats: eventtime_id -> set of (seat_area, seat_number)
        used_seats = {et_id: set() for et_id in eventtime_seats.keys()}

        for i in range(ticket_count):
            # Find eventtimes that still have available seats
            available_eventtimes = [et for et in self.eventtimes
                                  if len(used_seats[et['eventtime_id']]) < eventtime_seats[et['eventtime_id']]]

            if not available_eventtimes:
                print(f"⚠️  警告: 無法為票券 {i+1} 生成唯一座位，跳過")
                continue

            # Select random eventtime
            eventtime = self.fake.random_element(available_eventtimes)
            eventtime_id = eventtime['eventtime_id']

            # Find corresponding event and venue
            event = next(e for e in self.events if e['event_id'] == eventtime['event_id'])
            venue = next(v for v in VENUES if v['name'] == eventtime['venue'])

            # Generate unique seat
            while True:
                # Determine seat area based on venue capacity
                if venue['capacity'] > 10000:  # Large venue
                    seat_area = self.fake.random_element(['A區', 'B區', 'C區', 'VIP區'])
                elif venue['capacity'] > 5000:  # Medium venue
                    seat_area = self.fake.random_element(['A區', 'B區', 'C區'])
                else:  # Small venue
                    seat_area = self.fake.random_element(['A區', 'B區', '一般區'])

                seat_number = self.fake.random_int(min=1, max=150)  # Reasonable seat numbers

                seat_key = (seat_area, seat_number)
                if seat_key not in used_seats[eventtime_id]:
                    used_seats[eventtime_id].add(seat_key)
                    break

            # Select random owner
            owner = self.fake.random_element(self.users)

            ticket_id = self.next_ids['ticket_id']
            # Select random price from available ranges
            price = self.fake.random_int(min=1200, max=12000)
            status = self.fake.random_element(['Active', 'Locked', 'Completed', 'Expired', 'Canceled'])
            created_at = self.fake.date_time_between(start_date='-1y', end_date='now')

            tickets.append({
                'ticket_id': ticket_id,
                'eventtime_id': eventtime_id,
                'owner_id': owner['user_id'],
                'price': price,
                'seat_area': seat_area,
                'seat_number': seat_number,
                'status': status,
                'created_at': created_at
            })
            self.next_ids['ticket_id'] += 1

        self.tickets = tickets
        print(f"   ✅ {len(self.tickets)} 張票券生成完畢。")

    def _generate_seat_number(self, area, venue_capacity):
        """生成座位號碼"""
        if venue_capacity > 10000:
            # 大場地：區-排-號格式
            row = self.fake.random_int(1, 50)
            seat = self.fake.random_int(1, 30)
            return "02d"
        elif venue_capacity > 2000:
            # 中場地：區排號格式
            row = self.fake.random_int(1, 30)
            seat = self.fake.random_int(1, 20)
            return "02d"
        else:
            # 小場地：簡單編號
            return str(self.fake.random_int(1, venue_capacity // 10))

    def generate_listings(self, listing_count=12000):
        """生成貼文資料 - 基於用戶實際票券持有情況"""
        print(f"   📝 生成 {listing_count} 個貼文...")
        listings = []

        # 建立完整的票券索引
        ticket_index = {}
        for ticket in self.tickets:
            owner_id = ticket['owner_id']
            if owner_id not in ticket_index:
                ticket_index[owner_id] = []
            ticket_index[owner_id].append(ticket)

        # 統計用戶票券持有情況
        user_ticket_inventory = {}
        for user in self.users:
            user_id = user['user_id']
            user_tickets = ticket_index.get(user_id, [])
            user_ticket_inventory[user_id] = user_tickets

        # 分類用戶
        users_with_tickets = [(uid, tickets) for uid, tickets in user_ticket_inventory.items() if len(tickets) > 0]
        users_without_tickets = [(uid, tickets) for uid, tickets in user_ticket_inventory.items() if len(tickets) == 0]

        print(f"   👥 用戶分類: {len(users_with_tickets)}人有票券, {len(users_without_tickets)}人無票券")

        # 創建貼文生成計劃，確保Sell和Exchange有對應票券
        listing_plans = []

        # 1. 分配Sell貼文 (20%) - 只給有票券的用戶
        sell_target = int(listing_count * 0.2)
        sell_assigned = 0
        for uid, user_tickets in users_with_tickets:
            if sell_assigned >= sell_target:
                break
            # 每個有票券的用戶可以發出最多3個Sell貼文
            user_sell_count = min(3, len(user_tickets))
            for _ in range(user_sell_count):
                if sell_assigned >= sell_target:
                    break
                listing_plans.append({
                    'user_id': uid,
                    'type': 'Sell',
                    'available_tickets': user_tickets
                })
                sell_assigned += 1

        # 2. 分配Exchange貼文 (10%) - 只給有票券的用戶
        exchange_target = int(listing_count * 0.1)
        exchange_assigned = 0
        for uid, user_tickets in users_with_tickets:
            if exchange_assigned >= exchange_target:
                break
            # 每個有票券的用戶可以發出最多2個Exchange貼文
            user_exchange_count = min(2, len(user_tickets))
            for _ in range(user_exchange_count):
                if exchange_assigned >= exchange_target:
                    break
                listing_plans.append({
                    'user_id': uid,
                    'type': 'Exchange',
                    'available_tickets': user_tickets
                })
                exchange_assigned += 1

        # 3. 剩下的都是Buy貼文 (70%)
        buy_target = listing_count - len(listing_plans)
        for i in range(buy_target):
            # Buy貼文可以由任何用戶發出
            user_id = self.users[i % len(self.users)]['user_id']
            listing_plans.append({
                'user_id': user_id,
                'type': 'Buy',
                'available_tickets': user_ticket_inventory.get(user_id, [])
            })

        print(f"   🎯 最終分配: Sell {sell_assigned}, Exchange {exchange_assigned}, Buy {buy_target}")

        # 根據計劃生成實際貼文
        for plan in listing_plans:
            user_id = plan['user_id']
            listing_type = plan['type']
            available_tickets = plan['available_tickets']

            # 選擇活動
            if listing_type in ['Sell', 'Exchange']:
                # 對於Sell和Exchange，使用用戶實際有的票券所屬的活動
                if available_tickets:
                    # 隨機選擇用戶的一張票券，然後找到對應的活動
                    selected_ticket = self.fake.random_element(available_tickets)
                    event_id = next(et['event_id'] for et in self.eventtimes if et['eventtime_id'] == selected_ticket['eventtime_id'])
                    event = next(e for e in self.events if e['event_id'] == event_id)
                    selected_eventtime = next(et for et in self.eventtimes if et['eventtime_id'] == selected_ticket['eventtime_id'])
                else:
                    # 備用方案：隨機選擇活動
                    event = self.fake.random_element(self.events)
                    selected_eventtime = self.fake.random_element([et for et in self.eventtimes if et['event_id'] == event['event_id']])
            else:
                # Buy貼文可以是任何活動
                event = self.fake.random_element(self.events)
                selected_eventtime = self.fake.random_element([et for et in self.eventtimes if et['event_id'] == event['event_id']])

            # 生成貼文內容
            listing = {
                'listing_id': self.next_ids['listing_id'],
                'user_id': user_id,
                'event_id': event['event_id'],
                'event_date': selected_eventtime['start_time'],
                'content': self._generate_listing_content(listing_type, event),
                'status': 'Active',
                'type': listing_type,
                'created_at': self.fake.date_time_this_month()
            }

            # 處理票券關聯
            if listing_type in ['Sell', 'Exchange'] and available_tickets:
                # 找到這個活動的相關票券
                event_tickets = [t for t in available_tickets
                               if any(et['eventtime_id'] == t['eventtime_id']
                                     for et in self.eventtimes if et['event_id'] == event['event_id'])]

                if event_tickets:
                    # 隨機選擇1-3張票券
                    selected_count = min(self.fake.random_int(1, 3), len(event_tickets))
                    selected_tickets = self.fake.random_sample(event_tickets, selected_count)
                    listing['offered_ticket_ids'] = [t['ticket_id'] for t in selected_tickets]
                else:
                    # 如果沒有這個活動的票券，改為Buy貼文
                    listing['type'] = 'Buy'
                    listing['offered_ticket_ids'] = None
            else:
                listing['offered_ticket_ids'] = None

            listings.append(listing)
            self.next_ids['listing_id'] += 1

            # 隨機選擇活動
            event = self.fake.random_element(self.events)

            # 根據活動找到相關場次
            related_eventtimes = [et for et in self.eventtimes
                                if et['event_id'] == event['event_id']]
            if not related_eventtimes:
                continue

            selected_eventtime = self.fake.random_element(related_eventtimes)

            listing = {
                'listing_id': self.next_ids['listing_id'],
                'user_id': user['user_id'],
                'event_id': event['event_id'],
                'event_date': selected_eventtime['start_time'],
                'content': self._generate_listing_content(listing_type, event),
                'status': 'Active',
                'type': listing_type,
                'created_at': self.fake.date_time_this_month()
            }

            # 賣票和交換貼文需要指定提供的票券
            if listing_type in ['Sell', 'Exchange']:
                # 該用戶擁有的票券（只限這個活動）
                user_tickets = ticket_index.get(user['user_id'], [])
                event_tickets = [t for t in user_tickets
                               if any(et['eventtime_id'] == t['eventtime_id']
                                     for et in related_eventtimes)]

                if event_tickets:
                    # 隨機選擇1-3張票券
                    selected_count = min(self.fake.random_int(1, 3), len(event_tickets))
                    selected_tickets = self.fake.random_sample(event_tickets, selected_count)
                    listing['offered_ticket_ids'] = [t['ticket_id'] for t in selected_tickets]
                else:
                    # 理論上不會發生，因為我們檢查了has_tickets
                    listing['type'] = 'Buy'
                    listing['offered_ticket_ids'] = None
            else:
                listing['offered_ticket_ids'] = None

            listings.append(listing)
            self.next_ids['listing_id'] += 1

        self.listings = listings
        return listings

    def _generate_listing_content(self, listing_type, event, area=None, price=None):
        """生成貼文內容"""
        template = self.fake.random_element(LISTING_CONTENT_TEMPLATES[listing_type])

        # 準備格式化參數
        format_params = {'event_name': event['event_name']}

        # 處理area變數
        if '{area}' in template:
            if area:
                format_params['area'] = area
            else:
                format_params['area'] = self.fake.random_element(SEAT_AREAS)

        # 處理price變數
        if '{price}' in template:
            if price:
                format_params['price'] = price
            else:
                # 隨機生成一個合理的價格
                format_params['price'] = self.fake.random_int(1500, 8000)

        return template.format(**format_params)

    def generate_trades_and_related(self, trade_count=3000):
        """生成交易和相關資料"""
        print(f"   🤝 生成 {trade_count} 筆交易...")
        trades = []
        trade_participants = []
        trade_tickets = []
        balance_logs = []

        # 建立索引以便快速查找
        listing_index = {l['listing_id']: l for l in self.listings
                        if l['type'] in ['Sell', 'Exchange']}
        ticket_index = {t['ticket_id']: t for t in self.tickets}

        for i in range(trade_count):
            # 隨機選擇可交易的貼文
            if not listing_index:
                break
            listing = self.fake.random_element(list(listing_index.values()))

            # 決定買家（不能是貼文發佈者）
            seller_id = listing['user_id']
            buyer = self.fake.random_element([
                u for u in self.users if u['user_id'] != seller_id
            ])

            # 決定交易金額
            if listing['type'] == 'Sell' and listing['offered_ticket_ids']:
                # 賣票：使用票券價格
                ticket_ids = listing['offered_ticket_ids']
                ticket_prices = [ticket_index[tid]['price'] for tid in ticket_ids if tid in ticket_index]
                if ticket_prices:
                    base_price = sum(ticket_prices)
                    # 有些議價空間
                    agreed_price = base_price * random.uniform(0.9, 1.1)
                else:
                    agreed_price = self.fake.random_int(2000, 8000)
            else:
                # 交換或其他：隨機金額
                agreed_price = self.fake.random_int(2000, 8000)

            trade = {
                'trade_id': self.next_ids['trade_id'],
                'listing_id': listing['listing_id'],
                'status': 'Completed',
                'agreed_price': round(agreed_price, 2),
                'created_at': self.fake.date_time_this_month(),
                'updated_at': self.fake.date_time_this_month()
            }
            trades.append(trade)

            # 生成參與者
            trade_participants.extend([
                {
                    'trade_id': trade['trade_id'],
                    'user_id': seller_id,
                    'role': 'seller',
                    'confirmed': True,
                    'confirmed_at': trade['created_at']
                },
                {
                    'trade_id': trade['trade_id'],
                    'user_id': buyer['user_id'],
                    'role': 'buyer',
                    'confirmed': True,
                    'confirmed_at': trade['created_at']
                }
            ])

            # 生成交易票券記錄
            if listing['offered_ticket_ids']:
                for ticket_id in listing['offered_ticket_ids']:
                    if ticket_id in ticket_index:
                        trade_tickets.append({
                            'trade_id': trade['trade_id'],
                            'ticket_id': ticket_id,
                            'from_user_id': seller_id,
                            'to_user_id': buyer['user_id']
                        })

            # 生成餘額記錄
            balance_logs.extend([
                {
                    'user_id': seller_id,
                    'trade_id': trade['trade_id'],
                    'change': trade['agreed_price'],
                    'reason': 'TRADE_PAYMENT',
                    'created_at': trade['created_at']
                },
                {
                    'user_id': buyer['user_id'],
                    'trade_id': trade['trade_id'],
                    'change': -trade['agreed_price'],
                    'reason': 'TRADE_PAYMENT',
                    'created_at': trade['created_at']
                }
            ])

            self.next_ids['trade_id'] += 1

        self.trades = trades
        self.trade_participants = trade_participants
        self.trade_tickets = trade_tickets
        self.balance_logs = balance_logs
        return trades, trade_participants, trade_tickets, balance_logs

    def export_to_sql(self, filename='generated-data.sql'):
        """將所有資料匯出為SQL文件"""
        print(f"💾 匯出資料到 {filename}...")

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("-- Generated fake data for Ticket Match\n")
            f.write(f"-- Generated at: {datetime.now()}\n")
            f.write(f"-- Users: {len(self.users)}, Events: {len(self.events)}, Tickets: {len(self.tickets)}\n\n")

            # 寫入所有INSERT語句
            self._write_users_sql(f)
            self._write_user_roles_sql(f)
            self._write_events_sql(f)
            self._write_eventtimes_sql(f)
            self._write_tickets_sql(f)
            self._write_listings_sql(f)
            self._write_trades_sql(f)
            self._write_trade_participants_sql(f)
            self._write_trade_tickets_sql(f)
            self._write_balance_logs_sql(f)

            print(f"✅ 資料匯出完成！共 {len(self.users) + len(self.user_roles) + len(self.events) + len(self.eventtimes) + len(self.tickets) + len(self.listings) + len(self.trades) + len(self.trade_participants) + len(self.trade_tickets) + len(self.balance_logs)} 筆記錄")

    def _write_users_sql(self, f):
        """寫入用戶SQL - 使用批量INSERT"""
        if not self.users:
            return

        f.write("-- Users\n")
        f.write('INSERT INTO "USER" (user_id, username, password_hash, email, status, balance, created_at) VALUES\n')

        for i, user in enumerate(self.users):
            comma = ',' if i < len(self.users) - 1 else ';'
            f.write(f"""('{user['user_id']}', '{user['username']}', '{user['password_hash']}',
        '{user['email']}', '{user['status']}', {user['balance']},
        '{user['created_at'].isoformat()}'){comma}\n""")
        f.write("\n")

    def _write_user_roles_sql(self, f):
        """寫入用戶角色SQL - 使用批量INSERT"""
        if not self.user_roles:
            return

        f.write("-- User Roles\n")
        f.write("INSERT INTO user_role (user_id, role) VALUES\n")

        for i, user_role in enumerate(self.user_roles):
            comma = ',' if i < len(self.user_roles) - 1 else ';'
            f.write(f"""('{user_role['user_id']}', '{user_role['role']}'){comma}\n""")
        f.write("\n")

    def _write_events_sql(self, f):
        """寫入活動SQL - 使用批量INSERT"""
        if not self.events:
            return

        f.write("-- Events\n")
        f.write("INSERT INTO event (event_id, event_name, venue, description) VALUES\n")

        for i, event in enumerate(self.events):
            comma = ',' if i < len(self.events) - 1 else ';'
            f.write(f"""({event['event_id']}, '{event['event_name']}', '{event['venue']}',
        '{event['description']}'){comma}\n""")
        f.write("\n")

    def _write_eventtimes_sql(self, f):
        """寫入活動場次SQL - 使用批量INSERT"""
        if not self.eventtimes:
            return

        f.write("-- EventTimes\n")
        f.write("INSERT INTO eventtime (eventtime_id, event_id, start_time, end_time) VALUES\n")

        for i, eventtime in enumerate(self.eventtimes):
            comma = ',' if i < len(self.eventtimes) - 1 else ';'
            f.write(f"""({eventtime['eventtime_id']}, {eventtime['event_id']},
        '{eventtime['start_time'].isoformat()}',
        '{eventtime['end_time'].isoformat()}'){comma}\n""")
        f.write("\n")

    def _write_tickets_sql(self, f):
        """寫入票券SQL - 使用批量INSERT"""
        if not self.tickets:
            return

        f.write("-- Tickets\n")
        f.write("INSERT INTO ticket (ticket_id, eventtime_id, owner_id, seat_area, seat_number, price, status, created_at) VALUES\n")

        for i, ticket in enumerate(self.tickets):
            comma = ',' if i < len(self.tickets) - 1 else ';'
            f.write(f"""({ticket['ticket_id']}, {ticket['eventtime_id']}, '{ticket['owner_id']}',
        '{ticket['seat_area']}', '{ticket['seat_number']}', {ticket['price']},
        '{ticket['status']}', '{ticket['created_at'].isoformat()}'){comma}\n""")
        f.write("\n")

    def _write_listings_sql(self, f):
        """寫入貼文SQL - 使用批量INSERT"""
        if not self.listings:
            return

        f.write("-- Listings\n")
        f.write("INSERT INTO listing (listing_id, user_id, event_id, event_date, content, status, type, offered_ticket_ids, created_at) VALUES\n")

        for i, listing in enumerate(self.listings):
            comma = ',' if i < len(self.listings) - 1 else ';'
            # Handle offered_ticket_ids array
            offered_ids = listing['offered_ticket_ids']
            if offered_ids:
                offered_str = f"ARRAY{offered_ids}"
            else:
                offered_str = "NULL"

            f.write(f"""({listing['listing_id']}, '{listing['user_id']}', {listing['event_id']},
        '{listing['event_date'].isoformat()}', '{listing['content']}',
        '{listing['status']}', '{listing['type']}',
        {offered_str}, '{listing['created_at'].isoformat()}'){comma}\n""")
        f.write("\n")
        
        # Write LISTING_TICKET junction table entries
        f.write("-- Listing Tickets (Junction Table)\n")
        listing_ticket_entries = []
        for listing in self.listings:
            if listing['offered_ticket_ids']:
                for ticket_id in listing['offered_ticket_ids']:
                    listing_ticket_entries.append((listing['listing_id'], ticket_id))
        
        if listing_ticket_entries:
            f.write("INSERT INTO listing_ticket (listing_id, ticket_id) VALUES\n")
            for i, (listing_id, ticket_id) in enumerate(listing_ticket_entries):
                comma = ',' if i < len(listing_ticket_entries) - 1 else ';'
                f.write(f"({listing_id}, {ticket_id}){comma}\n")
            f.write("\n")

    def _write_trades_sql(self, f):
        """寫入交易SQL - 使用批量INSERT"""
        if not self.trades:
            return

        f.write("-- Trades\n")
        f.write("INSERT INTO trade (trade_id, listing_id, status, agreed_price, created_at, updated_at) VALUES\n")

        for i, trade in enumerate(self.trades):
            comma = ',' if i < len(self.trades) - 1 else ';'
            f.write(f"""({trade['trade_id']}, {trade['listing_id']}, '{trade['status']}',
        {trade['agreed_price']}, '{trade['created_at'].isoformat()}',
        '{trade['updated_at'].isoformat()}'){comma}\n""")
        f.write("\n")

    def _write_trade_participants_sql(self, f):
        """寫入交易參與者SQL - 使用批量INSERT"""
        if not self.trade_participants:
            return

        f.write("-- Trade Participants\n")
        f.write("INSERT INTO trade_participant (trade_id, user_id, role, confirmed, confirmed_at) VALUES\n")

        for i, participant in enumerate(self.trade_participants):
            comma = ',' if i < len(self.trade_participants) - 1 else ';'
            f.write(f"""({participant['trade_id']}, '{participant['user_id']}', '{participant['role']}',
        {participant['confirmed']}, '{participant['confirmed_at'].isoformat()}'){comma}\n""")
        f.write("\n")

    def _write_trade_tickets_sql(self, f):
        """寫入交易票券SQL - 使用批量INSERT"""
        if not self.trade_tickets:
            return

        f.write("-- Trade Tickets\n")
        f.write("INSERT INTO trade_ticket (trade_id, ticket_id, from_user_id, to_user_id) VALUES\n")

        for i, trade_ticket in enumerate(self.trade_tickets):
            comma = ',' if i < len(self.trade_tickets) - 1 else ';'
            f.write(f"""({trade_ticket['trade_id']}, {trade_ticket['ticket_id']},
        '{trade_ticket['from_user_id']}', '{trade_ticket['to_user_id']}'){comma}\n""")
        f.write("\n")

    def _write_balance_logs_sql(self, f):
        """寫入餘額記錄SQL - 使用批量INSERT"""
        # 交易相關的餘額記錄
        if self.balance_logs:
            f.write("-- Trade Balance Logs\n")
            f.write("INSERT INTO user_balance_log (user_id, trade_id, change, reason, created_at) VALUES\n")

            for i, log in enumerate(self.balance_logs):
                trade_id_str = f"{log['trade_id']}" if log['trade_id'] else "NULL"
                comma = ',' if i < len(self.balance_logs) - 1 else ';'
                f.write(f"""('{log['user_id']}', {trade_id_str}, {log['change']}, '{log['reason']}',
        '{log['created_at'].isoformat()}'){comma}\n""")
            f.write("\n")

        # 初始餘額記錄
        if self.users:
            f.write("-- Initial User Balances\n")
            f.write("INSERT INTO user_balance_log (user_id, trade_id, change, reason, created_at) VALUES\n")

            for i, user in enumerate(self.users):
                comma = ',' if i < len(self.users) - 1 else ';'
                f.write(f"""('{user['user_id']}', NULL, {user['balance']}, 'INITIAL_BALANCE',
        '{user['created_at'].isoformat()}'){comma}\n""")
            f.write("\n")

    def validate_data_integrity(self):
        """驗證資料完整性"""
        print("🔍 驗證資料完整性...")

        issues = []

        # 檢查票券參考的eventtime是否存在
        ticket_eventtime_ids = set(t['eventtime_id'] for t in self.tickets)
        existing_eventtime_ids = set(et['eventtime_id'] for et in self.eventtimes)
        if not ticket_eventtime_ids.issubset(existing_eventtime_ids):
            issues.append("有些票券參考不存在的eventtime")

        # 檢查貼文參考的票券是否存在
        for listing in self.listings:
            if listing['offered_ticket_ids']:
                for ticket_id in listing['offered_ticket_ids']:
                    if not any(t['ticket_id'] == ticket_id for t in self.tickets):
                        issues.append(f"貼文 {listing['listing_id']} 參考不存在的票券 {ticket_id}")

        # 檢查交易參考的貼文是否存在
        trade_listing_ids = set(t['listing_id'] for t in self.trades)
        existing_listing_ids = set(l['listing_id'] for l in self.listings)
        if not trade_listing_ids.issubset(existing_listing_ids):
            issues.append("有些交易參考不存在的貼文")

        if issues:
            print("❌ 發現資料完整性問題:")
            for issue in issues:
                print(f"   - {issue}")
            return False
        else:
            print("✅ 資料完整性檢查通過")
            return True
