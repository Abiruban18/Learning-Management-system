import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ActivityLog from '../models/ActivityLog';
import { checkAndAwardBadges } from '../services/badgeService';

const POOL = [
  { q: 'What does CPU stand for?', opts: ['Central Processing Unit','Computer Personal Unit','Core Processing Unit','Central Program Utility'], ans: 0, exp: 'CPU = Central Processing Unit, the brain of a computer.' },
  { q: 'Which data structure uses LIFO?', opts: ['Queue','Stack','Array','Tree'], ans: 1, exp: 'A Stack uses Last In, First Out (LIFO) ordering.' },
  { q: 'What is the time complexity of binary search?', opts: ['O(n)','O(n²)','O(log n)','O(1)'], ans: 2, exp: 'Binary search halves the search space each step: O(log n).' },
  { q: 'Which planet is closest to the Sun?', opts: ['Venus','Earth','Mercury','Mars'], ans: 2, exp: 'Mercury is the closest planet to the Sun.' },
  { q: 'What does HTTP stand for?', opts: ['HyperText Transfer Protocol','High Tech Transfer Process','HyperText Transmission Protocol','Home Tool Transfer Protocol'], ans: 0, exp: 'HTTP = HyperText Transfer Protocol.' },
  { q: 'Which gas do plants absorb during photosynthesis?', opts: ['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'], ans: 2, exp: 'Plants absorb CO₂ and release O₂ during photosynthesis.' },
  { q: 'What is 2^10?', opts: ['512','1024','2048','256'], ans: 1, exp: '2^10 = 1024, also known as 1 Kilobyte.' },
  { q: 'Which language runs natively in browsers?', opts: ['Python','Java','JavaScript','C++'], ans: 2, exp: 'JavaScript is the only language that runs natively in web browsers.' },
  { q: 'What does SQL stand for?', opts: ['Structured Query Language','Simple Query Language','Standard Query Logic','Sequential Query Language'], ans: 0, exp: 'SQL = Structured Query Language for databases.' },
  { q: 'Who wrote Romeo and Juliet?', opts: ['Charles Dickens','William Shakespeare','Jane Austen','Mark Twain'], ans: 1, exp: 'Romeo and Juliet was written by William Shakespeare.' },
  { q: 'What is the powerhouse of the cell?', opts: ['Nucleus','Ribosome','Mitochondria','Golgi body'], ans: 2, exp: 'The mitochondria is the powerhouse of the cell.' },
  { q: 'What does RAM stand for?', opts: ['Random Access Memory','Read Access Module','Rapid Array Memory','Random Array Module'], ans: 0, exp: 'RAM = Random Access Memory, temporary fast storage.' },
  { q: 'What is the speed of light (approx)?', opts: ['3×10⁶ m/s','3×10⁸ m/s','3×10¹⁰ m/s','3×10⁴ m/s'], ans: 1, exp: 'The speed of light is approximately 3×10⁸ meters per second.' },
  { q: 'What does OOP stand for?', opts: ['Object Oriented Programming','Open Output Protocol','Ordered Object Processing','Optional Output Parameter'], ans: 0, exp: 'OOP = Object Oriented Programming.' },
  { q: 'What is Git used for?', opts: ['Database management','Version control','Web hosting','Code compilation'], ans: 1, exp: 'Git is a distributed version control system.' },
];

// Deterministic daily question based on day of year
function getTodayChallenge() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const item = POOL[dayOfYear % POOL.length];
  return {
    question: item.q,
    options: item.opts.map((text, i) => ({ text, isCorrect: i === item.ans })),
    explanation: item.exp,
    xpReward: 25,
    date: now.toISOString().split('T')[0],
  };
}

// Store completions in memory (keyed by userId+date) — lightweight, no extra model needed
const completions = new Map<string, boolean>();

export const getDailyChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `${req.user!.id}:${today}`;
    const completed = completions.get(key) ?? false;
    const challenge = getTodayChallenge();

    // Strip isCorrect if not yet completed
    const safeOptions = completed
      ? challenge.options
      : challenge.options.map(o => ({ text: o.text }));

    res.json({ challenge: { ...challenge, options: safeOptions }, completed });
  } catch (err) { res.status(500).json({ message: 'Fetch failed', error: err }); }
};

export const submitDailyChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `${req.user!.id}:${today}`;

    if (completions.get(key)) {
      res.status(409).json({ message: 'Already completed today' }); return;
    }

    const { answerIndex } = req.body;
    const challenge = getTodayChallenge();
    const correct = challenge.options[answerIndex]?.isCorrect === true;

    if (correct) {
      completions.set(key, true);
      await ActivityLog.findOneAndUpdate(
        { student: req.user!.id, date: today },
        { $inc: { xpGained: challenge.xpReward } },
        { upsert: true, new: true }
      );
      await checkAndAwardBadges(req.user!.id, { totalXp: challenge.xpReward });
    }

    res.json({ correct, xpEarned: correct ? challenge.xpReward : 0, explanation: challenge.explanation });
  } catch (err) { res.status(500).json({ message: 'Submit failed', error: err }); }
};
