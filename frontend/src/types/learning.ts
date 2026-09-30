export interface ContentBlock {
  type: 'heading' | 'subheading' | 'text' | 'callout' | 'equation' | 'code' | 'bullet_list' | 'numbered_list' | 'example';
  content?: string;
  title?: string;
  variant?: 'info' | 'tip' | 'warning' | 'formula';
  language?: string;
  items?: string[];
}

export interface LessonNavigation {
  previous_lesson_id: string | null;
  next_lesson_id: string | null;
}

export interface LessonSummary {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  description?: string | null;
  estimated_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xp_reward: number;
  display_order: number;
  is_completed: boolean;
  has_interactive_circuit: boolean;
}

export interface ModuleSummary {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description?: string | null;
  display_order: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  lessons: LessonSummary[];
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  total_modules: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
}

export interface CourseDetail extends CourseSummary {
  modules: ModuleSummary[];
}

export interface InteractiveMeta {
  type: string;
  templateId?: string;
  label?: string;
}

export interface LessonDetail {
  id: string;
  module_id: string;
  module_title: string;
  course_id: string;
  title: string;
  slug: string;
  description?: string | null;
  estimated_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xp_reward: number;
  display_order: number;
  objectives: string[];
  content_blocks: ContentBlock[];
  content_markdown: string;
  initial_circuit?: Record<string, unknown> | null;
  interactive?: InteractiveMeta | null;
  is_completed: boolean;
  navigation: LessonNavigation;
}

export interface LessonCompleteResponse {
  lesson_id: string;
  is_completed: boolean;
  xp_awarded: number;
  next_lesson_id: string | null;
  course_progress_percent: number;
}

export interface ModuleProgressItem {
  module_id: string;
  title: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
}

export interface RecentLessonPointer {
  lesson_id: string;
  title: string;
  module_id: string;
  module_title: string;
  display_order: number;
  estimated_minutes: number;
}

export interface CompletedLessonAudit {
  lesson_id: string;
  title: string;
  module_title: string;
  completed_at: string;
}

export interface LearningProgressSummary {
  total_xp: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  course_progress_percent: number;
  modules_progress: ModuleProgressItem[];
  recent_incomplete_lesson?: RecentLessonPointer | null;
  recently_completed_lessons: CompletedLessonAudit[];
}
