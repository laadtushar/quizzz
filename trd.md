# Appsatile Quizzz: Comprehensive Technical Requirements Document

## 1. Project Overview

**Appsatile Quizzz** is an internal AI-powered training and engagement platform built on Firebase. The application enables administrators to generate intelligent quizzes from documents using Google's Gemini AI, while team members take quizzes, track progress, and compete on leaderboards.

### 1.1. Technology Stack
- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **UI Framework**: ShadCN UI components, Tailwind CSS, Lucide React icons
- **Backend**: Firebase suite
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Hosting (via Firebase App Hosting)
  - Cloud Functions for Firebase (for AI integration and complex operations)
- **AI Integration**: Google Gemini via Genkit flows
- **State Management**: React Context API, React Hooks (useState, useEffect, useReducer)

---

## 2. Data Model & Firestore Schema

### 2.1. Collections Structure

#### **users** Collection
```
/users/{userId}
```
**Fields:**
- `userId` (string, document ID): Unique user identifier from Firebase Auth
- `email` (string): User's email address
- `displayName` (string): User's full name
- `role` (string): Either "admin" or "guest"
- `totalXP` (number, default: 0): Accumulated experience points
- `quizzesCompleted` (number, default: 0): Total number of quizzes completed
- `createdAt` (timestamp): Account creation date
- `lastLoginAt` (timestamp): Last login timestamp
- `avatarUrl` (string, optional): Profile picture URL

**Indexes Required:**
- Composite index on `role` (ascending) + `totalXP` (descending) for leaderboard queries
- Single field index on `email` (ascending)

---

#### **quizzes** Collection
```
/quizzes/{quizId}
```
**Fields:**
- `quizId` (string, auto-generated document ID)
- `title` (string): Quiz title
- `description` (string): Quiz description
- `createdBy` (string): userId of the admin who created it
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last modification timestamp
- `visibility` (string): "visible" or "hidden"
- `settings` (map):
  - `timerSeconds` (number, optional): Time limit in seconds (null for unlimited)
  - `allowRetries` (boolean): Whether users can retake the quiz
  - `difficultyLevel` (string): "easy", "medium", or "hard"
  - `passingScore` (number, 0-100): Minimum percentage to pass
- `questionCount` (number): Total number of questions
- `totalPoints` (number): Sum of all question points
- `status` (string): "draft" or "published"
- `tags` (array of strings, optional): Categories or topics

**Indexes Required:**
- Composite index on `visibility` (ascending) + `createdAt` (descending)
- Single field index on `createdBy` (ascending)
- Single field index on `status` (ascending)

---

#### **questions** Subcollection
```
/quizzes/{quizId}/questions/{questionId}
```
**Fields:**
- `questionId` (string, auto-generated)
- `order` (number): Display sequence (1, 2, 3...)
- `type` (string): "mcq", "true-false", "ordering", "fill-blank", "multiple-select"
- `questionText` (string): The question prompt
- `points` (number, default: 10): Points awarded for correct answer
- `options` (array of maps, for mcq/multiple-select):
  - `id` (string): Option identifier
  - `text` (string): Option text
  - `isCorrect` (boolean): Whether this is a correct answer
- `correctAnswer` (any): Stores correct answer based on type:
  - MCQ: string (optionId)
  - True/False: boolean
  - Ordering: array of strings (correct sequence)
  - Fill-blank: string or array of strings
  - Multiple-select: array of strings (optionIds)
- `explanation` (string, optional): Explanation for the correct answer
- `imageUrl` (string, optional): URL to question image
- `createdAt` (timestamp)

**Indexes Required:**
- Single field index on `order` (ascending) for ordered retrieval

---

#### **assignments** Collection
```
/assignments/{assignmentId}
```
**Fields:**
- `assignmentId` (string, auto-generated)
- `quizId` (string): Reference to quiz
- `assignedTo` (string): userId of the guest
- `assignedBy` (string): userId of the admin
- `assignedAt` (timestamp): When assignment was created
- `dueDate` (timestamp): Deadline for completion
- `status` (string): "pending", "completed", or "overdue"
- `completedAt` (timestamp, optional): When user completed the quiz
- `score` (number, optional): Final score achieved
- `reminderSent` (boolean, default: false): Whether reminder was sent

**Indexes Required:**
- Composite index on `assignedTo` (ascending) + `status` (ascending) + `dueDate` (ascending)
- Composite index on `quizId` (ascending) + `assignedTo` (ascending)
- Single field index on `dueDate` (ascending) for reminder queries

---

#### **attempts** Collection
```
/attempts/{attemptId}
```
**Fields:**
- `attemptId` (string, auto-generated)
- `userId` (string): User who took the quiz
- `quizId` (string): Quiz reference
- `startedAt` (timestamp): When attempt began
- `completedAt` (timestamp, optional): When attempt was finished
- `status` (string): "in-progress" or "completed"
- `score` (number): Points earned
- `maxScore` (number): Total possible points
- `percentage` (number): Score percentage (0-100)
- `timeSpent` (number): Seconds taken to complete
- `xpAwarded` (number): Experience points earned
- `answers` (array of maps):
  - `questionId` (string)
  - `userAnswer` (any): User's submitted answer
  - `isCorrect` (boolean)
  - `pointsEarned` (number)
  - `timeSpent` (number, optional): Seconds on this question
- `isPassed` (boolean): Whether passing score was met

