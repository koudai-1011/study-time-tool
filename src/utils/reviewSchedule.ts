import type { ReviewItem } from '../types';

/** デフォルトの復習間隔（日数）- エビングハウスの忘却曲線最適化版 */
export const DEFAULT_REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60];

/**
 * 基準日から復習日程を計算
 * @param baseDate 基準日（YYYY-MM-DD）
 * @param intervals 復習間隔（日数の配列）
 * @returns 復習日の配列（YYYY-MM-DD形式）
 */
export function calculateReviewDates(
  baseDate: string,
  intervals: number[] = DEFAULT_REVIEW_INTERVALS
): string[] {
  const base = new Date(baseDate + 'T00:00:00'); // UTC回避のためT00:00:00
  
  return intervals.map(days => {
    const reviewDate = new Date(base);
    reviewDate.setDate(base.getDate() + days);
    return formatDateYMD(reviewDate);
  });
}

/**
 * Date を YYYY-MM-DD 形式に変換
 */
export function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 今日の復習項目を抽出
 * @param items 全復習項目
 * @param intervals 復習間隔
 * @returns 今日復習すべき項目のリスト
 */
export function getTodayReviews(
  items: ReviewItem[],
  intervals: number[] = DEFAULT_REVIEW_INTERVALS
): ReviewItem[] {
  const today = formatDateYMD(new Date());
  
  return items.filter(item => {
    const schedules = calculateReviewDates(item.baseDate, intervals);
    
    // 今日が復習日で、かつまだ完了していない復習があるか
    return schedules.some((date, index) => 
      date === today && !item.completedReviews.includes(index)
    );
  });
}

/**
 * 指定日の復習項目を抽出
 * @param items 全復習項目
 * @param targetDate 対象日（YYYY-MM-DD）
 * @param intervals 復習間隔
 * @returns 指定日の復習項目
 */
export function getReviewsForDate(
  items: ReviewItem[],
  targetDate: string,
  intervals: number[] = DEFAULT_REVIEW_INTERVALS
): Array<ReviewItem & { reviewIndex: number }> {
  const result: Array<ReviewItem & { reviewIndex: number }> = [];
  
  for (const item of items) {
    const schedules = calculateReviewDates(item.baseDate, intervals);
    schedules.forEach((date, index) => {
      if (date === targetDate && !item.completedReviews.includes(index)) {
        result.push({ ...item, reviewIndex: index });
      }
    });
  }
  
  return result;
}

/**
 * 月別の復習カウントを取得
 * @param items 全復習項目
 * @param year 年
 * @param month 月（1-12）
 * @param intervals 復習間隔
 * @returns { 'YYYY-MM-DD': count } の Map
 */
export function getMonthlyReviewCounts(
  items: ReviewItem[],
  year: number,
  month: number,
  intervals: number[] = DEFAULT_REVIEW_INTERVALS
): Map<string, number> {
  const counts = new Map<string, number>();
  
  for (const item of items) {
    const schedules = calculateReviewDates(item.baseDate, intervals);
    schedules.forEach((date, index) => {
      const [y, m] = date.split('-').map(Number);
      if (y === year && m === month && !item.completedReviews.includes(index)) {
        counts.set(date, (counts.get(date) || 0) + 1);
      }
    });
  }
  
  return counts;
}

/**
 * 復習の進捗率を計算
 * @param item 復習項目
 * @param intervals 復習間隔
 * @returns 進捗率（0-100）
 */
export function getReviewProgress(
  item: ReviewItem,
  intervals: number[] = DEFAULT_REVIEW_INTERVALS
): number {
  const total = intervals.length;
  const completed = item.completedReviews.length;
  return Math.round((completed / total) * 100);
}
