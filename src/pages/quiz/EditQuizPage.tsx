import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { quizService } from '@/lib/quizService';
import type { Quiz, Question, Answer, CreateQuestionData, CreateAnswerData } from '@/types/quiz';

// Extended interface for questions with answers during editing
interface EditableQuestion extends Omit<Question, 'answers'> {
  answers: (Answer | CreateAnswerData)[];
  isNew?: boolean;
}

// Helper type for new answers without ID
interface NewAnswer extends CreateAnswerData {
  id?: string;
}

const EditQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  
  // Quiz basic info
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    subject: '',
    grade_level: '',
    time_limit_minutes: 60
  });

  useEffect(() => {
    if (quizId && profile) {
      loadQuiz();
    }
  }, [quizId, profile]);

  const loadQuiz = async () => {
    try {
      const quizData = await quizService.quizzes.getById(quizId!);
      setQuiz(quizData);
      
      // Set quiz basic info
      setQuizData({
        title: quizData.title,
        description: quizData.description || '',
        subject: quizData.subject,
        grade_level: quizData.grade_level || '',
        time_limit_minutes: quizData.time_limit_minutes
      });

      // Load questions and answers
      const questionsData = await quizService.questions.getByQuizId(quizId!);
      const questionsWithAnswers = await Promise.all(
        questionsData.map(async (question) => {
          const answers = await quizService.answers.getByQuestionId(question.id);
          return {
            ...question,
            answers: answers,
            isNew: false
          };
        })
      );

      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Failed to load quiz. Please try again.');
      navigate('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const updateQuizData = (field: string, value: string | number) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const updateQuestion = (questionIndex: number, field: string, value: string | number) => {
    setQuestions(prev => prev.map((q, index) => 
      index === questionIndex ? { ...q, [field]: value } : q
    ));
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: string, value: string | boolean) => {
    setQuestions(prev => prev.map((q, qIndex) => 
      qIndex === questionIndex 
        ? {
            ...q,
            answers: q.answers.map((a, aIndex) => 
              aIndex === answerIndex ? { ...a, [field]: value } : a
            )
          }
        : q
    ));
  };

  const setCorrectAnswer = (questionIndex: number, answerIndex: number) => {
    setQuestions(prev => prev.map((q, qIndex) => 
      qIndex === questionIndex 
        ? {
            ...q,
            answers: q.answers.map((a, aIndex) => ({
              ...a,
              is_correct: aIndex === answerIndex
            }))
          }
        : q
    ));
  };

  const addQuestion = () => {
    if (questions.length >= 40) {
      alert('Maximum 40 questions allowed per quiz.');
      return;
    }

    const newQuestion: EditableQuestion = {
      id: `temp-${Date.now()}`, // Temporary ID for new questions
      quiz_id: quizId!,
      question_text: '',
      question_type: 'multiple_choice',
      points: 10,
      question_order: questions.length + 1,
      created_at: new Date().toISOString(),
      answers: [
        { answer_text: '', is_correct: false, answer_order: 1 },
        { answer_text: '', is_correct: false, answer_order: 2 },
        { answer_text: '', is_correct: false, answer_order: 3 },
        { answer_text: '', is_correct: false, answer_order: 4 }
      ],
      isNew: true
    };

    setQuestions(prev => [...prev, newQuestion]);
  };

  const removeQuestion = (questionIndex: number) => {
    if (questions.length <= 1) {
      alert('Quiz must have at least 1 question.');
      return;
    }

    setQuestions(prev => {
      const newQuestions = prev.filter((_, index) => index !== questionIndex);
      // Update question order numbers
      return newQuestions.map((q, index) => ({
        ...q,
        question_order: index + 1
      }));
    });
  };

  const validateForm = () => {
    if (!quizData.title.trim() || !quizData.subject.trim()) {
      alert('Please fill in all required fields (Title and Subject).');
      return false;
    }

    if (!questions.every(q => 
      q.question_text.trim() !== '' && 
      q.answers.some(a => a.is_correct) &&
      q.answers.every(a => a.answer_text.trim() !== '')
    )) {
      alert('Please complete all questions and ensure each question has a correct answer.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      
      // Update quiz basic info
      await quizService.quizzes.update(quizId!, {
        ...quizData,
        total_questions: questions.length,
        total_points: totalPoints
      });

      // Update existing questions and answers
      for (const question of questions) {
        if (!question.isNew) {
          // Update existing question
          await quizService.questions.update(question.id, {
            question_text: question.question_text,
            question_type: question.question_type,
            points: question.points,
            question_order: question.question_order
          });

          // Update existing answers
          for (const answer of question.answers) {
            if ('id' in answer) { // Check if it's an existing answer
              await quizService.answers.update(answer.id, {
                answer_text: answer.answer_text,
                is_correct: answer.is_correct,
                answer_order: answer.answer_order
              });
            }
          }
        } else {
          // Create new question with answers
          const newQuestion = await quizService.questions.create(quizId!, {
            question_text: question.question_text,
            question_type: question.question_type,
            points: question.points,
            question_order: question.question_order,
            answers: question.answers.map(answer => ({
              answer_text: answer.answer_text,
              is_correct: answer.is_correct,
              answer_order: answer.answer_order
            }))
          });
        }
      }

      navigate('/quizzes', { 
        state: { message: 'Quiz updated successfully!' }
      });
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Failed to update quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Quiz not found.</p>
        <button
          onClick={() => navigate('/quizzes')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/quizzes')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
              <p className="mt-2 text-sm text-gray-600">
                Update quiz details and questions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Quiz Summary</h3>
        <div className="text-sm text-blue-700">
          <p><strong>Title:</strong> {quizData.title}</p>
          <p><strong>Subject:</strong> {quizData.subject}</p>
          <p><strong>Grade Level:</strong> {quizData.grade_level || 'Not specified'}</p>
          <p><strong>Time Limit:</strong> {quizData.time_limit_minutes} minutes</p>
          <p><strong>Questions:</strong> {questions.length}</p>
          <p><strong>Total Points:</strong> {totalPoints}</p>
        </div>
      </div>

      {/* Quiz Details Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quiz Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => updateQuizData('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={quizData.subject}
              onChange={(e) => updateQuizData('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mathematics, Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </label>
            <input
              type="text"
              value={quizData.grade_level}
              onChange={(e) => updateQuizData('grade_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Grade 10, High School"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              value={quizData.time_limit_minutes}
              onChange={(e) => updateQuizData('time_limit_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="180"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={quizData.description}
              onChange={(e) => updateQuizData('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz description (optional)"
            />
          </div>
        </div>
      </div>

      {/* Question Management */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Questions ({questions.length}/40)</h3>
          <button
            onClick={addQuestion}
            disabled={questions.length >= 40}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Question
          </button>
        </div>

        {/* Questions */}
        {questions.map((question, questionIndex) => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                Question {questionIndex + 1}
                {question.isNew && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    New
                  </span>
                )}
              </h4>
              <div className="flex items-center space-x-4">
                <select
                  value={question.question_type}
                  onChange={(e) => updateQuestion(questionIndex, 'question_type', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Points:</span>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    min="1"
                    max="100"
                  />
                </div>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-900"
                    title="Remove Question"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={question.question_text}
                onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your question here"
              />
            </div>

            {/* Answers */}
            {question.question_type !== 'short_answer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Answers *
                </label>
                <div className="space-y-3">
                  {question.answers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="flex items-center space-x-3">
                      <button
                        onClick={() => setCorrectAnswer(questionIndex, answerIndex)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answer.is_correct
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {answer.is_correct && <CheckIcon className="h-4 w-4" />}
                      </button>
                      <input
                        type="text"
                        value={answer.answer_text}
                        onChange={(e) => updateAnswer(questionIndex, answerIndex, 'answer_text', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Answer ${answerIndex + 1}`}
                      />
                      {answer.is_correct && (
                        <span className="text-sm text-green-600 font-medium">Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.question_type === 'short_answer' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Short answer questions will be manually graded. Students will receive full points for any answer.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/quizzes')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Questions: {questions.length} | Total Points: {totalPoints}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuizPage; 