**Indexes Required:**
- Composite index on `userId` (ascending) + `completedAt` (descending)
- Composite index on `quizId` (ascending) + `completedAt` (descending)
- Composite index on `userId` (ascending) + `quizId` (ascending) + `completedAt` (descending) for retry checks

---

#### **aiGenerationLogs** Collection (Optional, for tracking)
```
/aiGenerationLogs/{logId}
```
**Fields:**
- `logId` (string, auto-generated)
- `adminId` (string): User who generated quiz
- `timestamp` (timestamp)
- `inputTextLength` (number): Character count of source text
- `questionsRequested` (number)
- `questionsGenerated` (number)
- `difficultyLevel` (string)
- `questionTypes` (array of strings)
- `modelUsed` (string): "gemini-pro" or specific model version
- `processingTime` (number): Milliseconds taken
- `status` (string): "success" or "error"
- `errorMessage` (string, optional)

---

## 3. Firebase Security Rules

### 3.1. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function emailDomain() {
      return request.auth.token.email.matches('.*@alsoit[.]com$');
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles (for leaderboard)
      allow read: if isAuthenticated();
      
      // Users can create their own profile on signup
      allow create: if isAuthenticated() && 
                       isOwner(userId) && 
                       emailDomain() &&
                       request.resource.data.role == 'guest'; // Prevent self-admin assignment
      
      // Users can update their own profile (except role and XP)
      allow update: if isOwner(userId) && 
                       request.resource.data.role == resource.data.role &&
                       request.resource.data.totalXP == resource.data.totalXP &&
                       request.resource.data.quizzesCompleted == resource.data.quizzesCompleted;
      
      // Only admins can delete users
      allow delete: if isAdmin();
    }
    
    // Quizzes collection
    match /quizzes/{quizId} {
      // Guests can read visible quizzes; admins can read all
      allow read: if isAuthenticated() && 
                     (resource.data.visibility == 'visible' || isAdmin());
      
      // Only admins can create, update, delete quizzes
      allow create, update, delete: if isAdmin();
      
      // Questions subcollection
      match /questions/{questionId} {
        // Same permissions as parent quiz
        allow read: if isAuthenticated() && 
                       (get(/databases/$(database)/documents/quizzes/$(quizId)).data.visibility == 'visible' || isAdmin());
        allow write: if isAdmin();
      }
    }
    
    // Assignments collection
    match /assignments/{assignmentId} {
      // Users can read their own assignments; admins can read all
      allow read: if isAuthenticated() && 
                     (resource.data.assignedTo == request.auth.uid || isAdmin());
      
      // Only admins can create assignments
      allow create: if isAdmin();
      
      // Only admins can update/delete assignments
      allow update, delete: if isAdmin();
    }
    
    // Attempts collection
    match /attempts/{attemptId} {
      // Users can read their own attempts; admins can read all
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      
      // Users can create attempts for themselves
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      
      // Users can update only their own in-progress attempts
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid &&
                       resource.data.status == 'in-progress';
      
      // No one can delete attempts (data integrity)
      allow delete: if false;
    }
    
    // AI Generation Logs (admin only)
    match /aiGenerationLogs/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## 4. Authentication & User Management

### 4.1. Authentication Flow

**Registration:**
1. User signs up with email/password via Firebase Auth
2. Check if this is the first user (query users collection)
3. If first user: create user document with `role: "admin"`
4. Otherwise: create user document with `role: "guest"`
5. Validate email domain (@alsoit.com) before allowing registration
6. Redirect to appropriate dashboard based on role

**Login:**
1. Authenticate via Firebase Auth
2. Fetch user document to determine role
3. Store user data in React Context
4. Update `lastLoginAt` timestamp
5. Redirect to role-specific dashboard

**Email Domain Restriction:**
- Implement client-side validation
- Enforce via Firestore security rules
- Consider Firebase Auth custom claims for additional security

### 4.2. User Profile Management

**Guest Users Can:**
- Update displayName, avatarUrl
- View their own statistics (XP, quizzes completed)
- Cannot modify role, XP, or quiz count

**Admins Can:**
- View all users
- Manually adjust user roles (promote guest to admin)
- View user statistics and attempt history
- Delete user accounts (cascade delete related data)

---

## 5. Quiz Generation & Management (Admin Features)

### 5.1. AI-Powered Quiz Generation Flow

**Frontend Process:**
1. Admin pastes document text into textarea (max 50,000 characters)
2. Admin configures generation parameters:
   - Number of questions (5-50)
   - Difficulty level (easy/medium/hard)
   - Question types (multi-select checkboxes)
   - Quiz title and description
3. Click "Generate Quiz" button
4. Show loading state with progress indicator
5. Call Cloud Function `generateQuizFromText`

**Cloud Function: `generateQuizFromText`**
```typescript
// Triggered via HTTPS callable
// Input: { text, questionCount, difficulty, questionTypes, title, description }
// Process:
// 1. Validate input parameters
// 2. Create Genkit flow with Gemini model
// 3. Construct AI prompt with strict instructions:
//    - Generate exactly N questions
//    - Follow specified difficulty distribution
//    - Include only requested question types
//    - Output structured JSON format
// 4. Parse AI response and validate against requirements
// 5. If validation fails, retry with adjusted prompt (max 3 attempts)
// 6. Create quiz document in Firestore with status "draft"
// 7. Create questions subcollection documents
// 8. Log generation metadata to aiGenerationLogs
// 9. Return quizId and question count to client
```

**AI Prompt Engineering:**
- Include explicit JSON schema in prompt
- Provide examples of each question type
- Use XML tags for structured sections if needed
- Request explanations for all correct answers
- Validate AI output matches requested difficulty and types
- Implement retry logic with refinement prompts

