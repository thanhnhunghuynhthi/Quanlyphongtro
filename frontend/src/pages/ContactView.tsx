import { getPropertyPhone } from '../siteDetails';
import React, { useEffect, useState } from 'react';
import { MapPin, Phone, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { Property } from '../types';

export function ContactView({ onViewRooms, onSendFeedback }: {
  onViewRooms: () => void;
  onSendFeedback?: () => void;
}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    api.get<Property[]>('/public/properties', { signal: request.signal })
      .then(({ data }) => {
        setProperties(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!request.signal.aborted) setStatus('error');
      });
    return () => request.abort();
  }, [attempt]);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 py-6" aria-labelledby="contact-title">
      <div className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
        <h1 id="contact-title" className="text-2xl font-black sm:text-3xl">Liên hệ</h1>
        <p className="mt-2 text-sm text-slate-300">Liên hệ người quản lý từng khu trọ để hỏi về phòng và dịch vụ.</p>
      </div>

      {status === 'loading' && <p role="status">Đang tải thông tin liên hệ…</p>}
      {status === 'error' && (
        <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
          <p>Không tải được thông tin liên hệ.</p>
          <button type="button" className="mt-3 inline-flex items-center gap-2 font-bold text-teal-700" onClick={() => {
            setStatus('loading');
            setAttempt(value => value + 1);
          }}><RefreshCw size={16} /> Thử lại</button>
        </div>
      )}
      {status === 'ready' && properties.length === 0 && <p>Chưa có thông tin khu trọ.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {properties.map(property => {
          const phone = getPropertyPhone(property.managerPhone);
          return (
            <article key={property.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-slate-900">{property.name}</h2>
              <p className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin size={17} className="shrink-0 text-teal-700" /> {property.address}
              </p>
              {property.managerName && <p className="text-sm text-slate-600">Quản lý · {property.managerName}</p>}
              <a href={`tel:${phone}`} className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:underline">
                  <Phone size={16} /> {phone}
                </a>
            </article>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onViewRooms} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800">Xem phòng</button>
        {onSendFeedback && (
          <button type="button" onClick={onSendFeedback} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800">Phản hồi và báo hỏng</button>
        )}
      </div>
    </section>
  );
}
