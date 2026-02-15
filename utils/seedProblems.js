// Seed Problems Script
// Inserts sample problems into the MongoDB database

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define Problem schema inline to avoid import issues
const ProblemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String },
    problemStatement: { type: String },
    inputFormat: { type: String },
    outputFormat: { type: String },
    sampleInput: { type: String },
    sampleOutput: { type: String },
    likes: { type: Number, default: 10 },
    dislikes: { type: Number, default: 0 },
    order: { type: Number },
    category: { type: String },
    constraints: { type: String },
    companies: { type: [String], default: [] },
    starterCode: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    solution: { type: String },
    videoId: { type: String },
    testCases: [{ input: { type: [String], required: true }, output: { type: [String], required: true } }],
});

const Problem = mongoose.models?.Problem || mongoose.model('Problem', ProblemSchema);

const sampleProblems = [
    {
        id: 'p1',
        title: 'Two Sum',
        problemStatement: 'Given an array of integers, return indices of the two numbers such that they add up to a specific target.',
        inputFormat: 'First line contains n and target, second line contains n integers.',
        outputFormat: 'Return indices of the two numbers.',
        sampleInput: '4 9\n2 7 11 15',
        sampleOutput: '[0,1]',
        difficulty: 'Easy',
        category: 'Arrays',
        testCases: [
            { input: ['4 9', '2 7 11 15'], output: ['0 1'] }
        ],
        videoId: 'dQw4w9WgXcQ'
    },
    {
        id: 'p2',
        title: 'Reverse Linked List',
        problemStatement: 'Reverse a singly linked list.',
        inputFormat: 'List of node values.',
        outputFormat: 'Reversed list.',
        sampleInput: '1 2 3 4 5',
        sampleOutput: '5 4 3 2 1',
        difficulty: 'Medium',
        category: 'Linked List',
        testCases: [
            { input: ['5', '1 2 3 4 5'], output: ['5 4 3 2 1'] }
        ],
        videoId: '8-k1C6ehKuw'
    },
    {
        id: 'p3',
        title: 'Dijkstra Shortest Path',
        problemStatement: 'Compute shortest paths from source to all nodes in a weighted graph.',
        inputFormat: 'Graph nodes and weighted edges.',
        outputFormat: 'Distances from source.',
        sampleInput: 'graph data',
        sampleOutput: 'distances',
        difficulty: 'Hard',
        category: 'Graphs',
        testCases: [
            { input: ['graph'], output: ['distances'] }
        ],
        videoId: 'h2f1YQz3G6g'
    }
];

async function seedProblems() {
    try {
        const MONGODB_URI = process.env.MONGO_URL;
        if (!MONGODB_URI) throw new Error('MONGO_URL environment variable is not set');

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing problems and insert samples
        await Problem.deleteMany({});
        console.log('🗑️ Cleared existing problems');

        const inserted = await Problem.insertMany(sampleProblems);
        console.log(`✅ Inserted ${inserted.length} sample problems`);

    } catch (err) {
        console.error('❌ Error seeding problems:', err.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 DB connection closed');
    }
}

seedProblems();