**Error Handling:**
- AI service unavailable: Show error toast, save draft with manual edit option
- Malformed AI response: Log error, allow admin to regenerate or edit manually
- Timeout (>30 seconds): Implement streaming or progress updates

### 5.2. Quiz Editing Interface

**Features:**
1. Visual quiz builder with drag-and-drop question reordering
2. Inline editing for all question fields
3. Add/remove questions manually
4. Preview mode to see quiz as students will
5. Real-time validation (e.g., at least one correct answer for MCQ)
6. Save as draft or publish immediately
7. Duplicate quiz functionality
8. Bulk import questions from JSON/CSV

**Question Editor Components:**
- MCQ: Rich text editor, option manager, mark multiple correct answers
- True/False: Toggle button, explanation field
- Ordering: Drag-and-drop sequence builder
- Fill-in-the-blank: Text with bracket syntax `[answer]` or underscore detection
- Multiple-select: Same as MCQ with checkbox indicators

### 5.3. Quiz Settings Configuration

**Visibility:**
- Toggle: "Visible to all" vs "Hidden (assignment only)"
- When hidden, quiz only appears in assigned user's "My Assignments"

**Timer:**
- Optional time limit in minutes (converted to seconds for storage)
- Display countdown timer during quiz attempt
- Auto-submit when time expires

**Retries:**
- Toggle: "Allow unlimited retries" vs "One attempt only"
- If retries disabled, check attempts collection before allowing quiz start
- Track best score if multiple attempts allowed

**Passing Score:**
- Set minimum percentage (0-100) to pass
- Display pass/fail status on completion
- Award bonus XP for passing

**Due Date (for assignments):**
- Date/time picker
- Automatically set assignment status to "overdue" after due date
- Send reminder notifications 24 hours before due date

---

## 6. Quiz Assignment System

### 6.1. Assignment Creation (Admin)

**Interface:**
1. Select quiz from dropdown (show all published quizzes)
2. Multi-select user picker (show all guests, with search/filter)
3. Set due date via date picker
4. Optional: Add personal message/instructions
5. Click "Assign Quiz"

**Backend Process:**
1. Validate quiz exists and is published
2. Check selected users exist and have guest role
3. Create assignment document for each user-quiz pair
4. Check for duplicate assignments (same quiz, same user)
5. Send email notification to assigned users (via Cloud Function)
6. Create in-app notification

**Batch Assignment:**
- Allow assigning one quiz to multiple users simultaneously
- Allow assigning multiple quizzes to one user
- Provide CSV upload for bulk assignments

### 6.2. Assignment Tracking

**Admin Dashboard View:**
- Table showing all assignments with filters:
  - Quiz name
  - Assigned user
  - Status (pending/completed/overdue)
  - Due date
  - Completion date
  - Score achieved
- Export to CSV functionality
- Send reminder button for pending assignments

**Guest Dashboard View:**
- "My Assignments" section showing:
  - Quiz title and description
  - Assigned by (admin name)
  - Due date with countdown
  - Status badge (pending/overdue/completed)
  - "Start Quiz" or "View Results" button
- Sort by due date (closest first)
- Filter by status

---

## 7. Quiz Taking Experience (Guest Features)

### 7.1. Quiz Discovery

**All Quizzes Page:**
- Grid/list view of all visible quizzes
- Each card shows:
  - Quiz title and description
  - Difficulty badge
  - Question count
  - Estimated time (calculated from timer setting)
  - Average score (from all attempts)
  - "Start Quiz" button or "View Results" if completed
- Search and filter by difficulty, tags, completion status
- Sort by newest, popular, highest rated

**My Assignments Page:**
- Prioritized view showing only assigned quizzes
- Highlight overdue assignments in red
- Show assignment-specific details (assigned by, due date)

### 7.2. Quiz Taking Interface

**Pre-Quiz Screen:**
1. Display quiz title, description, rules
2. Show question count, time limit, retry policy
3. "Start Quiz" button to begin
4. If retries disabled and already attempted, show "Already Completed" with score

**Quiz Flow:**
1. Create attempt document with status "in-progress"
2. Load all questions from subcollection, order by `order` field
3. Display one question at a time
4. Show progress bar (Question X of Y)
5. Show timer countdown (if applicable)
6. Navigation: "Previous" and "Next" buttons
7. Save answer to local state on selection
8. Show "Submit Quiz" button on last question
9. Confirmation modal before final submission

**Question Rendering by Type:**

- **MCQ:** Radio buttons, single selection
- **Multiple-Select:** Checkboxes, multiple selections
- **True/False:** Two large buttons (True/False)
- **Ordering:** Drag-and-drop list with visual feedback
- **Fill-in-the-blank:** Text input field(s)

**During Quiz:**
- Auto-save progress every 30 seconds to attempt document
- Prevent page refresh with warning dialog
- Persist state in sessionStorage as backup
- Show "Save & Exit" option to pause and resume later

**Time Expiry:**
- Show warning at 2 minutes remaining
- Show urgent warning at 30 seconds
- Auto-submit when time reaches 0
- Calculate score based on answers submitted

### 7.3. Quiz Submission & Scoring

**Submission Process:**
1. Lock the attempt (no more changes)
2. Calculate score:
   - For each question, compare userAnswer with correctAnswer
   - Award points for correct answers
   - Calculate percentage: (pointsEarned / maxScore) * 100
