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
  
  // 新しい通知設定
  reviewNotification: boolean; // 復習通知
  reviewNotificationTime: string;

  timerProgressNotification: boolean; // 通常タイマー常時通知
  pomodoroProgressNotification: boolean; // ポモドーロ常時通知

  goalCheckNotification: boolean; // 目標達成チェック通知
  goalCheckTime: string;

  // 設定値（通知トリガーではないが設定として保持）
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
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
  reviewSettings?: ReviewSettings;
  enableSwipeNavigation?: boolean; // スワイプでのタブ遷移
  reduceAnimations?: boolean; // アニメーションを減らす（軽量化）
  confirmBeforeDelete?: boolean; // 削除前に確認を表示
}

export type DashboardWidgetType = 'start_timer' | 'pomodoro_timer' | 'progress' | 'daily_goal' | 'today_study' | 'total_study' | 'remaining_time' | 'category_chart' | 'today_review' | 'sabotage_mode' | 'streak';

export type DashboardWidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface DashboardWidget {
  id: DashboardWidgetType;
  visible: boolean;
  order: number;
  size: DashboardWidgetSize; // 後方互換性のため残す
  width?: number;  // 1-4マス（新仕様）
  height?: number; // 1-4マス（新仕様）
  gridX?: number;  // グリッド上のX位置
  gridY?: number;  // グリッド上のY位置
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}

export interface ReviewItem {
  id: string;
  content: string;           // 学習内容
  categoryId: number;        // カテゴリ
  baseDate: string;          // 基準日（ISO形式 YYYY-MM-DD）
  completedReviews: number[]; // 完了済み復習インデックス [0,1,2...]
  created: string;           // 作成日時（ISO形式）
}

export interface ReviewSettings {
  enabled: boolean;          // 機能の有効/無効
  intervals: number[];       // 復習間隔（日数） [1,3,7,14,30,60]
  notificationEnabled: boolean; // 復習通知の有効/無効
}

export interface ReviewSuggestion {
  id: string;
  content: string;
  categoryId: number;
  useRange?: boolean; // 範囲入力を使用するか
  unit?: string;      // 単位（例: "p.", "No.", "ページ"）
}
