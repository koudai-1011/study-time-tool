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

export interface Settings {
  targetHours: number;
  startDate: string; // ISO string (YYYY-MM-DD)
  endDate: string; // ISO string (YYYY-MM-DD)
  categories: Category[];
  defaultCategoryId?: number;
  dashboardLayout?: DashboardLayout;
}

export type DashboardWidgetType = 'start_timer' | 'progress' | 'daily_goal' | 'today_study' | 'total_study' | 'remaining_time' | 'category_chart';

export interface DashboardLayout {
  widgets: {
    id: DashboardWidgetType;
    visible: boolean;
    order: number;
  }[];
}