3. Determine XP award:
   - Base XP: 10 per question
   - Bonus XP: +50% for passing score
   - Difficulty multiplier: easy (1x), medium (1.5x), hard (2x)
4. Update attempt document with final results
5. Update user document:
   - Increment totalXP
   - Increment quizzesCompleted
6. If assignment exists, update assignment status to "completed"
7. Show results screen

**Results Screen:**
1. Display score prominently (points and percentage)
2. Show pass/fail status with visual indicator
3. Display XP earned with animation
4. Show time taken
5. Buttons:
   - "Review Answers" - See detailed breakdown
   - "Retake Quiz" (if allowed)
   - "Back to Dashboard"

### 7.4. Answer Review

**Review Interface:**
1. Show all questions with user's answers
2. Visual indicators:
   - Green checkmark for correct answers
   - Red X for incorrect answers
3. For incorrect answers:
   - Show user's answer
   - Show correct answer
   - Display explanation
4. Show points earned per question
5. Calculate and display time spent per question (if tracked)
6. No editing allowed (read-only view)

---

## 8. Leaderboard & Gamification

### 8.1. Leaderboard Design

**Global Leaderboard:**
- Query users collection ordered by totalXP (descending)
- Display top 100 users
- Show rank, avatar, name, XP, quizzes completed
- Highlight current user's row
- Real-time updates when XP changes

**Leaderboard Card:**
```
Rank | Avatar | Name | XP | Quizzes Completed
-----|--------|------|----|-----------------
1    | [img]  | John | 5240 | 52
2    | [img]  | Jane | 4890 | 48
```

**Additional Views:**
- Filter by time period (this week, this month, all time)
- Department/team leaderboards (if user metadata includes department)

### 8.2. XP System

**XP Calculation Formula:**
```
baseXP = questionsCount * 10
difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 }
passingBonus = isPassed ? 1.5 : 1
xpAwarded = baseXP * difficultyMultiplier * passingBonus
```

**XP Triggers:**
- Completing any quiz
- Passing a quiz (50% bonus)
- Perfect score (additional 25% bonus)
- First attempt on a quiz (10% bonus)

**Badges/Achievements (Future Enhancement):**
- "First Quiz" - Complete first quiz
- "Perfect Score" - Get 100% on any quiz
- "Speed Demon" - Complete quiz in under 2 minutes
- "Persistent" - Complete same quiz 3 times
- Store in user document as `badges` array

### 8.3. User Statistics Dashboard

**Personal Stats (Visible to User):**
- Total XP with rank
- Quizzes completed
- Average score
- Total time spent on quizzes
- Strongest topic/category
- Improvement trend chart (score over time)

**Admin Analytics:**
- Total quizzes created
- Total assignments made
- Average completion rate
- Most popular quizzes
- User engagement metrics

---

## 9. Frontend Application Structure

### 9.1. Page Routes (Next.js App Router)

```
/app
├── page.tsx                          # Landing/login page
├── layout.tsx                        # Root layout with providers
├── (auth)
│   ├── login
│   │   └── page.tsx                  # Login page
│   └── register
│       └── page.tsx                  # Registration page
├── (dashboard)
│   ├── layout.tsx                    # Dashboard layout with nav
│   ├── admin
│   │   ├── page.tsx                  # Admin dashboard home
│   │   ├── quizzes
│   │   │   ├── page.tsx              # Quiz list
│   │   │   ├── create
│   │   │   │   └── page.tsx          # AI quiz generator
│   │   │   └── [quizId]
│   │   │       ├── page.tsx          # Quiz detail/edit
│   │   │       └── questions
│   │   │           └── page.tsx      # Question editor
│   │   ├── assignments
│   │   │   ├── page.tsx              # Assignment management
│   │   │   └── create
│   │   │       └── page.tsx          # Create assignment
│   │   ├── users
│   │   │   └── page.tsx              # User management
│   │   └── analytics
│   │       └── page.tsx              # Analytics dashboard
│   └── guest
│       ├── page.tsx                  # Guest dashboard home
│       ├── quizzes
│       │   ├── page.tsx              # All quizzes browse
│       │   └── [quizId]
│       │       ├── page.tsx          # Quiz details
│       │       └── take
│       │           └── page.tsx      # Quiz taking interface
│       ├── assignments
│       │   └── page.tsx              # My assignments
│       ├── results
│       │   └── [attemptId]
│       │       └── page.tsx          # Attempt review
│       └── leaderboard
│           └── page.tsx              # Leaderboard
└── api
    └── generateQuiz
        └── route.ts                  # API route for AI generation
```

### 9.2. Component Architecture

**Shared Components (`/components/ui`):**
- Button, Input, Card, Badge, Avatar (ShadCN UI)
- Toast notifications
- Loading spinners
- Modal dialogs
- Dropdown menus

**Feature Components (`/components/features`):**

**Authentication:**
- `LoginForm.tsx` - Email/password login
- `RegisterForm.tsx` - New user registration with domain validation
- `AuthProvider.tsx` - Context provider for auth state

**Quiz Components:**
- `QuizCard.tsx` - Quiz preview card
- `QuizList.tsx` - Grid/list of quizzes
- `QuizFilters.tsx` - Search and filter controls
- `QuestionRenderer.tsx` - Renders question based on type
- `QuizTimer.tsx` - Countdown timer component
- `QuizProgress.tsx` - Progress bar and navigation

**Question Type Components:**
- `MCQQuestion.tsx` - Multiple choice renderer
- `TrueFalseQuestion.tsx` - True/false renderer
- `OrderingQuestion.tsx` - Drag-drop sequence
- `FillBlankQuestion.tsx` - Text input renderer
- `MultipleSelectQuestion.tsx` - Checkbox multi-select

