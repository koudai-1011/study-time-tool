import React, { useState } from 'react';
import { CalendarView } from './CalendarView';
import { TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { ProgressDetailModal } from './ProgressDetailModal';
import { StudyTimeDetailModal } from './StudyTimeDetailModal';

export const HistoryScreen: React.FC = () => {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showStudyTimeModal, setShowStudyTimeModal] = useState(false);

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">学習履歴</h2>
        <p className="text-slate-500 mt-2">これまでの学習記録と分析データを確認できます。</p>
      </header>

      {/* Calendar Section */}
      <section>
        <CalendarView />
      </section>

      {/* Analytics Section */}
      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-4">詳細分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowProgressModal(true)}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800">進捗率の推移</h4>
                <p className="text-xs text-slate-500">目標達成度の変化を確認</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>

          <button
            onClick={() => setShowStudyTimeModal(true)}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800">学習時間の推移</h4>
                <p className="text-xs text-slate-500">日々の学習量を確認</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </section>

      {/* Modals */}
      {showProgressModal && (
        <ProgressDetailModal onClose={() => setShowProgressModal(false)} />
      )}

      {showStudyTimeModal && (
        <StudyTimeDetailModal onClose={() => setShowStudyTimeModal(false)} />
      )}
    </div>
  );
};
