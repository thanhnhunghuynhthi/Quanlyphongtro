import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { User } from '../types';
import { Eye, EyeOff, Lock, AlertCircle, X } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  onClose: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      requestRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const request = new AbortController();
    requestRef.current = request;
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username: username.trim(), password }, { signal: request.signal });
      const { user, token } = res.data;
      localStorage.setItem('tro_token', token);
      localStorage.setItem('tro_user', JSON.stringify(user));
      onLoginSuccess(user, token);
    } catch (err: any) {
      if (!request.signal.aborted) setError(err.response?.data?.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="login-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm"
    >
      <div className="relative border-b border-slate-800 bg-gradient-to-br from-slate-950 to-teal-950 px-6 py-7 text-white sm:px-8">
        <button type="button" aria-label="Đóng đăng nhập" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        <img src="/logo.png" alt="Nhà Trọ Số" className="mb-3 h-12 w-auto" />
        <h1 id="login-title" className="text-2xl font-black">Đăng nhập</h1>
        <p className="mt-1 text-sm text-slate-300">Dùng tài khoản Nhà Trọ Số để vào cổng quản lý.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
        {error && <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} className="shrink-0" />{error}</div>}
        <label className="block space-y-1.5 text-sm font-bold text-slate-700">
          <span>Tên đăng nhập</span>
          <input autoFocus autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)} className="block w-full rounded-xl border border-slate-300 px-4 py-3 font-normal focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </label>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-sm font-bold text-slate-700">Mật khẩu</label>
          <div className="relative">
            <input id="login-password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={event => setPassword(event.target.value)} className="block w-full rounded-xl border border-slate-300 py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 px-4 text-slate-500 hover:text-teal-700">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-sm font-bold text-white shadow hover:bg-teal-800 disabled:opacity-60">
          <Lock size={16} /> {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </dialog>
  );
};
