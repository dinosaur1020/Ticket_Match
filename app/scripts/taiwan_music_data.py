"""
台灣音樂資料庫 - Ticket Match 假資料生成用
包含台灣真實藝人、場地和音樂產業資料
"""

TAIWAN_ARTISTS = [
    # 傳奇級藝人
    {"name": "五月天", "genre": "rock", "popularity": "legend", "active_years": 25},
    {"name": "周杰倫", "genre": "mandopop", "popularity": "legend", "active_years": 20},
    {"name": "蔡依林", "genre": "pop", "popularity": "legend", "active_years": 22},

    # 超級巨星
    {"name": "林俊傑", "genre": "mandopop", "popularity": "superstar", "active_years": 15},
    {"name": "田馥甄", "genre": "pop", "popularity": "superstar", "active_years": 12},
    {"name": "徐佳瑩", "genre": "indie_pop", "popularity": "superstar", "active_years": 10},
    {"name": "魏如萱", "genre": "indie_pop", "popularity": "superstar", "active_years": 15},
    {"name": "告五人", "genre": "indie_rock", "popularity": "superstar", "active_years": 8},

    # 當紅藝人
    {"name": "韋禮安", "genre": "pop", "popularity": "hot", "active_years": 12},
    {"name": "宇宙人", "genre": "indie_rock", "popularity": "hot", "active_years": 15},
    {"name": "獅子合唱團", "genre": "indie_rock", "popularity": "hot", "active_years": 20},
    {"name": "陳綺貞", "genre": "indie_folk", "popularity": "hot", "active_years": 18},
    {"name": "蘇打綠", "genre": "indie_rock", "popularity": "hot", "active_years": 18},
    {"name": "范曉萱", "genre": "pop", "popularity": "hot", "active_years": 25},
    {"name": "Matzka", "genre": "indie_pop", "popularity": "hot", "active_years": 8},
    {"name": "萬芳", "genre": "pop", "popularity": "hot", "active_years": 30},

    # 潛力新星
    {"name": "鄭興", "genre": "hip_hop", "popularity": "rising", "active_years": 5},
    {"name": "9m88", "genre": "hip_hop", "popularity": "rising", "active_years": 6},
    {"name": "Julia Wu", "genre": "indie_pop", "popularity": "rising", "active_years": 4},
    {"name": "G.E.M.鄧紫棋", "genre": "cantopop", "popularity": "rising", "active_years": 12},
    {"name": "A-Lin", "genre": "pop", "popularity": "rising", "active_years": 10},
    {"name": "謝和弦", "genre": "hip_hop", "popularity": "rising", "active_years": 15},

    # 其他藝人 (補充到50個)
    {"name": "伍佰", "genre": "rock", "popularity": "veteran", "active_years": 30},
    {"name": "張惠妹", "genre": "pop", "popularity": "veteran", "active_years": 28},
    {"name": "王力宏", "genre": "mandopop", "popularity": "veteran", "active_years": 22},
    {"name": "陶喆", "genre": "rnb", "popularity": "veteran", "active_years": 20},
    {"name": "莫文蔚", "genre": "pop", "popularity": "veteran", "active_years": 25},
    {"name": "張學友", "genre": "cantopop", "popularity": "veteran", "active_years": 35},
    {"name": "劉德華", "genre": "cantopop", "popularity": "veteran", "active_years": 35},
    {"name": "郭富城", "genre": "cantopop", "popularity": "veteran", "active_years": 30},
    {"name": "黎明", "genre": "cantopop", "popularity": "veteran", "active_years": 32},
    {"name": "Jacky Cheung", "genre": "cantopop", "popularity": "veteran", "active_years": 35},

    # 樂團與組合
    {"name": "草東沒有派對", "genre": "indie_rock", "popularity": "hot", "active_years": 8},
    {"name": "茄子蛋", "genre": "indie_rock", "popularity": "hot", "active_years": 10},
    {"name": "四分衛", "genre": "indie_rock", "popularity": "hot", "active_years": 15},
    {"name": "頑童MJ116", "genre": "hip_hop", "popularity": "hot", "active_years": 10},
    {"name": "蛋堡", "genre": "indie_pop", "popularity": "rising", "active_years": 6},
    {"name": "美秀集團", "genre": "indie_rock", "popularity": "rising", "active_years": 7},
    {"name": "理想混蛋", "genre": "indie_rock", "popularity": "rising", "active_years": 5},
    {"name": "康士坦的變化球", "genre": "indie_rock", "popularity": "rising", "active_years": 12},

    # 更多藝人補充
    {"name": "林憶蓮", "genre": "pop", "popularity": "veteran", "active_years": 30},
    {"name": "辛曉琪", "genre": "pop", "popularity": "veteran", "active_years": 25},
    {"name": "杜德偉", "genre": "pop", "popularity": "veteran", "active_years": 28},
    {"name": "張宇", "genre": "pop", "popularity": "veteran", "active_years": 22},
    {"name": "動力火車", "genre": "pop", "popularity": "veteran", "active_years": 20},
    {"name": "優客李林", "genre": "pop", "popularity": "rising", "active_years": 8},
    {"name": "Karencici", "genre": "pop", "popularity": "rising", "active_years": 6},
    {"name": "瘦子E.SO", "genre": "hip_hop", "popularity": "rising", "active_years": 8},
    {"name": "熊仔", "genre": "hip_hop", "popularity": "rising", "active_years": 7},
    {"name": "J.Sheon", "genre": "hip_hop", "popularity": "rising", "active_years": 8},

    # 擴充藝人列表 (新增50+藝人)
    # 華語流行歌手
    {"name": "周華健", "genre": "pop", "popularity": "veteran", "active_years": 30},
    {"name": "李宗盛", "genre": "pop", "popularity": "legend", "active_years": 35},
    {"name": "羅大佑", "genre": "rock", "popularity": "legend", "active_years": 40},
    {"name": "張雨生", "genre": "pop", "popularity": "veteran", "active_years": 25},
    {"name": "趙傳", "genre": "pop", "popularity": "veteran", "active_years": 28},
    {"name": "葉蒨文", "genre": "pop", "popularity": "veteran", "active_years": 32},
    {"name": "梅艷芳", "genre": "cantopop", "popularity": "legend", "active_years": 30},
    {"name": "Beyond", "genre": "rock", "popularity": "legend", "active_years": 25},
    {"name": "譚詠麟", "genre": "cantopop", "popularity": "veteran", "active_years": 35},
    {"name": "陳百強", "genre": "cantopop", "popularity": "veteran", "active_years": 25},

    # 當代華語歌手
    {"name": "蕭敬騰", "genre": "pop", "popularity": "superstar", "active_years": 12},
    {"name": "林宥嘉", "genre": "pop", "popularity": "superstar", "active_years": 15},
    {"name": "宋念宇", "genre": "indie_pop", "popularity": "hot", "active_years": 8},
    {"name": "萬妮達", "genre": "indie_pop", "popularity": "hot", "active_years": 6},
    {"name": "艾怡良", "genre": "pop", "popularity": "hot", "active_years": 10},
    {"name": "謝沛恩", "genre": "pop", "popularity": "hot", "active_years": 8},
    {"name": "紀家盈", "genre": "indie_pop", "popularity": "rising", "active_years": 5},
    {"name": "李浩瑋", "genre": "indie_pop", "popularity": "rising", "active_years": 6},
    {"name": "告五人阿瑋", "genre": "indie_rock", "popularity": "rising", "active_years": 8},
    {"name": "HUSH", "genre": "indie_pop", "popularity": "rising", "active_years": 4},

    # 獨立音樂人
    {"name": "陳昇", "genre": "indie_folk", "popularity": "veteran", "active_years": 35},
    {"name": "萬曉利", "genre": "indie_folk", "popularity": "veteran", "active_years": 20},
    {"name": "好妹妹樂隊", "genre": "indie_folk", "popularity": "hot", "active_years": 10},
    {"name": "馬頔", "genre": "indie_folk", "popularity": "hot", "active_years": 12},
    {"name": "謝天笑", "genre": "indie_folk", "popularity": "rising", "active_years": 8},
    {"name": "好樂團", "genre": "indie_rock", "popularity": "rising", "active_years": 6},
    {"name": "海豚刑警", "genre": "indie_rock", "popularity": "rising", "active_years": 4},
    {"name": "去你的吧", "genre": "indie_rock", "popularity": "rising", "active_years": 3},

    # 嘻哈與 trap
    {"name": "MC HotDog", "genre": "hip_hop", "popularity": "veteran", "active_years": 20},
    {"name": "大支", "genre": "hip_hop", "popularity": "hot", "active_years": 12},
    {"name": "春艷", "genre": "hip_hop", "popularity": "hot", "active_years": 8},
    {"name": "蛋堡 Soft Lipa", "genre": "hip_hop", "popularity": "rising", "active_years": 6},
    {"name": "Barry", "genre": "hip_hop", "popularity": "rising", "active_years": 4},
    {"name": "Multilingual", "genre": "hip_hop", "popularity": "rising", "active_years": 5},
    {"name": "BR", "genre": "hip_hop", "popularity": "rising", "active_years": 3},
    {"name": "PONY5IBE", "genre": "hip_hop", "popularity": "rising", "active_years": 4},

    # 電子與另類
    {"name": "電音三姬", "genre": "electronic", "popularity": "hot", "active_years": 8},
    {"name": "Tizzy Bac", "genre": "electronic", "popularity": "hot", "active_years": 15},
    {"name": "Julia", "genre": "electronic", "popularity": "hot", "active_years": 12},
    {"name": "ØZI", "genre": "trap", "popularity": "rising", "active_years": 6},
    {"name": "R3HAB", "genre": "electronic", "popularity": "rising", "active_years": 10},
    {"name": "Anirudh Ravichander", "genre": "electronic", "popularity": "rising", "active_years": 8},
    {"name": "Yogee New Waves", "genre": "indie_rock", "popularity": "rising", "active_years": 10},
    {"name": "The Fur.", "genre": "indie_rock", "popularity": "rising", "active_years": 8},

    # 重金屬與搖滾
    {"name": "閃靈樂團", "genre": "metal", "popularity": "hot", "active_years": 20},
    {"name": "麋先生", "genre": "metal", "popularity": "rising", "active_years": 8},
    {"name": "蘇打綠青峰", "genre": "rock", "popularity": "superstar", "active_years": 18},
    {"name": "Mayday", "genre": "rock", "popularity": "legend", "active_years": 25},
    {"name": "八三夭", "genre": "rock", "popularity": "hot", "active_years": 12},
    {"name": "TRASH", "genre": "rock", "popularity": "rising", "active_years": 6},
    {"name": "巨大的轟鳴", "genre": "rock", "popularity": "rising", "active_years": 5},
    {"name": "拍謝少年", "genre": "rock", "popularity": "rising", "active_years": 7},

    # 更多新興藝人
    {"name": "邱振哲", "genre": "pop", "popularity": "rising", "active_years": 4},
    {"name": "鄭心慈", "genre": "pop", "popularity": "rising", "active_years": 3},
    {"name": "黃莉", "genre": "indie_pop", "popularity": "rising", "active_years": 5},
    {"name": "柯泯薰", "genre": "indie_pop", "popularity": "rising", "active_years": 4},
    {"name": "許光漢", "genre": "pop", "popularity": "rising", "active_years": 6},
    {"name": "盧廣仲", "genre": "indie_pop", "popularity": "hot", "active_years": 12},
    {"name": "萬芳", "genre": "pop", "popularity": "veteran", "active_years": 30},
    {"name": "黃韻玲", "genre": "pop", "popularity": "veteran", "active_years": 25},
]

