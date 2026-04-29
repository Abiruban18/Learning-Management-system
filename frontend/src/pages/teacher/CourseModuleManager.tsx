import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesAPI } from '../../lib/api';
import { Course, CourseMaterial } from '../../types';

export default function CourseModuleManager() {
  const { courseId } = useParams<{ courseId: string }>();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['course', courseId], queryFn: () => coursesAPI.byId(courseId!).then(r => r.data.course as Course) });
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', deadline: '' });
  const [matForms, setMatForms] = useState<Record<string, CourseMaterial & { open: boolean }>>({});

  const addModuleMutation = useMutation({
    mutationFn: (body: object) => coursesAPI.addModule(courseId!, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course', courseId] }); setModuleForm({ title: '', description: '', deadline: '' }); },
  });

  const course = data;
  if (!course) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />Loading…
    </div>
  );

  const matIcon = (type: string) => type === 'video' ? '🎬' : type === 'pdf' ? '📄' : type === 'link' ? '🔗' : '📝';

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">{course.title}</h1>
        <p className="text-slate-500">Manage modules and course materials</p>
      </div>

      <div className="card mb-6 bg-indigo-50 border-indigo-200">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Add Module</h2>
        <div className="space-y-3">
          <input className="input" placeholder="Module title" value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} />
          <input className="input" placeholder="Description (optional)" value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} />
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Deadline (optional)</label>
            <input className="input" type="date" value={moduleForm.deadline} onChange={e => setModuleForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <button className="btn-primary" disabled={!moduleForm.title || addModuleMutation.isPending}
            onClick={() => addModuleMutation.mutate({ ...moduleForm, order: course.modules.length + 1, materials: [] })}>
            {addModuleMutation.isPending ? 'Adding…' : '+ Add module'}
          </button>
        </div>
      </div>

      {course.modules.length === 0 ? (
        <div className="card text-center py-16"><div className="text-4xl mb-3">📦</div><p className="text-slate-500">No modules yet — add one above.</p></div>
      ) : (
        <div className="space-y-4">
          {course.modules.map((mod, mi) => (
            <div key={mi} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-black shrink-0">{mi + 1}</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{mod.title}</div>
                  {mod.deadline && <div className="text-xs text-slate-400 mt-0.5">Due {new Date(mod.deadline).toLocaleDateString()}</div>}
                </div>
                <span className="text-xs text-slate-400">{mod.materials.length} materials</span>
              </div>

              {mod.materials.length > 0 && (
                <div className="mb-3 space-y-2 ml-11">
                  {mod.materials.map((mat, matIdx) => (
                    <div key={matIdx} className="flex items-center gap-3 text-sm bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl">
                      <span className="text-base">{matIcon(mat.type)}</span>
                      <span className="flex-1 text-slate-700">{mat.title}</span>
                      {mat.duration && <span className="text-xs text-slate-400">{mat.duration} min</span>}
                    </div>
                  ))}
                </div>
              )}

              {matForms[String(mi)]?.open ? (
                <div className="ml-11 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Material title" value={matForms[String(mi)]?.title ?? ''} onChange={e => setMatForms(f => ({ ...f, [mi]: { ...f[String(mi)], title: e.target.value } }))} />
                    <select className="input" value={matForms[String(mi)]?.type ?? 'video'} onChange={e => setMatForms(f => ({ ...f, [mi]: { ...f[String(mi)], type: e.target.value as any } }))}>
                      {['video', 'pdf', 'text', 'link'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <input className="input" placeholder="URL" value={matForms[String(mi)]?.url ?? ''} onChange={e => setMatForms(f => ({ ...f, [mi]: { ...f[String(mi)], url: e.target.value } }))} />
                  <div className="flex gap-2">
                    <button className="btn-primary text-xs py-2" onClick={() => {
                      const mat = matForms[String(mi)];
                      coursesAPI.addModule(courseId!, { ...mod, materials: [...mod.materials, { title: mat.title, type: mat.type, url: mat.url }] })
                        .then(() => { qc.invalidateQueries({ queryKey: ['course', courseId] }); setMatForms(f => ({ ...f, [mi]: { ...f[String(mi)], open: false } })); });
                    }}>Save material</button>
                    <button className="btn-secondary text-xs py-2" onClick={() => setMatForms(f => ({ ...f, [mi]: { ...f[String(mi)], open: false } }))}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="ml-11 text-xs text-indigo-600 hover:text-indigo-500 font-semibold transition"
                  onClick={() => setMatForms(f => ({ ...f, [mi]: { open: true, title: '', type: 'video', url: '' } }))}>
                  + Add material
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
