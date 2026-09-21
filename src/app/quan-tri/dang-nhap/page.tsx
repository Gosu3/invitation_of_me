'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const form = new FormData(event.currentTarget);
    const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const result = await client.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) });
    setLoading(false);
    if (result.error) { setError('Email hoặc mật khẩu không đúng.'); return; }
    router.push('/quan-tri'); router.refresh();
  }
  return <main className="admin-login"><Link href="/" className="back-home"><ArrowLeft size={16} /> Về trang chủ</Link><div className="login-card"><div className="login-icon"><LockKeyhole size={23} /></div><span className="eyebrow">NÉT DUYÊN</span><h1>Trang quản trị</h1><p>Đăng nhập để quản lý thiệp và lời hồi đáp.</p>{!configured ? <div className="admin-alert">Chưa cấu hình Supabase. Xem README.md để thiết lập biến môi trường trước khi đăng nhập.</div> : <form onSubmit={login}><label>Email<input type="email" name="email" required autoComplete="email" /></label><label>Mật khẩu<input type="password" name="password" required autoComplete="current-password" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'} <ArrowRight size={16} /></button></form>}</div></main>;
}