**Admin Components:**
- `QuizGenerator.tsx` - AI generation form
- `QuestionEditor.tsx` - Question editing interface
- `AssignmentCreator.tsx` - Assignment form
- `UserManagementTable.tsx` - User list with actions
- `AnalyticsDashboard.tsx` - Charts and statistics

**Leaderboard:**
- `LeaderboardTable.tsx` - Ranked user list
- `UserStatsCard.tsx` - Individual user statistics

### 9.3. State Management

**Context Providers:**

1. **AuthContext** (`/contexts/AuthContext.tsx`)
   - Current user object
   - Loading state
   - Login/logout functions
   - User role

2. **QuizContext** (`/contexts/QuizContext.tsx`)
   - Current quiz data
   - Questions array
   - Quiz settings

3. **AttemptContext** (`/contexts/AttemptContext.tsx`)
   - Current attempt state
   - User answers
   - Timer state
   - Save progress function

**Local State Patterns:**
- Use `useState` for component-local UI state
- Use `useEffect` for data fetching from Firestore
- Use `useReducer` for complex state (quiz attempt with multiple actions)

---

## 10. Backend Cloud Functions

### 10.1. Required Cloud Functions

**1. `generateQuizFromText`** (HTTPS Callable)
- **Trigger:** Called from admin quiz creation page
- **Input:** `{ text: string, questionCount: number, difficulty: string, questionTypes: string[], title: string, description: string }`
- **Process:**
  - Validate admin role via context.auth
  - Initialize Genkit with Gemini model
  - Construct detailed AI prompt
  - Call AI model and parse response
  - Validate generated questions
  - Create quiz and questions in Firestore
  - Log generation to aiGenerationLogs
- **Output:** `{ success: boolean, quizId: string, questionCount: number, error?: string }`

**2. `onUserCreate`** (Auth Trigger)
- **Trigger:** onCreate event in Firebase Auth
- **Process:**
  - Check if this is the first user (query users collection)
  - Create user document with appropriate role
  - Send welcome email
  - Create initial notification

**3. `onAssignmentCreate`** (Firestore Trigger)
- **Trigger:** onCreate in assignments collection
- **Process:**
  - Fetch user and quiz details
  - Send email notification to assigned user
  - Create in-app notification document
  - Schedule reminder for 24 hours before due date

**4. `onAttemptComplete`** (Firestore Trigger)
- **Trigger:** onUpdate in attempts collection when status changes to "completed"
- **Process:**
  - Update user totalXP and quizzesCompleted atomically
  - Update assignment status if applicable
  - Check for badge/achievement unlocks
  - Send congratulatory notification for milestones

**5. `sendAssignmentReminders`** (Scheduled Function)
- **Trigger:** Daily cron job at 9 AM
- **Process:**
  - Query assignments with dueDate within next 24 hours
  - Filter for status "pending" and reminderSent false
  - Send reminder emails
  - Update reminderSent to true

**6. `updateOverdueAssignments`** (Scheduled Function)
- **Trigger:** Daily cron job at midnight
- **Process:**
  - Query assignments with dueDate < now and status "pending"
  - Update status to "overdue"
  - Send overdue notification to admin and user

**7. `cleanupIncompleteAttempts`** (Scheduled Function)
- **Trigger:** Daily cron job
- **Process:**
  - Query attempts with status "in-progress" and startedAt > 7 days ago
  - Mark as abandoned or delete (based on data retention policy)

### 10.2. AI Integration with Genkit

**Genkit Flow Setup:**
```typescript
import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-ai';

const ai = genkit({
  plugins: [googleAI()],
  model: 'gemini-1.5-pro',
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuiz',
    inputSchema: z.object({
      text: z.string(),
      questionCount: z.number(),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      questionTypes: z.array(z.string()),
    }),
    outputSchema: z.object({
      questions: z.array(QuestionSchema),
    }),
  },
  async (input) => {
    const prompt = constructPrompt(input);
    const response = await ai.generate({
      model: 'gemini-1.5-pro',
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });
    
    return parseAndValidateResponse(response, input);
  }
);
```

**Prompt Construction Strategy:**
- Include input text with clear boundaries
- Specify exact question count and types
- Define JSON output format with schema
- Provide 2-3 examples for each question type
- Request difficulty-appropriate language
- Mandate explanations for all answers
- Include validation criteria in prompt

---

## 11. UI/UX Design Specifications

### 11.1. Design System

**Color Palette:**
- Primary: `#3498db` (Professional Blue)
- Primary Hover: `#2980b9`
- Secondary: `#2ecc71` (Success Green)
- Secondary Hover: `#27ae60`
- Background: `#ecf0f1` (Light Gray)
- Surface: `#ffffff` (White)
- Text Primary: `#2c3e50` (Dark Blue-Gray)
- Text Secondary: `#7f8c8d` (Medium Gray)
- Error: `#e74c3c` (Red)
- Warning: `#f39c12` (Orange)
- Border: `#bdc3c7` (Light Border Gray)

**Typography:**
- Font Family: 'PT Sans', system-ui, -apple-system, sans-serif
- Headings: 600
weight
  - H1: 2.5rem (40px)
  - H2: 2rem (32px)
  - H3: 1.5rem (24px)
  - H4: 1.25rem (20px)
- Body: 400 weight, 1rem (16px)
- Small: 0.875rem (14px)
- Line Height: 1.6

