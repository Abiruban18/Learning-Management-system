import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI, badgeAPI, certificateAPI, activityAPI, coursesAPI, enrollAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Badge, Certificate, ActivityLog, Course, Enrollment } from '../types';
import toast from 'react-hot-toast';

const AVATARS = ['👨‍💻','👩‍💻','🧑‍🎓','👨‍🏫','👩‍🏫','🧑‍🔬','👨‍🎨','👩‍🎨','🧑‍💼','👨‍🚀','👩‍🚀','🦸','🧙','🎓','🏆'];

export default function ProfilePage() {
  const { user: authUser, setAuth, token } = useAuthStore();
  const qc = useQueryClient();
  const isStudent = authUser?.role === 'student';
  const isTeacher = authUser?.role === 'teacher';

  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(authUser?.name ?? '');
  const [avatar, setAvatar]     = useState(authUser?.avatar ?? '');
  const [showAvatars, setShowAv] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileAPI.get().then(r => r.data.user),
  });

  // Student-specific data
  const { data: badgeData } = useQuery({
    queryKey: ['my-badges'],
    queryFn: () => badgeAPI.mine().then(r => r.data),
    enabled: isStudent,
  });
  const { data: certData } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateAPI.mine().then(r => r.data.certificates as Certificate[]),
    enabled: isStudent,
  });
  const { data: actData } = useQuery({
    queryKey: ['activity-summary'],
    queryFn: () => activityAPI.summary().then(r => r.data.logs as ActivityLog[]),
    enabled: isStudent,
  });
  const { data: enrollData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollAPI.mine().then(r => r.data.enrollments as Enrollment[]),
    enabled: isStudent,
  });

  // Teacher-specific data
  const { data: coursesData } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => coursesAPI.mine().then(r => r.data.courses as Course[]),
    enabled: isTeacher,
  });

  const updateMutation = useMutation({
    mutationFn: () => profileAPI.update({ name, avatar }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      // Update auth store with new name/avatar
      if (authUser && token) {
        setAuth(token, { ...authUser, name: res.data.user.name, avatar: res.data.user.avatar });
      }
      setEditing(false);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Update failed'),
  });

  const profile = profileData ?? authUser;
  const badges: Badge[] = badgeData?.badges ?? [];
  const certs: Certificate[] = certData ?? [];
  const logs: ActivityLog[] = actData ?? [];
  const enrollments: Enrollment[] = enrollData ?? [];
  const courses: Course[] = coursesData ?? [];

  const totalXp    = badgeData?.totalXp ?? logs.reduce((s, l) => s + l.xpGained, 0);
  const level      = badgeData?.level ?? 1;
  const rank       = badgeData?.rank ?? 'Beginner';
  const streak     = logs[0]?.streak ?? 0;
  const totalMins  = logs.reduce((s, l) => s + l.timeSpentMinutes, 0);
  const activeDays = logs.length;

  const displayAvatar = avatar || profile?.avatar;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">My Profile</h1>
        <p className="text-slate-500">Your account details and achievements</p>
      </div>

      {/* Profile card */}
      <div className="card mb-6 bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-4xl shadow-lg cursor-pointer"
              onClick={() => editing && setShowAv(s => !s)}>
              {displayAvatar || authUser?.name[0]?.toUpperCase()}
            </div>
            {editing && (
              <button onClick={() => setShowAv(s => !s)}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center shadow">
                ✏
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Display Name</label>
                  <input className="input max-w-xs" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary text-sm py-2">
                    {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                  <button onClick={() => { setEditing(false); setName(authUser?.name ?? ''); setAvatar(authUser?.avatar ?? ''); }} className="btn-secondary text-sm py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black text-slate-800">{profile?.name}</h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    isTeacher ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  }`}>
                    {isTeacher ? '🏫 Teacher' : '🎓 Student'}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-3">{profile?.email}</p>
                {isStudent && <p className="text-sm font-semibold text-indigo-600">{rank} · Level {level}</p>}
                {isTeacher && <p className="text-sm font-semibold text-indigo-600">{courses.length} courses published</p>}
                <button onClick={() => setEditing(true)} className="btn-secondary text-xs py-1.5 px-3 mt-2">✏ Edit profile</button>
              </>
            )}
          </div>

          {/* Member since */}
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-400">Member since</div>
            <div className="text-sm font-semibold text-slate-600">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>

        {/* Avatar picker */}
        {showAvatars && editing && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-200">
            <p className="text-xs font-semibold text-slate-500 mb-3">Choose an avatar</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button key={a} onClick={() => { setAvatar(a); setShowAv(false); }}
                  className={`w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all ${avatar === a ? 'bg-indigo-100 border-2 border-indigo-500 scale-110' : 'bg-slate-100 hover:bg-indigo-50 border border-slate-200'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── STUDENT STATS ── */}
      {isStudent && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total XP',     value: totalXp.toLocaleString(), icon: '⭐', bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700'   },
              { label: 'Day Streak',   value: `${streak} 🔥`,           icon: '🔥', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700'  },
              { label: 'Active Days',  value: activeDays,               icon: '📅', bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700'    },
              { label: 'Total Hours',  value: `${Math.round(totalMins / 60)}h`, icon: '⏱', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
            ].map(({ label, value, bg, text }) => (
              <div key={label} className={`card-gradient border ${bg}`}>
                <div className={`text-3xl font-black ${text} mb-1`}>{value}</div>
                <div className="text-xs text-slate-500 font-medium">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Enrollments */}
            <div className="card">
              <h2 className="font-bold text-slate-800 mb-4">📚 Enrolled Courses ({enrollments.length})</h2>
              {enrollments.length === 0 ? <p className="text-slate-400 text-sm">No courses yet</p> : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {enrollments.map(e => (
                    <div key={e._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-700 truncate flex-1">{e.course.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-2 shrink-0 ${
                        e.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>{e.completionPercent}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certificates */}
            <div className="card">
              <h2 className="font-bold text-slate-800 mb-4">🎓 Certificates ({certs.length})</h2>
              {certs.length === 0 ? <p className="text-slate-400 text-sm">No certificates yet</p> : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {certs.map(c => (
                    <div key={c._id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xl">🎓</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">{c.course.title}</div>
                        <div className="text-xs text-slate-400">{new Date(c.issuedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="card">
            <h2 className="font-bold text-slate-800 mb-4">🏅 Badges ({badges.length})</h2>
            {badges.length === 0 ? <p className="text-slate-400 text-sm">No badges yet — complete tasks to earn them!</p> : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {badges.map(b => (
                  <div key={b._id} className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl text-center">
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-xs font-semibold text-slate-700 leading-tight">{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TEACHER STATS ── */}
      {isTeacher && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Courses',   value: courses.length,                                    bg: 'bg-indigo-50 border-indigo-200',  text: 'text-indigo-700'  },
              { label: 'Published',       value: courses.filter(c => c.isPublished).length,         bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
              { label: 'Total Modules',   value: courses.reduce((s, c) => s + c.modules.length, 0), bg: 'bg-violet-50 border-violet-200',  text: 'text-violet-700'  },
            ].map(({ label, value, bg, text }) => (
              <div key={label} className={`card-gradient border ${bg}`}>
                <div className={`text-3xl font-black ${text} mb-1`}>{value}</div>
                <div className="text-xs text-slate-500 font-medium">{label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="font-bold text-slate-800 mb-4">📚 My Courses</h2>
            {courses.length === 0 ? <p className="text-slate-400 text-sm">No courses yet</p> : (
              <div className="space-y-2">
                {courses.map(c => (
                  <div key={c._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{c.title}</div>
                      <div className="text-xs text-slate-400">{c.modules.length} modules · {c.totalDuration} min</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      c.isPublished ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-amber-100 border-amber-300 text-amber-700'
                    }`}>{c.isPublished ? 'Published' : 'Draft'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
