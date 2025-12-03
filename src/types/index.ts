export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface StudyLog {
  id: string;
  date: string; // ISO string
  duration: number; // in seconds
  categoryId: number; // 0-9
}

export interface NotificationSettings {
  enabled: boolean;
  pomodoroTimer: boolean;
  timerCompletion: boolean;
  longStudyBreak: boolean;
  dailyGoalAchievement: boolean;
  dailyReminder: boolean;
  eveningReminder: boolean;
  deadlineWarning: boolean;
  pomodoroFocusMinutes: number; // デフォルト: 25
  pomodoroBreakMinutes: number; // デフォルト: 5
  dailyReminderTime: string; // HH:MM format
  eveningReminderTime: string; // HH:MM format
  longStudyBreakMinutes: number; // デフォルト: 120 (2時間)
}

export interface Settings {
  targetHours: number;
  startDate: string; // ISO string (YYYY-MM-DD)
  endDate: string; // ISO string (YYYY-MM-DD)
  categories: Category[];
  defaultCategoryId?: number;
  dashboardLayout?: DashboardLayout;
  isDarkMode?: boolean;
  showDailyGoalLine?: boolean;
  notificationSettings?: NotificationSettings;
}

export type DashboardWidgetType = 'start_timer' | 'pomodoro_timer' | 'progress' | 'daily_goal' | 'today_study' | 'total_study' | 'remaining_time' | 'category_chart';

export interface DashboardWidget {
  id: DashboardWidgetType;
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}