**Spacing Scale:**
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

**Border Radius:**
- Small: 4px (buttons, inputs)
- Medium: 8px (cards)
- Large: 12px (modals)
- Full: 9999px (pills, avatars)

**Shadows:**
- sm: `0 1px 2px rgba(0,0,0,0.05)`
- md: `0 4px 6px rgba(0,0,0,0.1)`
- lg: `0 10px 15px rgba(0,0,0,0.1)`
- xl: `0 20px 25px rgba(0,0,0,0.15)`

### 11.2. Component Specifications

**Button Variants:**
- Primary: Blue background, white text
- Secondary: White background, blue text, blue border
- Success: Green background, white text
- Danger: Red background, white text
- Ghost: Transparent, colored text on hover
- Sizes: sm (32px), md (40px), lg (48px)

**Input Fields:**
- Height: 40px
- Border: 1px solid `#bdc3c7`
- Border Radius: 4px
- Focus: 2px solid primary color
- Error State: Red border, red helper text below

**Cards:**
- Background: White
- Border: 1px solid `#ecf0f1`
- Border Radius: 8px
- Padding: 24px
- Shadow: md on hover

**Badges:**
- Difficulty Easy: Light green background
- Difficulty Medium: Light orange background
- Difficulty Hard: Light red background
- Status Pending: Light blue background
- Status Completed: Light green background
- Status Overdue: Light red background

### 11.3. Responsive Design Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Adaptations:**
- Single column layouts
- Hamburger navigation menu
- Simplified quiz cards (stack elements vertically)
- Full-width buttons
- Reduced padding and spacing

**Tablet Adaptations:**
- Two-column quiz grid
- Collapsible sidebar navigation
- Adaptive modal sizes

**Desktop:**
- Three-column quiz grid
- Persistent sidebar navigation
- Larger modals and dialogs

### 11.4. Animation & Transitions

**Micro-interactions:**
- Button hover: scale(1.02) + shadow increase (150ms ease)
- Card hover: lift effect with shadow (200ms ease)
- Input focus: border color fade (150ms ease)
- Toast notification: slide-in from top (300ms ease-out)

**Page Transitions:**
- Route changes: fade (200ms)
- Modal open/close: scale + fade (250ms ease-in-out)

**Loading States:**
- Skeleton screens for data fetching
- Spinner for actions (quiz generation, submission)
- Progress bars for long operations

**Success Feedback:**
- Confetti animation on quiz completion
- Checkmark animation on correct answers
- XP counter animation (count up effect)

---

## 12. Error Handling & Edge Cases

### 12.1. Error Scenarios

**Authentication Errors:**
- Invalid email format: Show inline validation
- Weak password: Display strength meter and requirements
- Email already in use: Suggest login instead
- Wrong password: Generic error for security
- Email domain restriction: Clear message about @alsoit.com requirement
- Network error: Retry option with offline indicator

**Quiz Generation Errors:**
- AI service timeout: Show retry button, save input text
- Malformed AI response: Log error, offer manual creation
- Insufficient input text: Require minimum 500 characters
- Invalid parameters: Inline validation before submission
- Quota exceeded: Show error with upgrade message (if applicable)

**Quiz Taking Errors:**
- Session timeout: Auto-save, allow resume
- Network disconnection: Save to localStorage, sync on reconnect
- Time expiry: Auto-submit with saved answers
- Attempt already exists (no retries): Block start, show message
- Quiz deleted mid-attempt: Graceful error, return to dashboard

**Data Sync Errors:**
- Firestore offline: Enable offline persistence, show sync status
- Security rule violation: Clear error message, don't expose rules
- Concurrent updates: Implement optimistic locking
- Write rate limits: Queue operations, show progress

### 12.2. Edge Case Handling

**User Management:**
- Only admin deletes self: Prevent if they're the last admin
- User deletes account: Cascade delete or anonymize their attempts
- Admin promotion: Validate admin permissions

**Quiz Management:**
- Delete quiz with active assignments: Warn admin, offer to unassign
- Edit quiz after attempts exist: Create new version or warn about impact
- Zero questions: Prevent publishing
- All answers incorrect: Validation before save

**Assignment:**
- Assign to self: Allow (useful for testing)
- Duplicate assignment: Update due date instead of creating new
- Assign unpublished quiz: Automatically publish or prevent
- Past due date: Warn admin

**Attempts:**
- Multiple browser tabs: Only allow one active attempt
- Browser crash: Resume from last saved state
- Manual time manipulation: Validate server-side timestamps
- Submit with no answers: Allow but score as zero

**Leaderboard:**
- Tied XP scores: Secondary sort by quizzesCompleted, then alphabetical
- User opt-out: Allow privacy setting to hide from leaderboard
- New user with 0 XP: Show in leaderboard with rank

---

## 13. Performance Optimization

### 13.1. Firestore Optimization

**Query Optimization:**
- Use composite indexes for complex queries
- Paginate quiz and attempt lists (10-20 per page)
- Fetch only required fields with `.select()`
- Cache frequently accessed data (quizzes, user profiles)

**Data Structure Optimization:**
- Denormalize quiz metadata to avoid joins
- Store question count on quiz document
- Use subcollections for large datasets (questions, attempts)
- Implement data archiving for old attempts (>6 months)

**Write Optimization:**
- Batch writes for related operations (quiz + questions)
- Use transactions for concurrent updates (XP, leaderboard)
- Implement request debouncing for auto-save
- Rate limit AI generation requests

