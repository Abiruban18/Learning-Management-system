import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../../lib/api';
import { SiteSettings } from '../../types';

export default function TeacherSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => settingsAPI.get().then(r => r.data.settings as SiteSettings) });
  const [form, setForm] = useState<SiteSettings>({ siteName: 'EduQuest', primaryColor: '#6366f1', allowSelfRegistration: true, defaultXpPerLesson: 20, streakFreezeEnabled: true, maintenanceMode: false });
  useEffect(() => { if (data) setForm(data); }, [data]);

  const mutation = useMutation({ mutationFn: () => settingsAPI.update(form), onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }) });
  const toggle = (key: keyof SiteSettings) => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }));

  const toggles: [keyof SiteSettings, string, string][] = [
    ['allowSelfRegistration', 'Self-registration', 'Students can sign up without an invite'],
    ['streakFreezeEnabled',   'Streak freeze',     'Students can use a streak freeze item'],
    ['maintenanceMode',       'Maintenance mode',  'Block all student access temporarily'],
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">Settings</h1>
        <p className="text-slate-500">Configure platform-wide behavior</p>
      </div>
      <div className="space-y-5">
        <div className="card">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">General</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Site name</label>
              <input className="input" value={form.siteName} onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Brand color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer p-1" />
                <input className="input flex-1" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Default XP per lesson</label>
              <input className="input" type="number" min={1} max={500} value={form.defaultXpPerLesson} onChange={e => setForm(f => ({ ...f, defaultXpPerLesson: +e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Features</h2>
          <div className="space-y-4">
            {toggles.map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                </div>
                <button onClick={() => toggle(key)} className={`toggle-track ${form[key] ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                  <div className={`toggle-thumb ${form[key] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => mutation.mutate()} className="btn-primary w-full justify-center py-3" disabled={mutation.isPending}>
          {mutation.isPending ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</span> : 'Save settings'}
        </button>
        {mutation.isSuccess && <p className="text-center text-sm text-emerald-600 font-medium">Settings saved ✓</p>}
      </div>
    </div>
  );
}
