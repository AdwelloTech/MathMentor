const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
const DB_NAME = process.env.DB_NAME || 'mathmentor';

async function deleteAllQuizzes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);

    // Delete all quizzes
    const quizzesResult = await db.collection('quizzes').deleteMany({});
    console.log(`Deleted ${quizzesResult.deletedCount} quizzes`);

    // Delete all questions
    const questionsResult = await db.collection('questions').deleteMany({});
    console.log(`Deleted ${questionsResult.deletedCount} questions`);

    // Delete all quiz attempts
    const attemptsResult = await db.collection('quizattempts').deleteMany({});
    console.log(`Deleted ${attemptsResult.deletedCount} quiz attempts`);

    // Delete all student answers
    const answersResult = await db.collection('studentanswers').deleteMany({});
    console.log(`Deleted ${answersResult.deletedCount} student answers`);

    console.log('\nAll quiz-related data has been deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting quizzes:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the script
deleteAllQuizzes().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});

