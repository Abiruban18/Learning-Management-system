import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';

const links = [
  { to: '/teacher/dashboard', label: 'Dashboard',    icon: '⬡' },
  { to: '/teacher/courses',   label: 'My Courses',   icon: '◈' },
  { to: '/teacher/students',  label: 'Students',     icon: '◉' },
  { to: '/teacher/quizzes',   label: 'Quizzes',      icon: '◎' },
  { to: '/teacher/ai-quiz',   label: 'AI Generator', icon: '✦' },
  { to: '/teacher/analytics', label: 'Analytics',    icon: '📊' },
  { to: '/teacher/settings',  label: 'Settings',     icon: '◌' },
  { to: '/teacher/profile',   label: 'My Profile',   icon: '👤' },
];

export default function TeacherLayout() {
  const { user, clearAuth } = useAuthStore();
  const nav = useNavigate();
  const qc  = useQueryClient();
  const logout = () => { clearAuth(); qc.clear(); nav('/login'); };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col bg-white dark:bg-slate-800 border-r border-indigo-100/60 dark:border-slate-700 shadow-[2px_0_16px_rgba(99,102,241,0.06)]">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-indigo-100/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
              <span className="text-white font-black text-sm">EQ</span>
            </div>
            <div>
              <div className="text-slate-800 font-bold text-base leading-none">EduQuest</div>
              <div className="text-xs font-semibold mt-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Teacher Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          <div className="px-3 mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation</span>
          </div>
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-indigo-100/60">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-slate-50 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
              {user?.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={logout} className="w-full text-xs py-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 border border-slate-200 hover:border-red-200 transition-all duration-200 font-medium">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex items-center justify-between px-8 py-4 border-b border-indigo-100/60 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back, <span className="text-slate-800 dark:text-slate-100 font-semibold">{user?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1"><Outlet /></div>
      </main>
    </div>
  );
}
