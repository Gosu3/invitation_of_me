export type WeddingTrack = { id: string; title: string; artist?: string; src: string };

// Add entries only after placing the corresponding real audio files in public/music.
export const weddingPlaylist: WeddingTrack[] = [
  { id: 'vaycuoi', title: 'Váy cưới', artist: 'Wedding', src: '/music/vaycuoi.mp3' },
  { id: 'bai-nay-khong-de-di-dien', title: 'Bài này không để đi diễn', artist: 'Anh Tú Atus x @DieuNhiOfficial', src: '/music/Bài này không để đi diễn - Anh Tu Atus x @DieuNhiOfficial Wedding.mp3' },
  { id: 'le-duong', title: 'Lễ Đường', artist: 'Kai Đình x meChill', src: '/music/Lễ Đường - Kai Đinh x meChill Lofi - Lyrics Video.mp3' },
  { id: 'ngay-dau-tien', title: 'Ngày Đầu Tiên', artist: 'Đức Phúc', src: '/music/Đức Phúc - Ngày Đầu Tiên (Dance Performance).mp3' },
  { id: 'nothings-gonna-change-my-love-for-you', title: "Nothing's Gonna Change My Love for You", artist: 'Music Travel Love ft. Bugoy Drilon', src: "/music/Nothing's Gonna Change My Love For You - Music Travel Love ft. Bugoy Drilon.mp3" },
];