VENUES = [
    # 巨蛋級場地
    {"name": "台北小巨蛋", "city": "台北", "capacity": 15000, "type": "arena"},
    {"name": "高雄巨蛋", "city": "高雄", "capacity": 12000, "type": "arena"},
    {"name": "台中洲際棒球場", "city": "台中", "capacity": 20000, "type": "stadium"},

    # 大型室內場地
    {"name": "台北流行音樂中心", "city": "台北", "capacity": 5000, "type": "indoor"},
    {"name": "台大體育館", "city": "台北", "capacity": 6000, "type": "indoor"},
    {"name": "國立台灣大學綜合體育館", "city": "台北", "capacity": 5500, "type": "indoor"},
    {"name": "國父紀念館", "city": "台北", "capacity": 4000, "type": "indoor"},
    {"name": "中山堂", "city": "台北", "capacity": 2500, "type": "indoor"},

    # 中型場地
    {"name": "Legacy", "city": "台北", "capacity": 1200, "type": "club"},
    {"name": "THE WALL", "city": "台北", "capacity": 1500, "type": "club"},
    {"name": "河岸留言", "city": "台北", "capacity": 1000, "type": "club"},
    {"name": "女巫店", "city": "台北", "capacity": 800, "type": "club"},
    {"name": "台中圓滿劇場", "city": "台中", "capacity": 2000, "type": "theater"},
    {"name": "高雄駁二藝術特區", "city": "高雄", "capacity": 3000, "type": "outdoor"},
    {"name": "台南文化中心", "city": "台南", "capacity": 1800, "type": "indoor"},

    # 小型場地
    {"name": "海邊的卡夫卡", "city": "台北", "capacity": 300, "type": "cafe"},
    {"name": "這牆音樂藝文展演空間", "city": "台北", "capacity": 200, "type": "cafe"},
    {"name": "永豐Legacy Taipei", "city": "台北", "capacity": 1000, "type": "club"},
    {"name": "PIPE Live Music", "city": "台北", "capacity": 400, "type": "club"},
    {"name": "地下社會", "city": "台北", "capacity": 350, "type": "club"},
    {"name": "台中新光三越", "city": "台中", "capacity": 800, "type": "mall"},
    {"name": "高雄夢時代", "city": "高雄", "capacity": 1200, "type": "mall"},

    # 戶外場地
    {"name": "大佳河濱公園", "city": "台北", "capacity": 5000, "type": "outdoor"},
    {"name": "華山1914文化創意產業園區", "city": "台北", "capacity": 3000, "type": "outdoor"},
    {"name": "台中大里公園", "city": "台中", "capacity": 2500, "type": "outdoor"},
    {"name": "高雄愛河之心", "city": "高雄", "capacity": 4000, "type": "outdoor"},
    {"name": "台南安平古堡", "city": "台南", "capacity": 2000, "type": "outdoor"},

    # 擴充場地列表 (新增30+個場地)
    # 台北地區
    {"name": "ATT SHOW BOX", "city": "台北", "capacity": 800, "type": "club"},
    {"name": "三創生活園區", "city": "台北", "capacity": 600, "type": "mall"},
    {"name": "松山文創園區", "city": "台北", "capacity": 1500, "type": "outdoor"},
    {"name": "士林官邸", "city": "台北", "capacity": 1000, "type": "outdoor"},
    {"name": "總統府前廣場", "city": "台北", "capacity": 3000, "type": "outdoor"},
    {"name": "信義區廣場", "city": "台北", "capacity": 2000, "type": "outdoor"},
    {"name": "台師大綜合體育館", "city": "台北", "capacity": 3500, "type": "indoor"},
    {"name": "輔大體育館", "city": "台北", "capacity": 2800, "type": "indoor"},
    {"name": "北投溫泉博物館", "city": "台北", "capacity": 800, "type": "outdoor"},
    {"name": "陽明山國家公園", "city": "台北", "capacity": 1500, "type": "outdoor"},

    # 新北地區
    {"name": "板橋體育館", "city": "新北", "capacity": 3200, "type": "indoor"},
    {"name": "新莊體育館", "city": "新北", "capacity": 2800, "type": "indoor"},
    {"name": "淡水漁人碼頭", "city": "新北", "capacity": 1200, "type": "outdoor"},
    {"name": "貢寮海洋音樂祭場地", "city": "新北", "capacity": 8000, "type": "outdoor"},
    {"name": "三峽老街廣場", "city": "新北", "capacity": 1500, "type": "outdoor"},
    {"name": "鶯歌陶瓷博物館", "city": "新北", "capacity": 600, "type": "outdoor"},
    {"name": "林口體育館", "city": "新北", "capacity": 2200, "type": "indoor"},
    {"name": "永和體育館", "city": "新北", "capacity": 1800, "type": "indoor"},

    # 台中地區
    {"name": "台中文化資產園區", "city": "台中", "capacity": 2500, "type": "outdoor"},
    {"name": "逢甲大學體育館", "city": "台中", "capacity": 3200, "type": "indoor"},
    {"name": "東海大學體育館", "city": "台中", "capacity": 2800, "type": "indoor"},
    {"name": "台中歌劇院", "city": "台中", "capacity": 1500, "type": "indoor"},
    {"name": "台中文學館", "city": "台中", "capacity": 800, "type": "indoor"},
    {"name": "后里馬場", "city": "台中", "capacity": 3000, "type": "outdoor"},
    {"name": "潭雅神綠園道", "city": "台中", "capacity": 2000, "type": "outdoor"},
    {"name": "台中公園", "city": "台中", "capacity": 1800, "type": "outdoor"},
    {"name": "台中市政府廣場", "city": "台中", "capacity": 2500, "type": "outdoor"},
    {"name": "台中港區藝術中心", "city": "台中", "capacity": 1200, "type": "indoor"},

    # 台南地區
    {"name": "台南文化中心", "city": "台南", "capacity": 1800, "type": "indoor"},
    {"name": "台南大學體育館", "city": "台南", "capacity": 2200, "type": "indoor"},
    {"name": "成功大學體育館", "city": "台南", "capacity": 2800, "type": "indoor"},
    {"name": "奇美博物館", "city": "台南", "capacity": 1000, "type": "indoor"},
    {"name": "台南美術館", "city": "台南", "capacity": 1200, "type": "indoor"},
    {"name": "赤崁樓", "city": "台南", "capacity": 1500, "type": "outdoor"},
    {"name": "七股鹽山", "city": "台南", "capacity": 2000, "type": "outdoor"},
    {"name": "烏山頭水庫", "city": "台南", "capacity": 3000, "type": "outdoor"},
    {"name": "台南市立體育場", "city": "台南", "capacity": 40000, "type": "stadium"},

    # 高雄地區
    {"name": "高雄市立美術館", "city": "高雄", "capacity": 1200, "type": "indoor"},
    {"name": "高雄國家體育場", "city": "高雄", "capacity": 55000, "type": "stadium"},
    {"name": "高雄大學體育館", "city": "高雄", "capacity": 3200, "type": "indoor"},
    {"name": "義大世界", "city": "高雄", "capacity": 2000, "type": "outdoor"},
    {"name": "高雄流行音樂中心", "city": "高雄", "capacity": 3500, "type": "indoor"},
    {"name": "旗津海水浴場", "city": "高雄", "capacity": 1500, "type": "outdoor"},
    {"name": "西子灣", "city": "高雄", "capacity": 2000, "type": "outdoor"},
    {"name": "高雄展覽館", "city": "高雄", "capacity": 5000, "type": "indoor"},
    {"name": "高雄港碼頭", "city": "高雄", "capacity": 3000, "type": "outdoor"},

    # 其他地區
    {"name": "花蓮文化創意產業園區", "city": "花蓮", "capacity": 800, "type": "outdoor"},
    {"name": "台東森林公園", "city": "台東", "capacity": 1500, "type": "outdoor"},
    {"name": "澎湖天后宮廣場", "city": "澎湖", "capacity": 1000, "type": "outdoor"},
    {"name": "金門烈嶼", "city": "金門", "capacity": 800, "type": "outdoor"},
    {"name": "馬祖東莒島", "city": "馬祖", "capacity": 500, "type": "outdoor"},
    {"name": "宜蘭羅東運動公園", "city": "宜蘭", "capacity": 2500, "type": "outdoor"},
    {"name": "基隆文化中心", "city": "基隆", "capacity": 1200, "type": "indoor"},
    {"name": "桃園藝文廣場", "city": "桃園", "capacity": 1800, "type": "outdoor"},
    {"name": "新竹縣體育場", "city": "新竹", "capacity": 20000, "type": "stadium"},
    {"name": "苗栗客家文化園區", "city": "苗栗", "capacity": 1500, "type": "outdoor"},
    {"name": "彰化扇形車庫", "city": "彰化", "capacity": 1000, "type": "outdoor"},
    {"name": "南投日月潭", "city": "南投", "capacity": 5000, "type": "outdoor"},
    {"name": "雲林古坑音樂村", "city": "雲林", "capacity": 800, "type": "outdoor"},
    {"name": "嘉義市立體育場", "city": "嘉義", "capacity": 15000, "type": "stadium"},
    {"name": "屏東縣體育館", "city": "屏東", "capacity": 2800, "type": "indoor"},
]

