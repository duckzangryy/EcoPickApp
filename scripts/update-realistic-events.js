const path = require('path');
const { neon } = require(path.resolve(__dirname, '../vercel-api/node_modules/@neondatabase/serverless'));

// Không hardcode chuỗi kết nối (trước đây để lộ mật khẩu role neondb_owner).
// Chạy kèm: node --env-file=vercel-api/.env.local scripts/update-realistic-events.js
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Thiếu DATABASE_URL. Chạy: node --env-file=vercel-api/.env.local scripts/update-realistic-events.js');
  process.exit(1);
}

const REALISTIC_EVENTS = [
  {
    id: 'evt-001',
    title: 'Chủ Nhật Xanh: Thu gom rác thải lòng hồ Ea Kao',
    description: 'Chiến dịch làm sạch ven hồ Ea Kao và khu vực bến nước truyền thống. Cùng tình nguyện viên thu gom rác nhựa, túi nilon tồn đọng và khơi thông cống rãnh để bảo vệ nguồn nước ngọt của thành phố.',
    cover_image_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80fbea5?w=1000&auto=format&fit=crop&q=80',
    type: 'clean up',
    start_date: '2026-11-01T07:00:00+07:00',
    end_date: '2026-11-01T10:30:00+07:00',
    latitude: 12.6050,
    longitude: 108.0670,
    location: 'Bến nước Buôn Tơng Ju, Hồ Ea Kao',
    address: 'Xã Ea Kao, TP. Buôn Ma Thuột, Đắk Lắk',
    max_paticipants: 60,
    current_paticipants: 38,
    equipment: 'Găng tay cao su, kẹp gắp rác, bao tải dứa, ủng lội nước, túi rác tự hủy',
    difficulty: 'medium',
    eco_point_reward: 100,
    status: 'upcoming',
    organizer_id: 'user-admin-local-001',
  },
  {
    id: 'evt-002',
    title: 'Trồng 1.000 cây sao đen và giáng hương tại Buôn Đôn',
    description: 'Chương trình phủ xanh đất trống đồi trọc vùng đệm Vườn Quốc gia Yok Đôn. Hoạt động góp phần chống xói mòn đất, giữ mạch nước ngầm và tạo bóng mát cho cộng đồng người đồng bào địa phương.',
    cover_image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&auto=format&fit=crop&q=80',
    type: 'tree planting',
    start_date: '2026-11-08T06:30:00+07:00',
    end_date: '2026-11-08T11:30:00+07:00',
    latitude: 12.8980,
    longitude: 107.7840,
    location: 'Tiểu khu 462, Rừng phòng hộ Buôn Đôn',
    address: 'Xã Krông Na, Huyện Buôn Đôn, Đắk Lắk',
    max_paticipants: 80,
    current_paticipants: 52,
    equipment: 'Cuốc xẻng nhỏ, găng tay làm vườn, cọc tre cố định, bình tưới nước',
    difficulty: 'hard',
    eco_point_reward: 150,
    status: 'upcoming',
    organizer_id: 'user-admin-local-001',
  },
  {
    id: 'evt-003',
    title: 'Ngày hội: Đổi pin cũ & rác nhựa lấy sen đá',
    description: 'Thu gom các loại rác nguy hại (pin đã qua sử dụng, bóng đèn, vỏ chai thuốc BVTV) và rác nhựa sạch để đổi lấy chậu sen đá để bàn, cây giống hoa chuông và quà tặng sống xanh.',
    cover_image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1000&auto=format&fit=crop&q=80',
    type: 'recycling',
    start_date: '2026-11-15T08:00:00+07:00',
    end_date: '2026-11-15T16:30:00+07:00',
    latitude: 12.6795,
    longitude: 108.0448,
    location: 'Quảng trường 10/3',
    address: 'Đường Nguyễn Tất Thành, Phường Tự An, TP. Buôn Ma Thuột',
    max_paticipants: 100,
    current_paticipants: 74,
    equipment: 'Bàn cân điện tử, bao phân loại rác, chậu sen đá & cây xanh',
    difficulty: 'easy',
    eco_point_reward: 50,
    status: 'upcoming',
    organizer_id: 'user-admin-local-001',
  },
  {
    id: 'evt-004',
    title: 'Chiến dịch Eco-Trek: Làm sạch đường mòn Thác Dray Nur',
    description: 'Vừa đi bộ trekking rèn luyện sức khỏe, vừa dọn sạch rác thải nhựa của du khách dọc tuyến đường ven sông Sêrêpôk hùng vĩ đến chân thác Dray Nur.',
    cover_image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000&auto=format&fit=crop&q=80',
    type: 'clean up',
    start_date: '2026-11-22T07:00:00+07:00',
    end_date: '2026-11-22T12:00:00+07:00',
    latitude: 12.5320,
    longitude: 107.8965,
    location: 'Khu du lịch sinh thái Thác Dray Nur',
    address: 'Xã Dray Sáp, Huyện Krông Ana, Đắk Lắk',
    max_paticipants: 40,
    current_paticipants: 26,
    equipment: 'Balo sinh thái, kẹp rác du lịch, túi đựng rác đeo hông, hộp y tế sơ cấp cứu',
    difficulty: 'medium',
    eco_point_reward: 120,
    status: 'upcoming',
    organizer_id: 'user-admin-local-001',
  },
  {
    id: 'evt-005',
    title: 'Workshop: Tự ủ phân hữu cơ Compost từ rác nhà bếp',
    description: 'Khóa hướng dẫn thực hành cách phân loại rác hữu cơ tại gia đình, sử dụng men vi sinh bản địa (IMO) để biến vỏ rau củ quả thành phân bón dinh dưỡng cho cây trồng ban công và vườn nhà.',
    cover_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1000&auto=format&fit=crop&q=80',
    type: 'workshop',
    start_date: '2026-11-29T08:30:00+07:00',
    end_date: '2026-11-29T11:00:00+07:00',
    latitude: 12.6710,
    longitude: 108.0520,
    location: 'Nhà văn hóa Thanh thiếu nhi Đắk Lắk',
    address: '03 Lê Duẩn, Phường Tự An, TP. Buôn Ma Thuột',
    max_paticipants: 30,
    current_paticipants: 18,
    equipment: 'Thùng ủ mẫu, gói men vi sinh, găng tay y tế, tài liệu in màu',
    difficulty: 'easy',
    eco_point_reward: 40,
    status: 'upcoming',
    organizer_id: 'user-admin-local-001',
  },
  {
    id: 'evt-006',
    title: 'Chiến dịch Hồi sinh dòng suối Ea Tam',
    description: 'Ra quân khơi thông dòng chảy suối Ea Tam, trục vớt rác thải trôi nổi và dọn sạch túi nilon tồn ứ tại các gầm cầu, trả lại vẻ xanh trong cho con suối nội đô Buôn Ma Thuột.',
    cover_image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=1000&auto=format&fit=crop&q=80',
    type: 'clean up',
    start_date: '2026-12-06T07:00:00+07:00',
    end_date: '2026-12-06T10:30:00+07:00',
    latitude: 12.6512,
    longitude: 108.0315,
    location: 'Khu vực cầu Ea Tam',
    address: 'Đường Lê Duẩn, Phường Ea Tam, TP. Buôn Ma Thuột',
    max_paticipants: 50,
    current_paticipants: 31,
    equipment: 'Ủng lội suối, cào rác sắt, găng tay chống nước, lưới vớt rác',
    difficulty: 'medium',
    eco_point_reward: 90,
    status: 'upcoming',
    organizer_id: 'user-admin-local-001',
  },
];

