import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Heart, LockKeyhole } from 'lucide-react';
import { listInvitations } from '@/lib/invitations';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const invitations = await listInvitations();
  return <main className="home-page">
    <header className="home-header"><Link className="brand" href="/">Nét Duyên<span>✧</span></Link><Link className="header-admin" href="/quan-tri"><LockKeyhole size={15} /> Quản trị</Link></header>
    <section className="home-hero">
      <span className="eyebrow">MỘT MẪU THIỆP · MUÔN CÂU CHUYỆN</span>
      <h1>Lưu giữ lời mời<br /><em>ngày chung đôi.</em></h1>
      <p>Mỗi tấm thiệp là một câu chuyện riêng, được kể bằng sự tinh giản, sắc đỏ trầm và những khoảnh khắc đáng nhớ.</p>
      {invitations[0] && <Link className="primary-link" href={`/thiep/${invitations[0].slug}`}>Xem thiệp mẫu <ArrowUpRight size={18} /></Link>}
      <div className="home-mark" aria-hidden="true"><Heart size={18} strokeWidth={1} /></div>
    </section>
    <section className="home-collection" aria-labelledby="collection-title">
      <div className="section-heading"><span className="eyebrow">BỘ SƯU TẬP</span><h2 id="collection-title">Những ngày đáng nhớ</h2><p>Các thiệp đã được xuất bản.</p></div>
      {invitations.length ? <div className="invitation-grid">{invitations.map((invite) => <Link className="invitation-card" href={`/thiep/${invite.slug}`} key={invite.id}>
        <div className="card-photo">{invite.coverImage ? <Image src={invite.coverImage} alt={invite.coverAlt || `Thiệp cưới ${invite.partnerOne} và ${invite.partnerTwo}`} fill sizes="(max-width: 700px) 100vw, 360px" unoptimized={invite.coverImage.startsWith('/api/')} /> : <div className="card-monogram">{invite.partnerOne[0]}<span>&</span>{invite.partnerTwo[0]}</div>}</div>
        <div className="card-caption"><div><span>{invite.events[0] ? formatDate(invite.events[0].dateTime) : 'Ngày cưới'}</span><h3>{invite.partnerOne} <em>&</em> {invite.partnerTwo}</h3></div><ArrowUpRight size={21} /></div>
      </Link>)}</div> : <p className="empty-home">Chưa có thiệp nào được xuất bản.</p>}
    </section>
    <footer className="home-footer"><span>Nét Duyên</span><p>Một thiết kế được tạo riêng cho những ngày quan trọng.</p></footer>
  </main>;
}
