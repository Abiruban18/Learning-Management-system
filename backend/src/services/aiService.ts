import OpenAI from 'openai';

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getClient(): OpenAI {
  if (!openai) throw new Error('OpenAI API key not configured');
  return openai;
}

export interface GeneratedQuestion {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  points: number;
  timeLimitSeconds: number;
  explanation: string;
}

export async function generateQuizQuestions(
  topic: string,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<GeneratedQuestion[]> {
  const prompt = `Generate ${count} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty.
Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "question": "...",
    "options": [
      {"text": "...", "isCorrect": false},
      {"text": "...", "isCorrect": true},
      {"text": "...", "isCorrect": false},
      {"text": "...", "isCorrect": false}
    ],
    "points": 10,
    "timeLimitSeconds": 30,
    "explanation": "Brief explanation of the correct answer"
  }
]
Rules:
- Exactly 4 options per question
- Exactly 1 correct option per question
- Points: easy=5, medium=10, hard=15
- timeLimitSeconds: easy=45, medium=30, hard=20`;

  const response = await getClient().chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content ?? '[]';
  return JSON.parse(content) as GeneratedQuestion[];
}

export async function generateSmartFeedback(
  quizTitle: string,
  questions: { question: string; correct: boolean; explanation?: string }[]
): Promise<string> {
  const wrongOnes = questions.filter(q => !q.correct).map(q => q.question);
  if (wrongOnes.length === 0) return 'Perfect score! You have mastered this topic.';
  if (!openai) return 'Review the topics you missed and try again!';

  const prompt = `A student took a quiz on "${quizTitle}" and got these questions wrong:
${wrongOnes.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Give a short, encouraging 2-3 sentence feedback explaining what concepts to review and how to improve. Be specific and actionable.`;

  const response = await getClient().chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content ?? 'Review the topics you missed and try again!';
}

export async function generateLearningPath(
  enrolledCourses: string[],
  completedCourses: string[],
  weakTopics: string[]
): Promise<string> {
  if (!openai) return 'Keep learning and focus on your weak areas!';

  const prompt = `A student on an EdTech platform has:
- Enrolled in: ${enrolledCourses.join(', ') || 'none'}
- Completed: ${completedCourses.join(', ') || 'none'}
- Weak topics based on quiz performance: ${weakTopics.join(', ') || 'none identified'}

Suggest a personalized 3-step learning path in 2-3 sentences. Be concise and motivating.`;

  const response = await getClient().chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content ?? 'Keep learning and focus on your weak areas!';
}
