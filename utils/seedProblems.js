// Seed Problems Script
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sampleProblems } from './seed-data/index.js';

dotenv.config();

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
    starterCodes: {
      python3: { type: String },
      cpp: { type: String },
      java: { type: String },
      nodejs: { type: String }
    },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    solutions: {
      python3: { type: String },
      cpp: { type: String },
      java: { type: String },
      nodejs: { type: String }
    },
    videoId: { type: String },
    testCases: [{ input: { type: [String], required: true }, output: { type: [String], required: true } }],
});

const Problem = mongoose.models?.Problem || mongoose.model('Problem', ProblemSchema);

async function seedProblems() {
    try {
        const MONGODB_URI = process.env.MONGO_URL;
        if (!MONGODB_URI) throw new Error('MONGO_URL environment variable is not set');

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        await Problem.deleteMany({});
        console.log('🗑️ Cleared existing problems ');

        const inserted = await Problem.insertMany(sampleProblems);
        console.log("✅ Inserted " + inserted.length + " sample problems");

    } catch (err) {
        console.error('❌ Error seeding problems:', err.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 DB connection closed');
    }
}

seedProblems();
