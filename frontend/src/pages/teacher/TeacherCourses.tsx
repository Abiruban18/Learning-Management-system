import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesAPI } from '../../lib/api';
import { Course } from '../../types';
import { Link } from 'react-router-dom';

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&auto=format&fit=crop&q=70',
];
function getCover(id: string) {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COVER_IMAGES.length;
  return COVER_IMAGES[idx];
}

export default function TeacherCourses() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', tags: '', isPublished: false });
  const [editId, setEditId] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ['teacher-courses'], queryFn: () => coursesAPI.mine().then(r => r.data.courses as Course[]) });
  const courses = data ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: object) => editId ? coursesAPI.update(editId, payload) : coursesAPI.create(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teacher-courses'] }); setShowForm(false); setEditId(null); setForm({ title: '', description: '', tags: '', isPublished: false }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesAPI.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-courses'] }),
  });

  const openEdit = (c: Course) => { setEditId(c._id); setForm({ title: c.title, description: c.description, tags: c.tags.join(', '), isPublished: c.isPublished }); setShowForm(true); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); saveMutation.mutate({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-1">Courses</h1>
          <p className="text-slate-500">{courses.length} total courses</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="btn-primary">+ New course</button>
      </div>

      {showForm && (
        <div className="card mb-6 bg-indigo-50 border-indigo-200">
          <h2 className="text-lg font-bold text-slate-800 mb-5">{editId ? 'Edit course' : 'New course'}</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Course title</label>
              <input className="input" placeholder="e.g. Advanced JavaScript" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
              <textarea className="input min-h-[90px] resize-none" placeholder="What will students learn?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Tags (comma separated)</label>
              <input className="input" placeholder="javascript, web, frontend" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className={`toggle-track ${form.isPublished ? 'bg-indigo-500' : 'bg-slate-300'}`} onClick={() => setForm(f => ({ ...f, isPublished: !f.isPublished }))}>
                <div className={`toggle-thumb ${form.isPublished ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-slate-700">Publish immediately</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : editId ? 'Save changes' : 'Create course'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-slate-500 mb-5">No courses yet. Create your first one above!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map(c => (
            <div key={c._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
              <div className="relative h-36 overflow-hidden">
                <img src={getCover(c._id)} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold text-white ${c.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)} className="text-xs bg-white/90 text-slate-700 px-2.5 py-1 rounded-lg hover:bg-white font-medium transition">Edit</button>
                    <button onClick={() => deleteMutation.mutate(c._id)} className="text-xs bg-red-500/90 text-white px-2.5 py-1 rounded-lg hover:bg-red-500 font-medium transition">Delete</button>
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 mb-1">{c.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{c.description}</p>
                {c.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {c.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-slate-400 mb-4">{c.modules.length} modules · {c.totalDuration} min</div>
                <div className="flex gap-2 mt-auto">
                  <Link to={`/teacher/courses/${c._id}/modules`} className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center">Modules</Link>
                  <Link to={`/teacher/courses/${c._id}/students`} className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center">Students</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
