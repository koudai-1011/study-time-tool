import { format, subDays, parseISO } from 'date-fns';
import type { StudyLog } from '../types';

/**
 * 学習ログから継続日数（ストリーク）を計算する
 * 
 * 仕様:
 * - 今日学習していれば、今日を含めて連続何日か
 * - 今日まだ学習していなくても、昨日学習していればストリークは継続中とみなす
 * - 昨日学習していなければ、今日の学習があれば1日、なければ0日
 * 
 * @param logs 学習ログの配列
 * @returns 現在のストリーク日数
 */
export const calculateStreak = (logs: StudyLog[]): number => {
  if (!logs.length) return 0;

  // 日付文字列 (yyyy-MM-dd) のユニークなセットを作成
  const studyDates = new Set<string>();
  logs.forEach(log => {
      // ISO文字列またはDateオブジェクトから日付部分を抽出
      const date = typeof log.date === 'string' ? parseISO(log.date) : log.date;
      studyDates.add(format(date, 'yyyy-MM-dd'));
  });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  let streak = 0;
  let currentCheckDate = today;

  // もし今日学習していなければ、起点の日付を昨日にずらすかチェック
  // ただし、昨日も学習していない場合はストリーク切れ（0日）
  // 今日学習している -> 今日から遡る
  // 今日学習していない -> 昨日学習している -> 昨日から遡る
  // どっちもしていない -> 0
  
  const hasStudiedToday = studyDates.has(todayStr);
  const hasStudiedYesterday = studyDates.has(yesterdayStr);

  if (!hasStudiedToday && !hasStudiedYesterday) {
    return 0;
  }

  // 起点を決定
  if (hasStudiedToday) {
    currentCheckDate = today;
  } else {
    currentCheckDate = subDays(today, 1);
  }

  // 遡ってカウント
  while (true) {
    const checkDateStr = format(currentCheckDate, 'yyyy-MM-dd');
    if (studyDates.has(checkDateStr)) {
      streak++;
      currentCheckDate = subDays(currentCheckDate, 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * 過去1年間のヒートマップ用データを生成
 */
export const generateHeatmapData = (logs: StudyLog[]) => {
  // 実装予定（今回はスキップ可能だが型枠だけ用意）
  console.log(logs.length); // suppress unused variable
  return [];
};
