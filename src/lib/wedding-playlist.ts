export type WeddingTrack = { id: string; title: string; artist?: string; src: string };

// Add entries only after placing the corresponding real audio files in public/music.
export const weddingPlaylist: WeddingTrack[] = [
  { id: 'vaycuoi', title: 'Váy cưới', artist: 'Wedding', src: '/music/vaycuoi.mp3' },
  { id: 'le-duong', title: 'Lễ Đường', artist: 'Kai Đình x meChill', src: '/music/Lễ Đường - Kai Đinh x meChill Lofi - Lyrics Video.mp3' },
  { id: 'ngay-dau-tien', title: 'Ngày Đầu Tiên', artist: 'Đức Phúc', src: '/music/Đức Phúc - Ngày Đầu Tiên (Dance Performance).mp3' },
  { id: 'em-dong-y-i-do', title: 'Em Đồng Ý (I Do)', artist: 'Đức Phúc x 911', src: '/music/Em Đồng Ý (I Do) - Đức Phúc x 911.mp3' },
  { id: 'nothings-gonna-change-my-love-for-you', title: "Nothing's Gonna Change My Love for You", artist: 'Music Travel Love ft. Bugoy Drilon', src: "/music/Nothing's Gonna Change My Love For You - Music Travel Love ft. Bugoy Drilon.mp3" },
  { id: 'thien-duong-voi-nguoi-thuong', title: 'Thiên Đường Với Người Thương', src: '/music/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3' },
];