const SAMPLE_PARTICIPANTS = [
  { fullname: 'Vuong Viet Anh', email: 'suzunesokawaiii@gmail.com', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400' },
  { fullname: 'Phạm Bá Anh Tuấn', email: 'tuan@eco.vn', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400' },
  { fullname: 'Vũ Nhật Trường', email: 'truong114995@donga.edu.vn', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
  { fullname: 'Trần Thị Thu Thảo', email: 'thuthao.daklak@gmail.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
  { fullname: 'Nguyễn Hoàng Nam', email: 'namhoang.eco@gmail.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
  { fullname: 'Lê Minh Hưng', email: 'minhhung.bmt@gmail.com', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400' },
];

async function run() {
  const sql = neon(DATABASE_URL);
  console.log('Connecting to Neon database...');

  // 1. Xóa các sự kiện cũ để thay bằng sự kiện chuẩn thực tế
  console.log('Clearing old events...');
  await sql`DELETE FROM app_data WHERE collection='events'`;
  await sql`DELETE FROM app_data WHERE collection='event_participants'`;

  // 2. Thêm từng sự kiện
  console.log('Inserting realistic events...');
  for (const ev of REALISTIC_EVENTS) {
    const record = {
      ...ev,
      current_participants: ev.current_paticipants,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await sql`INSERT INTO app_data (collection, id, user_id, data) VALUES ('events', ${ev.id}, ${ev.organizer_id}, ${JSON.stringify(record)}::jsonb)`;

    // Thêm người tham gia mẫu cho sự kiện này
    const pCount = Math.min(ev.current_paticipants, SAMPLE_PARTICIPANTS.length);
    for (let i = 0; i < pCount; i++) {
      const user = SAMPLE_PARTICIPANTS[i];
      const pId = `ep-${ev.id}-${i + 1}`;
      const pRecord = {
        id: pId,
        event: ev.id,
        user: `user-sample-${i + 1}`,
        status: 'joined',
        joined_at: new Date(Date.now() - (i + 1) * 7200000).toISOString(),
        participant: {
          id: `user-sample-${i + 1}`,
          fullname: user.fullname,
          email: user.email,
          avatar: user.avatar,
        },
      };
      await sql`INSERT INTO app_data (collection, id, user_id, data) VALUES ('event_participants', ${pId}, ${pRecord.user}, ${JSON.stringify(pRecord)}::jsonb)`;
    }
  }

  console.log('Done! Inserted', REALISTIC_EVENTS.length, 'events with participants.');
}

run().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
