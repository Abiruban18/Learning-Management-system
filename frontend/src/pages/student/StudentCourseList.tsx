import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesAPI, enrollAPI } from '../../lib/api';
import { Course, Enrollment } from '../../types';
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

export default function StudentCourseList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const { data: coursesData } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => coursesAPI.list().then(r => r.data.courses as Course[]),
  });
  const { data: enrollData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollAPI.mine().then(r => r.data.enrollments as Enrollment[]),
  });
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => enrollAPI.enroll(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-enrollments'] }),
  });

  const allCourses = coursesData ?? [];
  const allTags = [...new Set(allCourses.flatMap(c => c.tags))].slice(0, 10);
  const courses = allCourses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchTag = !activeTag || c.tags.includes(activeTag);
    return matchSearch && matchTag;
  });
  const enrolledIds = new Set((enrollData ?? []).map(e => e.course?._id).filter(Boolean));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">Browse Courses</h1>
        <p className="text-slate-500">Discover and enroll in courses to start earning XP</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input className="input pl-10" placeholder="Search by title or tag…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tag pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', ...allTags].map(tag => {
            const isAll = tag === 'All';
            const active = isAll ? !activeTag : activeTag === tag;
            return (
              <button key={tag} onClick={() => setActiveTag(isAll ? '' : tag === activeTag ? '' : tag)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-200 ${
                  active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}>
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-500">{search || activeTag ? 'No courses match your filters.' : 'No courses available yet.'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(c => {
            const enrolled = enrolledIds.has(c._id);
            const teacher  = typeof c.teacher === 'object' ? c.teacher.name : 'Instructor';
            return (
              <div key={c._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
                {/* Cover */}
                <div className="relative h-44 overflow-hidden">
                  <img src={getCover(c._id)} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {enrolled && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      ✓ Enrolled
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                    {c.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-5">
                  <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 leading-snug">{c.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{c.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <span>👤 {teacher}</span>
                    <span>·</span>
                    <span>{c.modules.length} modules</span>
                    <span>·</span>
                    <span>{c.totalDuration} min</span>
                  </div>
                  {enrolled ? (
                    <Link to={`/student/my-learning/${c._id}`} className="btn-student w-full justify-center text-sm">Continue learning →</Link>
                  ) : (
                    <button className="btn-primary w-full justify-center text-sm" onClick={() => enrollMutation.mutate(c._id)} disabled={enrollMutation.isPending}>
                      {enrollMutation.isPending ? (
                        <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Enrolling…</span>
                      ) : 'Enroll for free'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
