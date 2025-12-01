import type { StudyLog, Category } from '../types';
import { formatTimeJapanese } from './timeFormat';

interface CalendarEvent {
  summary: string;
  description: string;
  start: { date: string };
  end: { date: string };
}

export const createDailyStudyEvent = async (
  accessToken: string,
  date: Date,
  logs: StudyLog[],
  categories: Category[]
): Promise<void> => {
  // Calculate total duration
  const totalDuration = logs.reduce((acc, log) => acc + log.duration, 0);
  const totalHours = totalDuration / 3600;

  // Group by category
  const categoryMap = new Map<number, number>();
  logs.forEach(log => {
    const current = categoryMap.get(log.categoryId) || 0;
    categoryMap.set(log.categoryId, current + log.duration);
  });

  // Build description
  let description = '【学習内訳】\n';
  categoryMap.forEach((duration, categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      description += `- ${category.name}: ${formatTimeJapanese(duration / 3600)}\n`;
    }
  });

  // Format date as YYYY-MM-DD
  const dateString = date.toISOString().split('T')[0];

  const event: CalendarEvent = {
    summary: `学習記録: ${formatTimeJapanese(totalHours)}`,
    description: description,
    start: { date: dateString },
    end: { date: dateString },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create calendar event: ${JSON.stringify(errorData)}`);
  }
};
