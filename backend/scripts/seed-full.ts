/**
 * Full database seed — wipes everything and creates:
 *   3 teachers  (5 courses each = 15 courses total)
 *   10 students (all enrolled in all 15 courses)
 *     - students 1-3  : POWER users — many certs, high XP, long streaks, all badges
 *     - students 4-7  : MEDIUM users — some courses completed, moderate activity
 *     - students 8-10 : LIGHT users  — recently joined, low activity
 *
 * Password for everyone: password123
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../src/models/User';
import Course from '../src/models/Course';
import Enrollment from '../src/models/Enrollment';
import Quiz from '../src/models/Quiz';
import { CourseProgress, QuizAttempt } from '../src/models/Progress';
import ActivityLog from '../src/models/ActivityLog';
import Certificate from '../src/models/Certificate';
import Badge from '../src/models/Badge';

// ── helpers ──────────────────────────────────────────────────────────────────
const rand  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const uid   = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// ── course catalogue ─────────────────────────────────────────────────────────
const TEACHER_COURSES: Record<string, { title: string; description: string; tags: string[]; modules: { title: string; materials: string[] }[] }[]> = {
  'teacher1@eduquest.com': [
    { title: 'Full Stack Web Development', description: 'Master HTML, CSS, JavaScript, React and Node.js from scratch to production.', tags: ['javascript','react','nodejs','fullstack'],
      modules: [{ title: 'HTML & CSS Fundamentals', materials: ['Intro Video','Box Model PDF','Flexbox Exercise'] }, { title: 'JavaScript Deep Dive', materials: ['ES6+ Video','Async/Await PDF','DOM Project'] }, { title: 'React & Node Backend', materials: ['React Hooks Video','Express API PDF','Full App Project'] }] },
    { title: 'Advanced TypeScript', description: 'Deep dive into TypeScript generics, decorators, and advanced patterns.', tags: ['typescript','javascript','advanced'],
      modules: [{ title: 'Type System Basics', materials: ['Types Video','Interfaces PDF','Exercise'] }, { title: 'Generics & Utility Types', materials: ['Generics Video','Mapped Types PDF','Project'] }, { title: 'Decorators & Metadata', materials: ['Decorators Video','Reflect PDF','Final Project'] }] },
    { title: 'React Native Mobile Dev', description: 'Build cross-platform mobile apps with React Native and Expo.', tags: ['react-native','mobile','expo'],
      modules: [{ title: 'Setup & Navigation', materials: ['Setup Video','Navigation PDF','App Exercise'] }, { title: 'State & APIs', materials: ['Redux Video','REST PDF','API Project'] }, { title: 'Publishing Apps', materials: ['Build Video','Store PDF','Deploy Project'] }] },
    { title: 'GraphQL API Design', description: 'Design and build production-ready GraphQL APIs with Node.js.', tags: ['graphql','api','nodejs'],
      modules: [{ title: 'GraphQL Basics', materials: ['Intro Video','Schema PDF','Query Exercise'] }, { title: 'Resolvers & Mutations', materials: ['Resolvers Video','Mutations PDF','API Project'] }, { title: 'Auth & Subscriptions', materials: ['Auth Video','Subscriptions PDF','Final Project'] }] },
    { title: 'Testing with Jest & Cypress', description: 'Write unit, integration and E2E tests for modern web applications.', tags: ['testing','jest','cypress'],
      modules: [{ title: 'Unit Testing', materials: ['Jest Video','Mocking PDF','Unit Exercise'] }, { title: 'Integration Tests', materials: ['Integration Video','Supertest PDF','API Tests'] }, { title: 'E2E with Cypress', materials: ['Cypress Video','Commands PDF','E2E Project'] }] },
  ],
  'teacher2@eduquest.com': [
    { title: 'Python for Data Science', description: 'Learn Python, NumPy, Pandas, Matplotlib and build real ML models.', tags: ['python','data-science','machine-learning'],
      modules: [{ title: 'Python Basics', materials: ['Variables Video','Functions PDF','OOP Exercise'] }, { title: 'Data Analysis', materials: ['Pandas Video','NumPy PDF','EDA Project'] }, { title: 'Machine Learning 101', materials: ['Regression Video','Classification PDF','Model Project'] }] },
    { title: 'Deep Learning with PyTorch', description: 'Build neural networks and train deep learning models from scratch.', tags: ['deep-learning','pytorch','ai'],
      modules: [{ title: 'Neural Networks', materials: ['Perceptron Video','Backprop PDF','NN Exercise'] }, { title: 'CNNs & RNNs', materials: ['CNN Video','RNN PDF','Image Project'] }, { title: 'Transfer Learning', materials: ['Transfer Video','Fine-tuning PDF','Final Project'] }] },
    { title: 'Data Engineering with Spark', description: 'Process big data pipelines using Apache Spark and Python.', tags: ['spark','big-data','python'],
      modules: [{ title: 'Spark Fundamentals', materials: ['RDD Video','DataFrames PDF','Spark Exercise'] }, { title: 'Streaming Data', materials: ['Kafka Video','Streaming PDF','Pipeline Project'] }, { title: 'Spark ML', materials: ['MLlib Video','Pipelines PDF','Final Project'] }] },
    { title: 'SQL & Database Design', description: 'Master relational databases, SQL queries and schema design.', tags: ['sql','database','postgresql'],
      modules: [{ title: 'SQL Basics', materials: ['SELECT Video','JOINs PDF','Query Exercise'] }, { title: 'Advanced Queries', materials: ['Window Functions Video','CTEs PDF','Analytics Project'] }, { title: 'Schema Design', materials: ['Normalization Video','Indexes PDF','Design Project'] }] },
    { title: 'Statistics for Data Science', description: 'Probability, hypothesis testing and statistical inference for data scientists.', tags: ['statistics','probability','data-science'],
      modules: [{ title: 'Probability Theory', materials: ['Distributions Video','Bayes PDF','Probability Exercise'] }, { title: 'Hypothesis Testing', materials: ['T-tests Video','ANOVA PDF','Testing Project'] }, { title: 'Regression Analysis', materials: ['Linear Reg Video','Logistic PDF','Final Project'] }] },
  ],
  'teacher3@eduquest.com': [
    { title: 'UI/UX Design Masterclass', description: 'Design beautiful interfaces using Figma and understand user psychology.', tags: ['design','figma','ux'],
      modules: [{ title: 'Design Principles', materials: ['Color Theory Video','Typography PDF','Wireframe Exercise'] }, { title: 'Figma Essentials', materials: ['Components Video','Auto Layout PDF','Design System Project'] }, { title: 'User Research', materials: ['Interviews Video','Usability PDF','Case Study'] }] },
    { title: 'Cloud & DevOps Fundamentals', description: 'Deploy apps on AWS, automate with Docker & Kubernetes, set up CI/CD.', tags: ['aws','docker','devops'],
      modules: [{ title: 'Linux & Networking', materials: ['Shell Video','Networking PDF','SSH Exercise'] }, { title: 'Docker & Containers', materials: ['Docker Video','Compose PDF','Container Project'] }, { title: 'AWS & CI/CD', materials: ['EC2 Video','GitHub Actions PDF','Deploy Project'] }] },
    { title: 'Cybersecurity Essentials', description: 'Learn ethical hacking, penetration testing and security best practices.', tags: ['security','hacking','networking'],
      modules: [{ title: 'Network Security', materials: ['Protocols Video','Firewalls PDF','Network Exercise'] }, { title: 'Web Security', materials: ['OWASP Video','XSS PDF','Pentest Project'] }, { title: 'Cryptography', materials: ['Encryption Video','PKI PDF','Crypto Project'] }] },
    { title: 'Kubernetes & Microservices', description: 'Orchestrate containerized microservices with Kubernetes in production.', tags: ['kubernetes','microservices','docker'],
      modules: [{ title: 'K8s Basics', materials: ['Pods Video','Services PDF','K8s Exercise'] }, { title: 'Deployments & Scaling', materials: ['Deployments Video','HPA PDF','Scale Project'] }, { title: 'Helm & GitOps', materials: ['Helm Video','ArgoCD PDF','GitOps Project'] }] },
    { title: 'Blockchain Development', description: 'Build smart contracts and decentralized apps on Ethereum.', tags: ['blockchain','solidity','web3'],
      modules: [{ title: 'Blockchain Basics', materials: ['Consensus Video','Wallets PDF','Chain Exercise'] }, { title: 'Solidity Smart Contracts', materials: ['Solidity Video','ERC20 PDF','Contract Project'] }, { title: 'DApp Development', materials: ['Web3.js Video','Ethers PDF','DApp Project'] }] },
  ],
};

// ── Course-specific quiz questions ───────────────────────────────────────────
const COURSE_QUIZZES: Record<string, { moduleTitle: string; questions: any[] }[]> = {
  'Full Stack Web Development': [
    { moduleTitle: 'HTML & CSS Fundamentals', questions: [
      { question: 'What does HTML stand for?', options: [{ text: 'HyperText Markup Language', isCorrect: true },{ text: 'High Tech Modern Language', isCorrect: false },{ text: 'Home Tool Markup Language', isCorrect: false },{ text: 'HyperText Modern Links', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'HTML = HyperText Markup Language, the standard for web pages.' },
      { question: 'Which CSS property controls text size?', options: [{ text: 'font-size', isCorrect: true },{ text: 'text-size', isCorrect: false },{ text: 'font-weight', isCorrect: false },{ text: 'text-style', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'font-size sets the size of the text.' },
      { question: 'What does CSS Flexbox primarily control?', options: [{ text: 'Layout and alignment of elements', isCorrect: true },{ text: 'Text color', isCorrect: false },{ text: 'Animation speed', isCorrect: false },{ text: 'Font loading', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Flexbox is a CSS layout model for aligning items in rows or columns.' },
    ]},
    { moduleTitle: 'JavaScript Deep Dive', questions: [
      { question: 'Which keyword declares a constant in JavaScript?', options: [{ text: 'const', isCorrect: true },{ text: 'var', isCorrect: false },{ text: 'let', isCorrect: false },{ text: 'def', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'const declares a block-scoped constant that cannot be reassigned.' },
      { question: 'What does async/await do in JavaScript?', options: [{ text: 'Handles asynchronous operations more cleanly', isCorrect: true },{ text: 'Speeds up synchronous code', isCorrect: false },{ text: 'Declares variables', isCorrect: false },{ text: 'Creates loops', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'async/await is syntactic sugar over Promises for cleaner async code.' },
      { question: 'What is the DOM?', options: [{ text: 'Document Object Model', isCorrect: true },{ text: 'Data Object Manager', isCorrect: false },{ text: 'Dynamic Output Module', isCorrect: false },{ text: 'Document Output Method', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'The DOM is a programming interface for HTML documents.' },
    ]},
    { moduleTitle: 'React & Node Backend', questions: [
      { question: 'What is a React Hook?', options: [{ text: 'A function that lets you use state in functional components', isCorrect: true },{ text: 'A CSS styling method', isCorrect: false },{ text: 'A database connector', isCorrect: false },{ text: 'A routing library', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Hooks let you use React features like state in functional components.' },
      { question: 'What does Express.js do?', options: [{ text: 'Provides a web framework for Node.js', isCorrect: true },{ text: 'Manages CSS styles', isCorrect: false },{ text: 'Compiles TypeScript', isCorrect: false },{ text: 'Handles database migrations', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Express is a minimal and flexible Node.js web application framework.' },
      { question: 'What is REST?', options: [{ text: 'Representational State Transfer', isCorrect: true },{ text: 'Remote Execution Standard Technology', isCorrect: false },{ text: 'Rapid Event Streaming Technology', isCorrect: false },{ text: 'Resource Encoding Standard Type', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'REST is an architectural style for designing networked applications.' },
    ]},
  ],
  'Advanced TypeScript': [
    { moduleTitle: 'Type System Basics', questions: [
      { question: 'What is TypeScript?', options: [{ text: 'A typed superset of JavaScript', isCorrect: true },{ text: 'A new programming language', isCorrect: false },{ text: 'A JavaScript framework', isCorrect: false },{ text: 'A CSS preprocessor', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'TypeScript is JavaScript with static type definitions.' },
      { question: 'What does an interface do in TypeScript?', options: [{ text: 'Defines the shape of an object', isCorrect: true },{ text: 'Creates a class instance', isCorrect: false },{ text: 'Imports modules', isCorrect: false },{ text: 'Handles errors', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Interfaces define contracts for object shapes in TypeScript.' },
      { question: 'What is the "any" type in TypeScript?', options: [{ text: 'A type that disables type checking', isCorrect: true },{ text: 'A type for numbers only', isCorrect: false },{ text: 'A type for arrays', isCorrect: false },{ text: 'A type for functions', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: '"any" opts out of type checking for a variable.' },
    ]},
    { moduleTitle: 'Generics & Utility Types', questions: [
      { question: 'What are TypeScript Generics?', options: [{ text: 'Reusable components that work with multiple types', isCorrect: true },{ text: 'Global variables', isCorrect: false },{ text: 'CSS utility classes', isCorrect: false },{ text: 'Database schemas', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Generics allow creating reusable components that work with any type.' },
      { question: 'What does Partial<T> do?', options: [{ text: 'Makes all properties of T optional', isCorrect: true },{ text: 'Makes all properties required', isCorrect: false },{ text: 'Removes all properties', isCorrect: false },{ text: 'Duplicates the type', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Partial<T> constructs a type with all properties of T set to optional.' },
      { question: 'What is a Mapped Type?', options: [{ text: 'A type that transforms properties of another type', isCorrect: true },{ text: 'A JavaScript Map object type', isCorrect: false },{ text: 'A geographic data type', isCorrect: false },{ text: 'A loop construct', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Mapped types create new types by transforming each property of an existing type.' },
    ]},
    { moduleTitle: 'Decorators & Metadata', questions: [
      { question: 'What is a TypeScript Decorator?', options: [{ text: 'A special declaration to modify classes or members', isCorrect: true },{ text: 'A CSS styling tool', isCorrect: false },{ text: 'A database trigger', isCorrect: false },{ text: 'A build tool plugin', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Decorators are a design pattern for modifying class behavior.' },
      { question: 'What does Reflect.metadata do?', options: [{ text: 'Stores metadata about classes and properties', isCorrect: true },{ text: 'Reflects light in 3D graphics', isCorrect: false },{ text: 'Creates database reflections', isCorrect: false },{ text: 'Mirrors array values', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Reflect.metadata is used to attach metadata to classes and properties.' },
      { question: 'Which decorator marks a class as injectable in NestJS?', options: [{ text: '@Injectable()', isCorrect: true },{ text: '@Component()', isCorrect: false },{ text: '@Service()', isCorrect: false },{ text: '@Inject()', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: '@Injectable() marks a class as a provider that can be injected.' },
    ]},
  ],
  'Python for Data Science': [
    { moduleTitle: 'Python Basics', questions: [
      { question: 'What is Python?', options: [{ text: 'A high-level interpreted programming language', isCorrect: true },{ text: 'A compiled systems language', isCorrect: false },{ text: 'A markup language', isCorrect: false },{ text: 'A database query language', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Python is a high-level, interpreted, general-purpose programming language.' },
      { question: 'How do you define a function in Python?', options: [{ text: 'def function_name():', isCorrect: true },{ text: 'function function_name()', isCorrect: false },{ text: 'func function_name()', isCorrect: false },{ text: 'define function_name()', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Python uses the "def" keyword to define functions.' },
      { question: 'What is a Python list?', options: [{ text: 'An ordered, mutable collection of items', isCorrect: true },{ text: 'An immutable sequence', isCorrect: false },{ text: 'A key-value store', isCorrect: false },{ text: 'A fixed-size array', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Lists are ordered, mutable collections that can hold any type.' },
    ]},
    { moduleTitle: 'Data Analysis', questions: [
      { question: 'What is a Pandas DataFrame?', options: [{ text: 'A 2D labeled data structure', isCorrect: true },{ text: 'A type of neural network', isCorrect: false },{ text: 'A Python list', isCorrect: false },{ text: 'A database table', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'DataFrame is Pandas\' core 2D data structure with labeled axes.' },
      { question: 'What does NumPy stand for?', options: [{ text: 'Numerical Python', isCorrect: true },{ text: 'New Python', isCorrect: false },{ text: 'Number Processing', isCorrect: false },{ text: 'Numpy Utility Module', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'NumPy = Numerical Python, a library for numerical computing.' },
      { question: 'What is EDA?', options: [{ text: 'Exploratory Data Analysis', isCorrect: true },{ text: 'Extended Data Architecture', isCorrect: false },{ text: 'Encoded Data Array', isCorrect: false },{ text: 'External Data Access', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'EDA is the process of analyzing datasets to summarize their main characteristics.' },
    ]},
    { moduleTitle: 'Machine Learning 101', questions: [
      { question: 'What is supervised learning?', options: [{ text: 'Learning from labeled training data', isCorrect: true },{ text: 'Learning without any data', isCorrect: false },{ text: 'Learning from unlabeled data', isCorrect: false },{ text: 'Learning through rewards', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Supervised learning uses labeled examples to train models.' },
      { question: 'What is overfitting?', options: [{ text: 'When a model performs well on training but poorly on new data', isCorrect: true },{ text: 'When a model is too simple', isCorrect: false },{ text: 'When training data is too large', isCorrect: false },{ text: 'When the model trains too slowly', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Overfitting occurs when a model memorizes training data instead of generalizing.' },
      { question: 'What does scikit-learn provide?', options: [{ text: 'Machine learning algorithms for Python', isCorrect: true },{ text: 'Deep learning frameworks', isCorrect: false },{ text: 'Database connectors', isCorrect: false },{ text: 'Web scraping tools', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'scikit-learn is a Python library with simple ML tools.' },
    ]},
  ],
  'SQL & Database Design': [
    { moduleTitle: 'SQL Basics', questions: [
      { question: 'What does SQL stand for?', options: [{ text: 'Structured Query Language', isCorrect: true },{ text: 'Simple Query Language', isCorrect: false },{ text: 'Standard Query Logic', isCorrect: false },{ text: 'Sequential Query Language', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'SQL = Structured Query Language for managing relational databases.' },
      { question: 'Which SQL clause filters rows?', options: [{ text: 'WHERE', isCorrect: true },{ text: 'HAVING', isCorrect: false },{ text: 'GROUP BY', isCorrect: false },{ text: 'ORDER BY', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'WHERE filters rows before grouping; HAVING filters after.' },
      { question: 'What does JOIN do in SQL?', options: [{ text: 'Combines rows from two or more tables', isCorrect: true },{ text: 'Deletes duplicate rows', isCorrect: false },{ text: 'Creates a new table', isCorrect: false },{ text: 'Sorts the result set', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'JOIN combines rows from tables based on a related column.' },
    ]},
    { moduleTitle: 'Advanced Queries', questions: [
      { question: 'What is a Window Function?', options: [{ text: 'A function that performs calculations across related rows', isCorrect: true },{ text: 'A function for GUI windows', isCorrect: false },{ text: 'A function that opens files', isCorrect: false },{ text: 'A function for date ranges', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Window functions compute values across a set of rows related to the current row.' },
      { question: 'What is a CTE?', options: [{ text: 'Common Table Expression', isCorrect: true },{ text: 'Computed Table Entry', isCorrect: false },{ text: 'Conditional Table Execution', isCorrect: false },{ text: 'Cached Table Element', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'A CTE is a temporary named result set defined within a query.' },
      { question: 'What does DISTINCT do?', options: [{ text: 'Returns only unique values', isCorrect: true },{ text: 'Sorts results', isCorrect: false },{ text: 'Counts rows', isCorrect: false },{ text: 'Joins tables', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'DISTINCT eliminates duplicate rows from the result set.' },
    ]},
    { moduleTitle: 'Schema Design', questions: [
      { question: 'What is database normalization?', options: [{ text: 'Organizing data to reduce redundancy', isCorrect: true },{ text: 'Making all columns the same size', isCorrect: false },{ text: 'Encrypting database data', isCorrect: false },{ text: 'Backing up the database', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Normalization organizes tables to minimize data redundancy.' },
      { question: 'What is a primary key?', options: [{ text: 'A unique identifier for each row', isCorrect: true },{ text: 'The first column in a table', isCorrect: false },{ text: 'An encrypted password', isCorrect: false },{ text: 'A foreign table reference', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'A primary key uniquely identifies each record in a table.' },
      { question: 'What does an index do?', options: [{ text: 'Speeds up data retrieval', isCorrect: true },{ text: 'Encrypts table data', isCorrect: false },{ text: 'Creates table backups', isCorrect: false },{ text: 'Validates data types', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Indexes improve query performance by allowing faster data lookup.' },
    ]},
  ],
  'UI/UX Design Masterclass': [
    { moduleTitle: 'Design Principles', questions: [
      { question: 'What is the color wheel used for?', options: [{ text: 'Understanding color relationships and harmony', isCorrect: true },{ text: 'Measuring screen brightness', isCorrect: false },{ text: 'Selecting font sizes', isCorrect: false },{ text: 'Creating animations', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'The color wheel shows relationships between colors for harmonious design.' },
      { question: 'What is typography?', options: [{ text: 'The art of arranging type to make text readable', isCorrect: true },{ text: 'A type of photography', isCorrect: false },{ text: 'A printing machine', isCorrect: false },{ text: 'A font file format', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Typography is the visual component of the written word.' },
      { question: 'What is a wireframe?', options: [{ text: 'A low-fidelity layout sketch of a design', isCorrect: true },{ text: 'A 3D modeling technique', isCorrect: false },{ text: 'A type of animation', isCorrect: false },{ text: 'A color palette tool', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Wireframes are basic visual guides representing the skeletal framework of a website.' },
    ]},
    { moduleTitle: 'Figma Essentials', questions: [
      { question: 'What is a Figma Component?', options: [{ text: 'A reusable design element', isCorrect: true },{ text: 'A JavaScript module', isCorrect: false },{ text: 'A color swatch', isCorrect: false },{ text: 'A font family', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Components are reusable UI elements that can be used across designs.' },
      { question: 'What does Auto Layout do in Figma?', options: [{ text: 'Automatically adjusts frame size based on content', isCorrect: true },{ text: 'Exports designs automatically', isCorrect: false },{ text: 'Generates color palettes', isCorrect: false },{ text: 'Creates animations', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Auto Layout creates dynamic frames that resize based on their content.' },
      { question: 'What is a Design System?', options: [{ text: 'A collection of reusable components and guidelines', isCorrect: true },{ text: 'A computer operating system', isCorrect: false },{ text: 'A project management tool', isCorrect: false },{ text: 'A version control system', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'A design system is a set of standards to manage design at scale.' },
    ]},
    { moduleTitle: 'User Research', questions: [
      { question: 'What is a user interview?', options: [{ text: 'A conversation to understand user needs and behaviors', isCorrect: true },{ text: 'A job interview for designers', isCorrect: false },{ text: 'A survey sent by email', isCorrect: false },{ text: 'A usability test', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'User interviews gather qualitative data about user experiences.' },
      { question: 'What is usability testing?', options: [{ text: 'Evaluating a product by testing it with real users', isCorrect: true },{ text: 'Testing code for bugs', isCorrect: false },{ text: 'Checking color contrast', isCorrect: false },{ text: 'Reviewing design files', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Usability testing observes users interacting with a product to find issues.' },
      { question: 'What is a persona?', options: [{ text: 'A fictional character representing a user type', isCorrect: true },{ text: 'A designer\'s profile', isCorrect: false },{ text: 'A brand mascot', isCorrect: false },{ text: 'A color theme', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Personas are fictional characters created to represent different user types.' },
    ]},
  ],
  'Cloud & DevOps Fundamentals': [
    { moduleTitle: 'Linux & Networking', questions: [
      { question: 'What is the Linux kernel?', options: [{ text: 'The core of the Linux operating system', isCorrect: true },{ text: 'A Linux text editor', isCorrect: false },{ text: 'A Linux package manager', isCorrect: false },{ text: 'A Linux file system', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'The kernel is the core component that manages hardware and system resources.' },
      { question: 'What does SSH stand for?', options: [{ text: 'Secure Shell', isCorrect: true },{ text: 'Simple Shell Host', isCorrect: false },{ text: 'System Shell Handler', isCorrect: false },{ text: 'Secure System Host', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'SSH is a cryptographic network protocol for secure remote access.' },
      { question: 'What is an IP address?', options: [{ text: 'A unique numerical label for a device on a network', isCorrect: true },{ text: 'An internet password', isCorrect: false },{ text: 'A type of network cable', isCorrect: false },{ text: 'A web browser setting', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'An IP address identifies a device on a network.' },
    ]},
    { moduleTitle: 'Docker & Containers', questions: [
      { question: 'What is Docker?', options: [{ text: 'A platform for containerizing applications', isCorrect: true },{ text: 'A cloud storage service', isCorrect: false },{ text: 'A programming language', isCorrect: false },{ text: 'A database system', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Docker packages applications and dependencies into portable containers.' },
      { question: 'What is a Docker image?', options: [{ text: 'A read-only template for creating containers', isCorrect: true },{ text: 'A screenshot of a container', isCorrect: false },{ text: 'A Docker logo file', isCorrect: false },{ text: 'A virtual machine snapshot', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'A Docker image is a lightweight, standalone, executable package.' },
      { question: 'What does docker-compose do?', options: [{ text: 'Defines and runs multi-container Docker applications', isCorrect: true },{ text: 'Compresses Docker images', isCorrect: false },{ text: 'Creates Docker networks', isCorrect: false },{ text: 'Monitors container logs', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Docker Compose uses YAML to configure multi-container applications.' },
    ]},
    { moduleTitle: 'AWS & CI/CD', questions: [
      { question: 'What is AWS EC2?', options: [{ text: 'A virtual server in the cloud', isCorrect: true },{ text: 'A database service', isCorrect: false },{ text: 'A DNS service', isCorrect: false },{ text: 'A storage bucket', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'EC2 (Elastic Compute Cloud) provides scalable virtual servers.' },
      { question: 'What is CI/CD?', options: [{ text: 'Continuous Integration and Continuous Deployment', isCorrect: true },{ text: 'Code Integration and Code Deployment', isCorrect: false },{ text: 'Cloud Infrastructure and Cloud Delivery', isCorrect: false },{ text: 'Container Integration and Container Deployment', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'CI/CD automates building, testing, and deploying applications.' },
      { question: 'What is GitHub Actions?', options: [{ text: 'A CI/CD platform integrated with GitHub', isCorrect: true },{ text: 'A GitHub mobile app', isCorrect: false },{ text: 'A code review tool', isCorrect: false },{ text: 'A GitHub analytics dashboard', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'GitHub Actions automates workflows directly in your GitHub repository.' },
    ]},
  ],
};

// Default questions for courses not in the map
const DEFAULT_QUESTIONS = [
  { question: 'What is the main purpose of this course?', options: [{ text: 'To build practical skills in the subject area', isCorrect: true },{ text: 'To memorize theoretical concepts only', isCorrect: false },{ text: 'To learn an unrelated topic', isCorrect: false },{ text: 'To practice a different skill', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'This course focuses on practical, hands-on skill development.' },
  { question: 'What is the best way to learn a new technical skill?', options: [{ text: 'Practice by building real projects', isCorrect: true },{ text: 'Only read documentation', isCorrect: false },{ text: 'Watch videos without practicing', isCorrect: false },{ text: 'Memorize syntax without context', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Hands-on practice with real projects is the most effective learning method.' },
  { question: 'What does debugging mean?', options: [{ text: 'Finding and fixing errors in code or systems', isCorrect: true },{ text: 'Adding new features', isCorrect: false },{ text: 'Writing documentation', isCorrect: false },{ text: 'Deploying an application', isCorrect: false }], points: 10, timeLimitSeconds: 30, explanation: 'Debugging is the process of identifying and resolving bugs or defects.' },
];

function getQuizForModule(courseTitle: string, moduleTitle: string) {
  const courseQuizzes = COURSE_QUIZZES[courseTitle];
  if (courseQuizzes) {
    const match = courseQuizzes.find(q => q.moduleTitle === moduleTitle);
    if (match) return match.questions;
  }
  return DEFAULT_QUESTIONS;
}

const ALL_BADGES = [
  { type: 'first_enroll',    label: 'First Step',      icon: '🚀' },
  { type: 'streak_3',        label: '3-Day Streak',    icon: '🔥' },
  { type: 'streak_7',        label: 'Week Warrior',    icon: '⚡' },
  { type: 'streak_30',       label: 'Monthly Master',  icon: '🏆' },
  { type: 'quiz_first',      label: 'Quiz Taker',      icon: '🧠' },
  { type: 'quiz_perfect',    label: 'Perfect Score',   icon: '💯' },
  { type: 'quiz_master',     label: 'Quiz Master',     icon: '🎯' },
  { type: 'course_complete', label: 'Course Graduate', icon: '🎓' },
  { type: 'xp_100',          label: 'XP Collector',    icon: '⭐' },
  { type: 'xp_500',          label: 'XP Hunter',       icon: '🌟' },
  { type: 'xp_1000',         label: 'XP Legend',       icon: '👑' },
];

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/edtech';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  // ── WIPE ──────────────────────────────────────────────────────────────────
  console.log('🗑  Wiping database…');
  await Promise.all([
    User.deleteMany({}), Course.deleteMany({}), Enrollment.deleteMany({}),
    Quiz.deleteMany({}), CourseProgress.deleteMany({}), QuizAttempt.deleteMany({}),
    ActivityLog.deleteMany({}), Certificate.deleteMany({}), Badge.deleteMany({}),
  ]);
  console.log('✅ Database cleared\n');

  // ── TEACHERS ──────────────────────────────────────────────────────────────
  const teacherDefs = [
    { name: 'Alex Rivera',   email: 'teacher1@eduquest.com' },
    { name: 'Sarah Chen',    email: 'teacher2@eduquest.com' },
    { name: 'Marcus Johnson',email: 'teacher3@eduquest.com' },
  ];

  const teachers = await Promise.all(teacherDefs.map(t =>
    User.create({ name: t.name, email: t.email, password: 'password123', role: 'teacher' })
  ));
  console.log('👨‍🏫 Created 3 teachers');

  // ── COURSES + QUIZZES ─────────────────────────────────────────────────────
  const allCourses: any[] = [];
  for (let ti = 0; ti < teachers.length; ti++) {
    const teacher = teachers[ti];
    const courseDefs = TEACHER_COURSES[teacherDefs[ti].email];
    for (const cd of courseDefs) {
      const course = await Course.create({
        title: cd.title, description: cd.description, teacher: teacher._id,
        isPublished: true, tags: cd.tags, totalDuration: rand(300, 600),
        modules: cd.modules.map((m, mi) => ({
          title: m.title, description: `In-depth coverage of ${m.title}`, order: mi + 1,
          materials: m.materials.map((mat, mati) => ({
            title: mat, type: mati === 0 ? 'video' : mati === 1 ? 'pdf' : 'link',
            url: 'https://example.com/material', duration: rand(10, 30),
          })),
        })),
      });

      // One quiz per module
      const quizzes: any[] = [];
      for (const mod of course.modules as any[]) {
        const quiz = await Quiz.create({
          course: course._id, module: mod.title, title: `${mod.title} Quiz`,
          passingScore: 70, xpReward: 100,
          questions: getQuizForModule(cd.title, mod.title),
        });
        quizzes.push(quiz);
      }
      allCourses.push({ course, quizzes });
    }
    console.log(`📚 ${teacher.name}: 5 courses created`);
  }
  console.log(`\n📦 Total courses: ${allCourses.length}\n`);

  // ── STUDENTS ──────────────────────────────────────────────────────────────
  const studentDefs = [
    // POWER users (1-3) — many certs, high XP, long streaks
    { name: 'Jordan Lee',    email: 'student1@eduquest.com', tier: 'power'  },
    { name: 'Priya Sharma',  email: 'student2@eduquest.com', tier: 'power'  },
    { name: 'Ethan Brooks',  email: 'student3@eduquest.com', tier: 'power'  },
    // MEDIUM users (4-7)
    { name: 'Mia Torres',    email: 'student4@eduquest.com', tier: 'medium' },
    { name: 'Liam Nguyen',   email: 'student5@eduquest.com', tier: 'medium' },
    { name: 'Aisha Patel',   email: 'student6@eduquest.com', tier: 'medium' },
    { name: 'Carlos Ruiz',   email: 'student7@eduquest.com', tier: 'medium' },
    // LIGHT users (8-10)
    { name: 'Emma Wilson',   email: 'student8@eduquest.com', tier: 'light'  },
    { name: 'Noah Kim',      email: 'student9@eduquest.com', tier: 'light'  },
    { name: 'Sofia Martini', email: 'student10@eduquest.com',tier: 'light'  },
  ];

  for (const sd of studentDefs) {
    const student = await User.create({ name: sd.name, email: sd.email, password: 'password123', role: 'student' });

    const isPower  = sd.tier === 'power';
    const isMedium = sd.tier === 'medium';

    // ── Activity logs ──────────────────────────────────────────────────────
    const streakDays = isPower ? 30 : isMedium ? rand(7, 14) : rand(1, 5);
    const logDays    = isPower ? 45 : isMedium ? rand(14, 25) : rand(3, 8);

    for (let i = logDays - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const dateStr = d.toISOString().split('T')[0];
      const isStreakDay = i < streakDays;
      if (!isStreakDay && Math.random() > 0.4) continue; // light users skip some days
      await ActivityLog.create({
        student: student._id, date: dateStr,
        streak: isStreakDay ? streakDays - i : rand(1, 3),
        timeSpentMinutes: isPower ? rand(60, 180) : isMedium ? rand(20, 60) : rand(5, 20),
        xpGained: isPower ? rand(80, 200) : isMedium ? rand(20, 80) : rand(5, 25),
        coursesActive: allCourses.slice(0, 3).map(c => c.course._id),
      });
    }

    // ── Enroll in ALL courses ──────────────────────────────────────────────
    for (const { course, quizzes } of allCourses) {
      // Determine completion level
      let completionPct: number;
      let status: 'active' | 'completed';

      if (isPower) {
        // Power users: complete all 15 courses
        completionPct = 100; status = 'completed';
      } else if (isMedium) {
        // Medium: complete ~half, active on rest
        const courseIdx = allCourses.indexOf(allCourses.find(c => c.course._id.equals(course._id))!);
        completionPct = courseIdx < 7 ? 100 : rand(20, 80);
        status = completionPct === 100 ? 'completed' : 'active';
      } else {
        // Light: mostly active, low progress
        completionPct = rand(5, 35);
        status = 'active';
      }

      const enrolledAt = daysAgo(rand(20, 45));
      const completedAt = status === 'completed' ? daysAgo(rand(1, 15)) : undefined;

      await Enrollment.create({
        student: student._id, course: course._id,
        status, enrolledAt, completedAt, completionPercent: completionPct,
      });

      // ── Course progress ──────────────────────────────────────────────────
      const tasks = (course.modules as any[]).flatMap((mod: any) =>
        mod.materials.map((mat: any) => ({
          moduleTitle: mod.title, materialTitle: mat.title,
          isDone: completionPct === 100 ? true : Math.random() < completionPct / 100,
          completedAt: completionPct === 100 ? daysAgo(rand(1, 20)) : undefined,
        }))
      );

      const taskXp = tasks.filter((t: any) => t.isDone).length * 20;
      const quizXp = status === 'completed' ? quizzes.length * 100 : 0;

      await CourseProgress.create({
        student: student._id, course: course._id,
        tasks, totalXp: taskXp + quizXp, lastActivityAt: daysAgo(rand(0, 5)),
      });

      // ── Quiz attempts ────────────────────────────────────────────────────
      if (status === 'completed' || (isMedium && Math.random() > 0.4)) {
        for (const quiz of quizzes) {
          const score = isPower ? rand(85, 100) : isMedium ? rand(60, 95) : rand(40, 75);
          const passed = score >= 70;
          await QuizAttempt.create({
            student: student._id, quiz: quiz._id, course: course._id,
            answers: [0, 0, 0], score, xpEarned: passed ? quiz.xpReward : Math.round(quiz.xpReward * 0.3),
            timeTakenSeconds: rand(30, 120), passed,
            attemptedAt: daysAgo(rand(1, 20)),
          });
        }
      }

      // ── Certificates (completed courses only) ────────────────────────────
      if (status === 'completed') {
        await Certificate.create({
          student: student._id, course: course._id,
          issuedAt: completedAt ?? daysAgo(rand(1, 10)),
          certificateId: `EQ-${uid()}-${uid()}`,
        });
      }
    }

    // ── Badges ────────────────────────────────────────────────────────────
    const badgesToAward = isPower
      ? ALL_BADGES                                          // all 11 badges
      : isMedium
      ? ALL_BADGES.slice(0, rand(4, 7))                    // 4-7 badges
      : ALL_BADGES.slice(0, rand(1, 3));                   // 1-3 badges

    for (const b of badgesToAward) {
      await Badge.create({ student: student._id, ...b, earnedAt: daysAgo(rand(1, 20)) });
    }

    const certCount = (await Certificate.countDocuments({ student: student._id }));
    const badgeCount = badgesToAward.length;
    console.log(`🎓 ${sd.name.padEnd(16)} [${sd.tier.padEnd(6)}] | ${certCount} certs | ${badgeCount} badges | streak ${streakDays}d`);
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SEED COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Password for ALL accounts: password123\n');
  console.log('  TEACHERS:');
  teacherDefs.forEach(t => console.log(`    ${t.email}`));
  console.log('\n  STUDENTS:');
  studentDefs.forEach(s => console.log(`    ${s.email.padEnd(28)} [${s.tier}]`));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