PRICE_RANGES = {
    "A區": (2800, 5800),
    "B區": (2200, 4200),
    "C區": (1500, 3200),
    "VIP區": (5800, 12000),
    "搖滾區": (1800, 3500),
    "一般區": (1200, 2500),
    "貴賓區": (4500, 8800),
}

SEAT_AREAS = [
    "A區", "B區", "C區", "VIP區", "搖滾區", "一般區", "貴賓區",
    "前區", "後區", "左區", "右區", "中央區"
]

EVENT_TYPES = [
    "演唱會", "巡迴演唱會", "世界巡迴演唱會", "音樂會",
    "演唱會", "專輯巡迴", "紀念演唱會", "復出演唱會",
    "音樂祭", "演唱會", "音樂盛典"
]

LISTING_CONTENT_TEMPLATES = {
    "Sell": [
        "轉讓{event_name}票券，價格合理！",
        "{event_name}優質座位，誠心出售",
        "因故無法出席，{event_name}票券出讓",
        "{event_name}票券{area}，原價轉讓",
        "{event_name}好位子，售{price}元",
        "急售{event_name}票券，歡迎議價"
    ],
    "Exchange": [
        "{event_name}票券，想交換其他場次",
        "想換{event_name}其他藝人票券",
        "{event_name}換票需求：交換更喜歡的演出",
        "{event_name}票券，可換{area}或其他區域",
        "交換{event_name}，尋找理想座位"
    ],
    "Buy": [
        "徵求{event_name}票券，價格可議",
        "想看{event_name}，歡迎聯繫",
        "{event_name}搶票失敗，求好心人支援",
        "徵{event_name}任何區域票券",
        "{event_name}求票，誠心購買"
    ]
}

# 根據藝人知名度調整票價倍率
ARTIST_PRICE_MULTIPLIER = {
    "legend": 1.5,      # 傳奇級：1.5倍
    "superstar": 1.3,   # 超級巨星：1.3倍
    "hot": 1.1,         # 當紅：1.1倍
    "rising": 0.9,      # 新星：0.9倍
    "veteran": 1.2      # 資深藝人：1.2倍
}

# 場地票價基礎倍率
VENUE_PRICE_MULTIPLIER = {
    "arena": 1.2,       # 巨蛋：1.2倍
    "stadium": 1.3,     # 體育場：1.3倍
    "indoor": 1.0,      # 室內場地：基準
    "theater": 0.9,     # 劇場：0.9倍
    "club": 0.8,        # 俱樂部：0.8倍
    "cafe": 0.6,        # 咖啡廳：0.6倍
    "mall": 0.7,        # 購物中心：0.7倍
    "outdoor": 0.8      # 戶外：0.8倍
}
