#!/usr/bin/env python3
"""
Ticket Match 假資料生成器主腳本
生成符合課程要求的假資料，滿足上萬筆資料表的條件

使用方法:
  python generate-fake-data.py --users 3000 --tickets 10000
  python generate-fake-data.py --scale 0.1  # 生成10%規模的測試資料
"""

import argparse
import sys
import os
from datetime import datetime
from data_generator import TicketMatchDataGenerator

def main():
    parser = argparse.ArgumentParser(
        description='生成 Ticket Match 假資料',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  python generate-fake-data.py                           # 預設規模
  python generate-fake-data.py --scale 0.1              # 10%測試規模
  python generate-fake-data.py --users 5000 --tickets 15000  # 自訂規模
  python generate-fake-data.py --output my-data.sql     # 自訂輸出檔案
        """
    )

    parser.add_argument('--users', type=int, default=3000,
                       help='用戶數量 (預設: 3000)')
    parser.add_argument('--events', type=int, default=300,
                       help='活動數量 (預設: 300)')
    parser.add_argument('--tickets', type=int, default=10000,
                       help='票券數量 (預設: 10000) ⭐ 滿足上萬筆要求')
    parser.add_argument('--listings', type=int, default=12000,
                       help='貼文數量 (預設: 12000)')
    parser.add_argument('--trades', type=int, default=3000,
                       help='交易數量 (預設: 3000)')
    parser.add_argument('--scale', type=float, default=1.0,
                       help='整體規模倍率 (預設: 1.0)')
    parser.add_argument('--output', default='generated-data.sql',
                       help='輸出SQL檔案名稱 (預設: generated-data.sql)')
    parser.add_argument('--validate', action='store_true',
                       help='生成後進行資料完整性驗證')
    parser.add_argument('--yes', action='store_true',
                       help='跳過確認提示，直接開始生成')

    args = parser.parse_args()

    # 根據scale調整數量
    users = int(args.users * args.scale)
    events = int(args.events * args.scale)
    tickets = int(args.tickets * args.scale)
    listings = int(args.listings * args.scale)
    trades = int(args.trades * args.scale)

    # 顯示生成計劃
    print("🎯 Ticket Match 假資料生成器")
    print("=" * 50)
    print(f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"規模倍率: {args.scale}")
    print()
    print("📊 將生成的資料規模:")
    print(f"   👥 用戶: {users:,}")
    print(f"   🎪 活動: {events:,}")
    print(f"   🕒 活動場次: {events * 4:,} (每活動平均4場次)")
    print(f"   🎫 票券: {tickets:,} ⭐ 滿足上萬筆要求")
    print(f"   📝 貼文: {listings:,}")
    print(f"   🤝 交易: {trades:,}")
    print(f"   📋 交易參與者: {trades * 2:,}")
    print(f"   💰 餘額記錄: {trades * 2 + users:,} (交易 + 初始餘額)")
    print()
    print(f"💾 輸出檔案: {args.output}")
    print()

    # 估計生成時間
    estimated_time = (users + events + tickets + listings + trades) / 10000 * 2  # 經驗值
    print(f"⏱️  預估生成時間: {estimated_time:.1f} 分鐘")
    print()

    # 確認開始
    if not args.yes:
        try:
            response = input("是否開始生成資料? (y/N): ").strip().lower()
            if response not in ['y', 'yes', '是', '確認']:
                print("❌ 已取消生成")
                sys.exit(0)
        except (KeyboardInterrupt, EOFError):
            print("\n❌ 已取消生成")
            sys.exit(0)

    print("\n🚀 開始生成資料...")
    start_time = datetime.now()

    try:
        # 初始化生成器
        generator = TicketMatchDataGenerator(args.scale)

        # 生成各類資料
        print("📈 生成進度:")

        # 1. 用戶資料
        generator.generate_users(users)

        # 2. 活動和場次
        generator.generate_events_and_times(events)

        # 3. 票券資料
        generator.generate_tickets(tickets)

        # 4. 貼文資料
        generator.generate_listings(listings)

        # 5. 交易資料
        generator.generate_trades_and_related(trades)

        # 6. 資料驗證 (可選)
        if args.validate:
            print("   🔍 驗證資料完整性...")
            if not generator.validate_data_integrity():
                print("❌ 資料完整性檢查失敗，請檢查生成邏輯")
                sys.exit(1)

        # 7. 匯出SQL
        generator.export_to_sql(args.output)

        # 計算生成時間
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print()
        print("🎉 資料生成完成！")
        print("=" * 50)
        print(f"✨ 生成時間: {duration:.1f} 秒")
        print(f"📁 輸出檔案: {args.output}")
        print()
        print("📊 最終資料統計:")
        print(f"   👥 用戶: {len(generator.users):,}")
        print(f"   👤 用戶角色: {len(generator.user_roles):,}")
        print(f"   🎪 活動: {len(generator.events):,}")
        print(f"   🕒 場次: {len(generator.eventtimes):,}")
        print(f"   🎫 票券: {len(generator.tickets):,} ⭐")
        print(f"   📝 貼文: {len(generator.listings):,}")
        print(f"   🤝 交易: {len(generator.trades):,}")
        print(f"   📋 參與者: {len(generator.trade_participants):,}")
        print(f"   🎫 交易票券: {len(generator.trade_tickets):,}")
        print(f"   💰 餘額記錄: {len(generator.balance_logs) + len(generator.users):,}")
        print()
        print("🚀 下一步:")
        print(f"   1. 檢查資料庫連線")
        print(f"   2. 執行: npm run init-db")
        print(f"   3. 執行: npm run init-db:seed {args.output}")
        print(f"   4. 啟動應用: npm run dev")

    except Exception as e:
        print(f"\n❌ 生成過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    # 檢查Python版本
    if sys.version_info < (3, 6):
        print("❌ 需要 Python 3.6 或更新版本")
        sys.exit(1)

    # 檢查必要模組
    try:
        import faker
    except ImportError:
        print("❌ 缺少必要模組: faker")
        print("   請執行: pip install faker")
        sys.exit(1)

    main()
