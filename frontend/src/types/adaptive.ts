/**
 * QUANTUMANIA - Adaptive Learning & Learner Intelligence Types
 * Phase 6: Adaptive Learning & Learner Intelligence
 */

export type LearningEventType =
  | 'lesson_started'
  | 'lesson_completed'
  | 'topic_viewed'
  | 'assessment_started'
  | 'assessment_completed'
  | 'question_answered'
  | 'circuit_created'
  | 'circuit_modified'
  | 'circuit_simulated'
  | 'tutor_question'
  | 'tutor_hint'
  | 'tutor_explanation'
  | 'tutor_analysis'
  | 'practice_completed';

export type RecommendationType =
  | 'continue_learning'
  | 'review_lesson'
  | 'build_circuit'
  | 'run_simulation'
  | 'attempt_assessment'
  | 'ask_tutor';

export interface LearningEventCreate {
  event_type: LearningEventType;
  topic_id?: string;
  lesson_id?: string;
  concept_id?: string;
  metadata?: Record<string, unknown>;
}

export interface LearningEvent {
  id: string;
  user_id: string;
  event_type: LearningEventType;
  topic_id?: string;
  lesson_id?: string;
  concept_id?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface TopicMastery {
  topic_id: string;
  topic_title: string;
  module_title?: string;
  score: number; // 0 - 100
  confidence: number; // 0 - 1.0
  attempts: number;
  correct_attempts: number;
  level: 'Not Started' | 'Beginning' | 'Developing' | 'Proficient' | 'Strong' | string;
  last_activity_at?: string | null;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: number;
  reason: string;
  target_id?: string;
  action_url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | string;
}

export interface LearningActivity {
  id: string;
  event_type: string;
  title: string;
  description: string;
  topic_id?: string;
  lesson_id?: string;
  timestamp: string;
}

export interface AssessmentSubmission {
  topic_id: string;
  question_id: string;
  is_correct: boolean;
  user_answer?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface LearnerContext {
  overall_progress: number;
  current_topic?: string | null;
  topic_mastery: TopicMastery[];
  weak_topics: string[];
  strengths: string[];
  recommended_next: Recommendation[];
}

export interface LearnerDashboardData {
  user_id: string;
  display_name: string;
  overall_progress: number;
  total_xp: number;
  learning_streak_days: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  active_difficulty: string;
  topic_mastery: TopicMastery[];
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  recent_activity: LearningActivity[];
}
