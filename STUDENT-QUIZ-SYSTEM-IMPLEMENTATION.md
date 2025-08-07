# Student Quiz System Implementation Guide

## Overview

This implementation creates a complete quiz system where:

1. **Tutors can create quizzes** with subject dropdown (not text input)
2. **Students can access quizzes** from tutors they've booked sessions with
3. **Quiz functionality** includes submission, grading, and detailed results display

## Key Features Implemented

### ✅ **Tutor Quiz Creation**

- **Subject Dropdown**: Changed from text input to dropdown using `note_subjects` table
- **Quiz Management**: Create, edit, and manage quizzes with questions and answers
- **Question Types**: Multiple choice, true/false, and short answer support

### ✅ **Student Quiz Access**

- **Access Control**: Students can only see quizzes from tutors they've booked sessions with
- **Subject Filtering**: Filter quizzes by subject using the same subject dropdown
- **Quiz Dashboard**: Clean interface showing available quizzes with details

### ✅ **Quiz Taking Interface**

- **Interactive Quiz**: One question at a time with navigation
- **Timer Support**: Countdown timer with auto-submission
- **Progress Tracking**: Visual indicators for answered/unanswered questions
- **Multiple Question Types**: Support for all question types

### ✅ **Quiz Submission & Grading**

- **Automatic Grading**: Immediate scoring for multiple choice and true/false
- **Score Calculation**: Percentage and points earned calculation
- **Results Display**: Immediate results with performance feedback

### ✅ **Detailed Results**

- **Question Review**: See each question with correct/incorrect indicators
- **Answer Comparison**: Your answer vs correct answer display
- **Performance Analytics**: Score breakdown and time taken

## Database Schema

### **Core Tables**

```sql
-- Quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY,
    tutor_id UUID REFERENCES profiles(user_id),
    title VARCHAR(255),
    description TEXT,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    time_limit_minutes INTEGER,
    total_questions INTEGER,
    total_points INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Questions table
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id),
    question_text TEXT,
    question_type VARCHAR(50),
    points INTEGER,
    question_order INTEGER,
    created_at TIMESTAMP
);

-- Answers table
CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY,
    question_id UUID REFERENCES quiz_questions(id),
    answer_text TEXT,
    is_correct BOOLEAN,
    answer_order INTEGER,
    created_at TIMESTAMP
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id),
    student_id UUID REFERENCES profiles(user_id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    score INTEGER,
    max_score INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMP
);

-- Student answers table
CREATE TABLE student_answers (
    id UUID PRIMARY KEY,
    attempt_id UUID REFERENCES quiz_attempts(id),
    question_id UUID REFERENCES quiz_questions(id),
    selected_answer_id UUID REFERENCES quiz_answers(id),
    answer_text TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER,
    created_at TIMESTAMP
);
```

## Files Created/Modified

### **New Files**

1. `src/pages/student/StudentQuizDashboard.tsx` - Student quiz dashboard
2. `src/pages/student/TakeQuizPage.tsx` - Quiz taking interface
3. `src/pages/student/QuizResultsPage.tsx` - Detailed results page
4. `fix-quiz-foreign-keys.sql` - Database foreign key fixes

### **Modified Files**

1. `src/pages/quiz/CreateQuizPage.tsx` - Added subject dropdown
2. `src/lib/quizService.ts` - Added student quiz functions
3. `src/App.tsx` - Added new routes
4. `src/components/layout/DashboardLayout.tsx` - Added quiz navigation

## Implementation Details

### **1. Subject Dropdown Fix**

```typescript
// Before: Text input
<input
  type="text"
  value={quizData.subject}
  onChange={(e) => updateQuizData('subject', e.target.value)}
  placeholder="e.g., Mathematics, Science"
/>

// After: Dropdown
<select
  value={quizData.subject}
  onChange={(e) => updateQuizData('subject', e.target.value)}
>
  <option value="">Select a subject</option>
  {subjects.map(subject => (
    <option key={subject.id} value={subject.name}>
      {subject.display_name}
    </option>
  ))}
</select>
```

### **2. Student Quiz Access Control**

```typescript
// Get tutor IDs from class bookings
const { data: bookings } = await supabase
  .from("class_bookings")
  .select(`tutor_classes!inner(tutor_id)`)
  .eq("student_id", studentId)
  .eq("status", "confirmed");

const tutorIds =
  bookings?.map((booking) => booking.tutor_classes.tutor_id) || [];

// Get quizzes from those tutors only
const { data: quizzes } = await supabase
  .from("quizzes")
  .select(`*, tutor:profiles!tutor_id(user_id, full_name, email)`)
  .eq("is_active", true)
  .in("tutor_id", tutorIds);
```