### 13.2. Frontend Optimization

**Code Splitting:**
- Lazy load admin routes (only when admin logs in)
- Dynamic import for quiz taking interface
- Separate bundle for Genkit integration

**Asset Optimization:**
- Use Next.js Image component for avatars
- Compress images to WebP
- Implement CDN for static assets
- Tree-shake unused ShadCN components

**Caching Strategy:**
- React Query for Firestore data caching
- SWR (stale-while-revalidate) for leaderboard
- Cache quiz questions for attempt duration
- Invalidate cache on data mutations

**Rendering Optimization:**
- Use React.memo for heavy components
- Virtualize long lists (react-window)
- Debounce search inputs
- Optimize re-renders with useCallback/useMemo

### 13.3. Loading States

**Skeleton Screens:**
- Quiz card skeletons during fetch
- Question skeleton during quiz load
- Leaderboard table skeleton

**Progressive Loading:**
- Load quiz metadata first, then questions
- Stream AI generation progress (if possible)
- Load leaderboard in chunks of 20

**Optimistic Updates:**
- Immediately show quiz card after creation
- Update XP locally before server confirms
- Mark assignment as completed instantly

---

## 14. Testing Strategy

### 14.1. Unit Testing

**Frontend (Jest + React Testing Library):**
- Question renderer components
- Answer validation logic
- XP calculation functions
- Form validation

**Backend (Jest):**
- Cloud Functions logic
- AI prompt construction
- Score calculation
- Security rule helpers

### 14.2. Integration Testing

**Firebase Emulator Suite:**
- Test Firestore security rules
- Test Cloud Functions locally
- Test authentication flows
- Test Firestore triggers

**End-to-End (Cypress/Playwright):**
- Complete quiz creation flow
- Quiz taking and submission
- Assignment workflow
- Leaderboard updates

### 14.3. Test Scenarios

**Critical Paths:**
1. Admin generates quiz → edits → publishes
2. Guest receives assignment → takes quiz → views results
3. Guest browses quizzes → starts quiz → timer expires → auto-submit
4. Admin assigns quiz → guest completes → XP updates → leaderboard refreshes

**Security Testing:**
- Guest attempts to access admin routes
- Unauthenticated user attempts to read quizzes
- User attempts to modify another user's attempt
- SQL injection in search inputs (Firestore safe, but validate)

---

## 15. Deployment & DevOps

### 15.1. Firebase Hosting Configuration

**firebase.json:**
```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

### 15.2. Environment Variables

**Required Environment Variables:**
```
# Firebase Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini AI (for Cloud Functions)
GOOGLE_AI_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=https://quizzz.alsoit.com
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=@alsoit.com

