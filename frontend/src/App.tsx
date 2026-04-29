import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { RequireTeacher, RequireStudent, RedirectIfAuthed } from './components/guards/RouteGuards';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';
import AuthPage from './pages/AuthPage';

// Teacher pages
import TeacherDashboard       from './pages/teacher/TeacherDashboard';
import TeacherCourses         from './pages/teacher/TeacherCourses';
import CourseModuleManager    from './pages/teacher/CourseModuleManager';
import CourseStudents         from './pages/teacher/CourseStudents';
import TeacherStudents        from './pages/teacher/TeacherStudents';
import TeacherQuizBuilder     from './pages/teacher/TeacherQuizBuilder';
import TeacherQuizLeaderboard from './pages/teacher/TeacherQuizLeaderboard';
import TeacherSettings        from './pages/teacher/TeacherSettings';
import AIQuizGenerator        from './pages/teacher/AIQuizGenerator';

// Student pages
import StudentDashboard    from './pages/student/StudentDashboard';
import StudentCourseList   from './pages/student/StudentCourseList';
import MyLearning          from './pages/student/MyLearning';
import StudentCoursePage   from './pages/student/StudentCoursePage';
import QuizEngine          from './pages/student/QuizEngine';
import StudentActivity     from './pages/student/StudentActivity';
import StudentBadges       from './pages/student/StudentBadges';
import StudentCertificates from './pages/student/StudentCertificates';
import GameZone            from './pages/student/GameZone';
import ProfilePage         from './pages/ProfilePage';
import DailyChallenge      from './pages/student/DailyChallenge';
import CourseLeaderboard   from './pages/student/CourseLeaderboard';
import TeacherAnalytics    from './pages/teacher/TeacherAnalytics';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           5 * 60 * 1000,
      gcTime:             10 * 60 * 1000,
      retry:               1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', background: '#1e293b', color: '#fff' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<RedirectIfAuthed />}>
            <Route path="/login"    element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
          </Route>

          <Route element={<RequireTeacher />}>
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="courses"   element={<TeacherCourses />} />
              <Route path="courses/:courseId/modules"  element={<CourseModuleManager />} />
              <Route path="courses/:courseId/students" element={<CourseStudents />} />
              <Route path="students"  element={<TeacherStudents />} />
              <Route path="quizzes"   element={<TeacherQuizBuilder />} />
              <Route path="quizzes/:quizId/leaderboard" element={<TeacherQuizLeaderboard />} />
              <Route path="ai-quiz"   element={<AIQuizGenerator />} />
              <Route path="analytics" element={<TeacherAnalytics />} />
              <Route path="settings"  element={<TeacherSettings />} />
              <Route path="profile"   element={<ProfilePage />} />
            </Route>
          </Route>

          <Route element={<RequireStudent />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"              element={<StudentDashboard />} />
              <Route path="courses"                element={<StudentCourseList />} />
              <Route path="my-learning"            element={<MyLearning />} />
              <Route path="my-learning/:courseId"  element={<StudentCoursePage />} />
              <Route path="activity"               element={<StudentActivity />} />
              <Route path="badges"                 element={<StudentBadges />} />
              <Route path="certificates"           element={<StudentCertificates />} />
              <Route path="games"                  element={<GameZone />} />
              <Route path="daily-challenge"        element={<DailyChallenge />} />
              <Route path="my-learning/:courseId/leaderboard" element={<CourseLeaderboard />} />
              <Route path="profile"                element={<ProfilePage />} />
            </Route>
            <Route path="/student/quiz/:quizId" element={<QuizEngine />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
