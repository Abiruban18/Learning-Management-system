import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../lib/api';
import { Notification } from '../types';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.list().then(r => r.data),
    refetchInterval: 5 * 60 * 1000, // poll every 5 minutes
    staleTime: 2 * 60 * 1000,
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unread: number = data?.unreadCount ?? 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    await notificationAPI.markRead(id);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAll = async () => {
    await notificationAPI.markAll();
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
          open
            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="text-xs bg-indigo-100 border border-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold transition">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-slate-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} onClick={() => markRead(n._id)}
                  className={`px-4 py-3.5 border-b border-slate-50 last:border-0 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${!n.isRead ? 'bg-indigo-50/60' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                    <div className={!n.isRead ? '' : 'pl-4'}>
                      <div className="text-sm font-semibold text-slate-800">{n.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