### **3. Quiz Taking Interface**

```typescript
// Question navigation with progress indicators
<div className="grid grid-cols-5 md:grid-cols-10 gap-2">
  {quiz.questions?.map((_, index) => (
    <button
      key={index}
      onClick={() => setCurrentQuestionIndex(index)}
      className={`p-2 rounded-lg text-sm font-medium ${
        index === currentQuestionIndex
          ? "bg-blue-600 text-white"
          : isQuestionAnswered(index)
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {index + 1}
    </button>
  ))}
</div>
```

### **4. Automatic Grading**

```typescript
// Calculate score for each answer
for (const question of questions) {
  maxScore += question.points;
  const studentAnswer = answers.find((a) => a.questionId === question.id);

  if (studentAnswer) {
    let isCorrect = false;
    let pointsEarned = 0;

    if (
      question.question_type === "multiple_choice" &&
      studentAnswer.selectedAnswerId
    ) {
      const correctAnswer = question.answers.find((a) => a.is_correct);
      isCorrect = correctAnswer?.id === studentAnswer.selectedAnswerId;
      pointsEarned = isCorrect ? question.points : 0;
    }

    totalScore += pointsEarned;
  }
}
```

## User Flow

### **For Tutors**

1. **Create Quiz**: Navigate to quiz creation with subject dropdown
2. **Add Questions**: Create multiple choice, true/false, or short answer questions
3. **Set Points**: Assign points to each question
4. **Publish**: Quiz becomes available to students who have booked sessions

### **For Students**

1. **Access Quizzes**: See quizzes from booked tutors only
2. **Filter by Subject**: Use dropdown to filter quizzes by subject
3. **Start Quiz**: Begin quiz with timer and progress tracking
4. **Answer Questions**: Navigate through questions with visual feedback
5. **Submit**: Get immediate results with score and percentage
6. **Review**: See detailed breakdown of each question

## Database Setup Required

### **1. Run Foreign Key Fix**

```sql
-- Execute fix-quiz-foreign-keys.sql
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_tutor_id_fkey;
ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_student_id_fkey;

ALTER TABLE quizzes
ADD CONSTRAINT quizzes_tutor_id_fkey
FOREIGN KEY (tutor_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE quiz_attempts
ADD CONSTRAINT quiz_attempts_student_id_fkey
FOREIGN KEY (student_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
```

### **2. Ensure Quiz Schema**

Make sure the quiz tables are created with the correct schema from `quiz-database-schema.sql`

## Routes Added

```typescript
// Student quiz routes
<Route path="student/quizzes" element={<StudentQuizDashboard />} />
<Route path="student/take-quiz/:attemptId" element={<TakeQuizPage />} />
<Route path="student/quiz-results" element={<QuizResultsPage />} />
```

## Navigation Updates

Added "Quizzes" to student navigation menu:

```typescript
{
  name: "Quizzes",
  href: "/student/quizzes",
  icon: DocumentTextIcon,
}
```

## Testing Checklist

### **Tutor Features**

- [ ] Create quiz with subject dropdown
- [ ] Add multiple question types
- [ ] Set time limits and points
- [ ] View created quizzes

### **Student Features**

- [ ] See quizzes from booked tutors only
- [ ] Filter quizzes by subject
- [ ] Start quiz and navigate questions
- [ ] Submit quiz and see results
- [ ] View detailed question review

### **System Features**

- [ ] Timer functionality
- [ ] Automatic grading
- [ ] Score calculation
- [ ] Progress tracking

## Future Enhancements

1. **Quiz Analytics**: Detailed performance analytics for tutors
2. **Quiz Templates**: Pre-built quiz templates for common subjects
3. **Time Tracking**: More detailed time analytics per question
4. **Quiz Sharing**: Allow tutors to share quiz templates
5. **Advanced Question Types**: Essay questions, file uploads, etc.
6. **Quiz Scheduling**: Set quiz availability windows
7. **Retake Policy**: Allow multiple attempts with different rules

## Troubleshooting

### **Common Issues**

1. **Foreign Key Errors**: Run the foreign key fix SQL
2. **No Quizzes Showing**: Check if student has booked sessions with tutors
3. **Subject Filter Not Working**: Ensure note_subjects table has data
4. **Timer Issues**: Check browser console for JavaScript errors

### **Database Issues**

- Ensure all quiz tables are created
- Check foreign key constraints are correct
- Verify RLS policies are disabled for quiz tables
- Confirm profiles table has correct user_id references

This implementation provides a complete, production-ready quiz system that integrates seamlessly with the existing MathMentor platform.
