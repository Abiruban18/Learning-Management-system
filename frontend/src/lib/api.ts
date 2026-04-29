import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data: object) => api.post('/auth/register', data),
  login:    (data: object) => api.post('/auth/login', data),
  me:       ()             => api.get('/auth/me'),
  refresh:  ()             => api.post('/auth/refresh'),
  logout:   ()             => api.post('/auth/logout'),
};

export const coursesAPI = {
  list:      ()                          => api.get('/courses'),
  byId:      (id: string)                => api.get(`/courses/${id}`),
  mine:      ()                          => api.get('/teacher/courses'),
  create:    (data: object)              => api.post('/courses', data),
  update:    (id: string, data: object)  => api.put(`/courses/${id}`, data),
  remove:    (id: string)                => api.delete(`/courses/${id}`),
  addModule: (id: string, data: object)  => api.post(`/courses/${id}/modules`, data),
  students:  (id: string)                => api.get(`/courses/${id}/students`),
  download:  (courseId: string, materialTitle: string) => api.post(`/courses/${courseId}/materials/download`, { courseId, materialTitle }),
  downloads: (id: string)                => api.get(`/courses/${id}/downloads`),
  reviews:   (courseId: string)          => api.get(`/courses/${courseId}/reviews`),
  addReview: (courseId: string, data: object) => api.post(`/courses/${courseId}/reviews`, data),
};

export const enrollAPI = {
  enroll: (courseId: string) => api.post('/enrollments', { courseId }),
  mine:   ()                  => api.get('/enrollments/mine'),
};

export const progressAPI = {
  get:          (courseId: string) => api.get(`/progress/${courseId}`),
  completeTask: (data: object)     => api.post('/progress/complete', data),
};

export const quizAPI = {
  byCourse:    (courseId: string) => api.get(`/quizzes/course/${courseId}`),
  byId:        (id: string)       => api.get(`/quizzes/${id}`),
  create:      (data: object)     => api.post('/quizzes', data),
  submit:      (data: object)     => api.post('/quizzes/submit', data),
  leaderboard: (quizId: string)   => api.get(`/quizzes/${quizId}/leaderboard`),
};

export const activityAPI = {
  log:     (data: object) => api.post('/activity/log', data),
  summary: ()              => api.get('/activity/summary'),
};

export const settingsAPI = {
  get:    () => api.get('/settings'),
  update: (data: object) => api.put('/settings', data),
};

export const badgeAPI = {
  mine:              () => api.get('/badges'),
  globalLeaderboard: () => api.get('/leaderboard/global'),
};

export const certificateAPI = {
  mine:     () => api.get('/certificates'),
  download: (id: string) => api.get(`/certificates/${id}/download`, { responseType: 'blob' }),
};

export const notificationAPI = {
  list:     () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAll:  () => api.patch('/notifications/all/read'),
};

export const aiAPI = {
  generateQuiz:  (data: object)      => api.post('/ai/generate-quiz', data),
  smartFeedback: (attemptId: string) => api.get(`/ai/feedback/${attemptId}`),
  learningPath:  ()                  => api.get('/ai/learning-path'),
};

export const gamesAPI = {
  awardXp: (xp: number, gameType: string) => api.post('/games/award-xp', { xp, gameType }),
};

export const profileAPI = {
  get:    ()             => api.get('/profile'),
  update: (data: object) => api.put('/profile', data),
};

export const analyticsAPI = {
  teacher:      ()             => api.get('/analytics/teacher'),
  weeklyReport: ()             => api.get('/analytics/weekly-report'),
};

export const dailyChallengeAPI = {
  get:    ()                      => api.get('/daily-challenge'),
  submit: (answerIndex: number)   => api.post('/daily-challenge/submit', { answerIndex }),
};

export const leaderboardAPI = {
  global: ()                    => api.get('/leaderboard/global'),
  course: (courseId: string)    => api.get(`/leaderboard/course/${courseId}`),
};
