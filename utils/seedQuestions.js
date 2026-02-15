// Seed Questions Script
// This script inserts sample questions into the MongoDB database

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define Question Schema inline to avoid import issues
const QuestionSchema = new mongoose.Schema({
    id: { type: Number },
    question: { type: String, required: true },
    tags: [String],
    expected: String
});

const Question = mongoose.models?.Question || mongoose.model('Question', QuestionSchema);

const sampleQuestions = [
    {
        id: 1,
        question: "What is the time complexity of binary search?",
        tags: ["algorithms", "time-complexity", "searching"],
        expected: "O(log n)"
    },
    {
        id: 2,
        question: "Which data structure follows LIFO (Last In First Out) principle?",
        tags: ["data-structures", "stack", "queue"],
        expected: "Stack"
    },
    {
        id: 3,
        question: "What does SQL stand for?",
        tags: ["databases", "sql", "acronym"],
        expected: "Structured Query Language"
    },
    {
        id: 4,
        question: "Which sorting algorithm has the best average case time complexity?",
        tags: ["algorithms", "sorting", "time-complexity"],
        expected: "Merge Sort"
    },
    {
        id: 5,
        question: "What is the primary purpose of a constructor in object-oriented programming?",
        tags: ["oop", "constructor", "classes"],
        expected: "To initialize object properties"
    },
    {
        id: 6,
        question: "Which HTTP status code indicates 'Not Found'?",
        tags: ["web", "http", "status-codes"],
        expected: "404"
    },
    {
        id: 7,
        question: "What does the 'git clone' command do?",
        tags: ["git", "version-control", "commands"],
        expected: "Creates a copy of a remote repository locally"
    },
    {
        id: 8,
        question: "Which programming paradigm emphasizes immutability and pure functions?",
        tags: ["programming-paradigms", "functional-programming", "immutability"],
        expected: "Functional Programming"
    },
    {
        id: 9,
        question: "What is the maximum number of nodes in a binary tree of height h?",
        tags: ["data-structures", "trees", "binary-tree"],
        expected: "2^(h+1) - 1"
    },
    {
        id: 10,
        question: "Which design pattern provides a way to access elements of a collection sequentially without exposing its underlying representation?",
        tags: ["design-patterns", "iterator", "collections"],
        expected: "Iterator Pattern"
    },
    {
        id: 11,
        question: "What does the acronym API stand for?",
        tags: ["web", "api", "acronym"],
        expected: "Application Programming Interface"
    },
    {
        id: 12,
        question: "Which algorithm is used to find the shortest path in a weighted graph?",
        tags: ["algorithms", "graphs", "shortest-path"],
        expected: "Dijkstra's Algorithm"
    },
    {
        id: 13,
        question: "What is the difference between '==' and '===' in JavaScript?",
        tags: ["javascript", "operators", "comparison"],
        expected: "'==' performs type coercion, '===' does strict equality checking"
    },
    {
        id: 14,
        question: "Which data structure is used to implement a priority queue?",
        tags: ["data-structures", "priority-queue", "heap"],
        expected: "Heap (Binary Heap)"
    },
    {
        id: 15,
        question: "What does the term 'refactoring' mean in software development?",
        tags: ["software-development", "refactoring", "code-quality"],
        expected: "Restructuring existing code without changing its external behavior"
    }
];

async function seedQuestions() {
    try {
        console.log('🔄 Connecting to MongoDB...');

        const MONGODB_URI = process.env.MONGO_URL;
        if (!MONGODB_URI) {
            throw new Error('MONGO_URL environment variable is not set');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Clear existing questions
        await Question.deleteMany({});
        console.log('🗑️ Cleared existing questions');

        // Insert sample questions
        const insertedQuestions = await Question.insertMany(sampleQuestions);
        console.log(`✅ Successfully inserted ${insertedQuestions.length} sample questions`);

        // Verify insertion
        const count = await Question.countDocuments();
        console.log(`📊 Total questions in database: ${count}`);

    } catch (error) {
        console.error('❌ Error seeding questions:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed.');
    }
}

// Run the seeding function
seedQuestions();