# Feature Flags
NEXT_PUBLIC_ENABLE_BADGES=false
NEXT_PUBLIC_MAX_QUESTIONS_PER_QUIZ=50
```

### 15.3. Deployment Pipeline

**CI/CD with GitHub Actions:**
1. Run tests on push to main
2. Build Next.js app (`next build`)
3. Deploy functions (`firebase deploy --only functions`)
4. Deploy Firestore rules and indexes
5. Deploy hosting (`firebase deploy --only hosting`)
6. Run smoke tests on production

**Staging Environment:**
- Separate Firebase project for staging
- Deploy on push to `develop` branch
- Use staging Gemini API quota

### 15.4. Monitoring & Logging

**Firebase Performance Monitoring:**
- Track page load times
- Monitor API response times
- Track quiz generation duration

**Cloud Logging:**
- Log all Cloud Function executions
- Log AI generation attempts and failures
- Log security rule violations

**Error Tracking (Firebase Crashlytics or Sentry):**
- Frontend JavaScript errors
- Backend function errors
- User-reported issues

**Analytics (Firebase Analytics):**
- Track quiz creation events
- Track quiz completion rates
- Track user engagement metrics
- Monitor conversion funnel (register → first quiz)

---

## 16. Security Considerations

### 16.1. Authentication Security

- Enforce strong password requirements (min 8 chars, mixed case, number)
- Implement rate limiting on login attempts
- Use Firebase App Check to prevent abuse
- Implement CAPTCHA on registration (if spam is an issue)
- Email verification required before access (optional)
- Session management with token refresh

### 16.2. Data Security

- Encrypt sensitive data at rest (Firebase default)
- Validate all user inputs client and server-side
- Sanitize rich text content to prevent XSS
- Use Firestore security rules as primary access control
- Implement field-level security (e.g., prevent XP tampering)
- Regular security rule audits

### 16.3. API Security

- Authenticate all Cloud Function calls
- Validate function inputs with Zod schemas
- Rate limit AI generation (max 10 per hour per user)
- Implement CORS policies
- Use HTTPS-only callable functions
- Monitor for abuse patterns

### 16.4. Content Security

- Sanitize AI-generated content
- Implement content filtering for inappropriate language
- Admin review for AI-generated quizzes before publishing (optional)
- Report abuse mechanism for quiz content
- GDPR compliance for user data (export, deletion)

---

## 17. Accessibility (WCAG 2.1 Level AA)

### 17.1. Requirements

- Semantic HTML throughout (nav, main, article, section)
- Proper heading hierarchy (h1 → h2 → h3)
- Sufficient color contrast (4.5:1 for text, 3:1 for UI components)
- Keyboard navigation for all interactive elements
- Focus indicators visible on all focusable elements
- ARIA labels for icon buttons and complex widgets
- Screen reader announcements for dynamic content
- Skip navigation links
- Form labels properly associated with inputs

### 17.2. Quiz Taking Accessibility

- Keyboard shortcuts for navigation (n: next, p: previous, s: submit)
- Announce question changes to screen readers
- Announce timer warnings
- High contrast mode support
- Adjustable text size
- Support for screen readers (NVDA, JAWS, VoiceOver)

---

## 18. Future Enhancements (Post-MVP)

### 18.1. Advanced Features

- **Quiz Randomization**: Shuffle questions and answer options
- **Question Banks**: Reusable question library
- **Collaborative Quizzes**: Team-based quiz taking
- **Quiz Templates**: Pre-made quiz structures
- **Rich Media**: Support images, videos, audio in questions
- **Essay Questions**: Open-ended questions with manual grading
- **Peer Review**: Users review each other's essay answers
- **Quiz Comments**: Discussion threads on quiz pages
- **Quiz Ratings**: Users rate quiz quality

### 18.2. Analytics & Reporting

- **Advanced Admin Analytics**: Detailed performance breakdowns
- **User Progress Tracking**: Visualize improvement over time
- **Topic Mastery**: Track knowledge by category
- **Export Reports**: PDF/Excel exports of results
- **Learning Paths**: Sequential quiz recommendations
- **Predictive Analytics**: Identify struggling users

### 18.3. Integrations

- **Calendar Integration**: Sync assignments with Google Calendar
- **Slack/Teams Notifications**: Push notifications to team chat
- **Single Sign-On (SSO)**: Corporate identity providers
- **LMS Integration**: Export to SCORM format
- **Zapier/API Webhooks**: Trigger external automations

### 18.4. Mobile App

- **Native Mobile Apps**: iOS and Android with React Native
- **Offline Mode**: Take quizzes without internet
- **Push Notifications**: Assignment reminders
- **Mobile-First Features**: Swipe navigation, haptic feedback

---

## 19. Success Metrics & KPIs

### 19.1. User Engagement

- Daily/Monthly Active Users (DAU/MAU)
- Average quizzes per user per week
- Average time spent on platform
- Quiz completion rate (started vs. finished)
- Retry rate (how often users retake quizzes)

### 19.2. Content Metrics

- Total quizzes created
- AI vs. manually created quizzes ratio
- Average questions per quiz
- Quiz difficulty distribution

### 19.3. Learning Effectiveness

- Average quiz scores
- Score improvement over time
- Assignment completion rate
- Time to complete assignments
- Passing rate

### 19.4. Platform Health

- AI generation success rate
- Average generation time
- Error rate (frontend and backend)
- Page load times
- API response times

---

## 20. Documentation Requirements

### 20.1. Developer Documentation

- Setup guide (local development)
- Firestore schema documentation
- API documentation (Cloud Functions)
- Component library (Storybook)
- Contribution guidelines

### 20.2. User Documentation

- Admin guide (quiz creation, assignment management)
- User guide (taking quizzes, understanding XP)
- FAQ section
- Video tutorials (screen recordings)
- Troubleshooting guide

### 20.3. Deployment Documentation

- Deployment checklist
- Environment setup guide
- Firebase configuration guide
- Rollback procedures
- Incident response plan

---

## 21. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Firebase project setup
- Authentication implementation
- Basic UI components and design system
- User management (registration, login, profiles)

### Phase 2: Core Quiz Features (Weeks 3-4)
- Quiz data model and Firestore schema
- Admin quiz creation (manual)
- Question type components
- Quiz taking interface
- Scoring and results

### Phase 3: AI Integration (Week 5)
- Genkit setup and Gemini integration
- AI quiz generation Cloud Function
- Prompt engineering and testing
- Error handling and validation

### Phase 4: Assignments & Tracking (Week 6)
- Assignment system
- "My Assignments" view
- Email notifications
- Due date tracking

### Phase 5: Gamification (Week 7)
- XP system implementation
- Leaderboard
- User statistics dashboard
- Attempt review interface

### Phase 6: Polish & Launch (Week 8)
- Security rules finalization
- Performance optimization
- Accessibility audit
- User acceptance testing
- Documentation
- Deployment to production

---

## 22. Support & Maintenance

### 22.1. Support Channels

- In-app feedback button
- Email support (support@alsoit.com)
- Internal Slack channel for bug reports
- Monthly user feedback sessions

### 22.2. Maintenance Tasks

- **Weekly**: Review error logs, monitor quotas
- **Monthly**: Review and update security rules, audit user activity
- **Quarterly**: Performance optimization, dependency updates
- **Annually**: Security audit, GDPR compliance review

### 22.3. Backup & Disaster Recovery

- Automated daily Firestore backups
- Test restoration procedures quarterly
- Data retention policy (7 years for attempts, indefinite for users)
- Incident response plan for data breaches

---

## Summary

This comprehensive technical requirements document provides Firebase Studio with all necessary specifications to build **Appsatile Quizzz**. The system leverages Firebase Authentication, Cloud Firestore, Cloud Functions, and Firebase Hosting to create a scalable, secure, and engaging quiz platform with AI-powered content generation.

**Key Technical Highlights:**
- Role-based access control with Firestore security rules
- AI-powered quiz generation using Google Gemini via Genkit
- Real-time leaderboards and gamification with XP system
- Comprehensive assignment and tracking system
- Responsive, accessible UI built with Next.js and ShadCN UI
- Robust error handling and edge case management
- Performance-optimized architecture for scalability

The platform is designed to enhance team learning through engaging, AI-generated quizzes while providing administrators with powerful tools for content creation, assignment management, and analytics.