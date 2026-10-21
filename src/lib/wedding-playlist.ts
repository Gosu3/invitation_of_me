export type WeddingTrack = { id: string; title: string; artist?: string; src: string };

// Add entries only after placing the corresponding real audio files in public/music.
export const weddingPlaylist: WeddingTrack[] = [
  { id: 'vaycuoi', title: 'Váy cưới', artist: 'Wedding', src: '/music/vaycuoi.mp3' },
  { id: 'le-duong', title: 'Lễ Đường', artist: 'Kai Đình x meChill', src: '/music/Lễ Đường - Kai Đinh x meChill Lofi - Lyrics Video.mp3' },
  { id: 'ngay-dau-tien', title: 'Ngày Đầu Tiên', artist: 'Đức Phúc', src: '/music/Đức Phúc - Ngày Đầu Tiên (Dance Performance).mp3' },
  { id: 'the-gioi-cua-anh', title: 'Thế Giới Của Anh', artist: 'Tinh Hà', src: '/music/THẾ GIỚI CỦA ANH - TINH HÀ SAY HI - OFFICIAL VISUALIZER.mp3' },
  { id: 'nothings-gonna-change-my-love-for-you', title: "Nothing's Gonna Change My Love for You", artist: 'Music Travel Love ft. Bugoy Drilon', src: "/music/Nothing's Gonna Change My Love For You - Music Travel Love ft. Bugoy Drilon.mp3" },
  { id: 'thien-duong-voi-nguoi-thuong', title: 'Thiên Đường Với Người Thương', src: '/music/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3' },
  { id: 'thanh-than', title: 'Thành Thân', artist: 'Vương Bình', src: '/music/Thành-Thân - VƯƠNG BÌNH.mp3' },
];
