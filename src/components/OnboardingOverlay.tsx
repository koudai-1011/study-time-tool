import React, { useState, useEffect } from 'react';
import ReactJoyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useStudy } from '../context/StudyContext';

const ONBOARDING_KEY = 'has_completed_onboarding_v1';

export const OnboardingOverlay: React.FC = () => {
  const [run, setRun] = useState(false);
  const { settings } = useStudy();
  const isDarkMode = settings.isDarkMode;

  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompleted) {
      // 少し待ってから開始（DOMレンダリング待ち）
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ((STATUS.FINISHED as string) === status || (STATUS.SKIPPED as string) === status) {
      setRun(false);
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h3 className="font-bold text-lg mb-2">ようこそ！🎉</h3>
          <p>勉強時間割振ツールへようこそ。<br/>簡単な使い方をご案内します。</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#widget-start_timer',
      content: 'まずはここをタップして、学習時間を計測しましょう。',
      title: '計測スタート',
    },
    {
      target: '#widget-progress',
      content: '目標時間に対する進捗がここに表示されます。グラフが伸びていく様子を楽しみましょう！',
      title: '進捗バー',
    },
    {
      target: '#widget-category_chart',
      content: '科目ごとのバランスを確認できます。',
      title: '学習バランス',
    },
    {
      target: '#widget-streak',
      content: '【新機能】連続学習日数が表示されます。途切れないように毎日少しでも学習しましょう！🔥',
      title: '継続は力なり',
    },
    {
      target: '#edit-layout-button',
      content: '画面のレイアウトは自由に変更できます。自分だけのダッシュボードを作りましょう。',
      title: 'カスタマイズ',
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <p>準備は完了です。<br/>さあ、今日の学習を始めましょう！</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  return (
    <ReactJoyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366f1', // Indigo-500
          textColor: isDarkMode ? '#f1f5f9' : '#334155',
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          arrowColor: isDarkMode ? '#1e293b' : '#ffffff',
        },
        tooltip: {
            borderRadius: '12px',
        },
        buttonNext: {
            borderRadius: '8px',
        },
        buttonBack: {
            borderRadius: '8px',
            color: isDarkMode ? '#94a3b8' : '#64748b',
        }
      }}
      locale={{
        back: '戻る',
        close: '閉じる',
        last: '完了',
        next: '次へ',
        skip: 'スキップ',
      }}
    />
  );
};
