import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Skull } from 'lucide-react';

interface SabotageModalProps {
  onClose: () => void;
  dailyGoalHours: number;
}

export const SabotageModal: React.FC<SabotageModalProps> = ({ onClose, dailyGoalHours }) => {
  const [sabotageHours, setSabotageHours] = useState(1);
  const [recoveryDays, setRecoveryDays] = useState(30);

  // Calculate impact
  // Impact (minutes per day) = (Sabotage Hours * 60) / Recovery Days
  const impactMinutes = Math.ceil((sabotageHours * 60) / recoveryDays);
  
  // Calculate new daily goal
  const newDailyGoalMinutes = (dailyGoalHours * 60) + impactMinutes;
  const newDailyGoalHours = Math.floor(newDailyGoalMinutes / 60);
  const newDailyGoalMinsRemainder = newDailyGoalMinutes % 60;

  // Fear level calculation (0 to 1) for styling
  const fearLevel = Math.min(1, impactMinutes / 60); 

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-red-900/50 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-900/50 to-slate-900 pointer-events-none" />
          
          <div className="relative p-6 md:p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-6 text-red-500">
              <Skull size={32} className="animate-pulse" />
              <h2 className="text-2xl font-bold tracking-wider">サボり計算機</h2>
            </div>

            <div className="space-y-8">
              {/* Sabotage Input */}
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-4">
                  何時間サボりますか？
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="72"
                    value={sabotageHours}
                    onChange={(e) => setSabotageHours(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <span className="text-3xl font-bold text-white tabular-nums w-20 text-right">
                    {sabotageHours}<span className="text-sm text-slate-500 ml-1">h</span>
                  </span>
                </div>
              </div>

              {/* Recovery Period Input */}
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-4">
                  何日で取り戻しますか？
                </label>
                <div className="flex gap-2 justify-center">
                  {[7, 14, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setRecoveryDays(days)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        recoveryDays === days
                          ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {days}日後
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Display */}
              <div className="bg-black/40 rounded-2xl p-6 border border-red-900/30 text-center relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-red-600/10 blur-xl transition-opacity duration-500"
                  style={{ opacity: fearLevel }}
                />
                
                <p className="text-slate-400 mb-2 relative z-10">
                  1日あたりの目標が
                </p>
                
                <div className="relative z-10 my-4">
                  <motion.div 
                    key={impactMinutes}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] tabular-nums"
                  >
                    +{impactMinutes}
                    <span className="text-2xl md:text-3xl ml-2 text-red-400">分</span>
                  </motion.div>
                </div>

                <p className="text-slate-400 relative z-10">
                  増加してしまいます...
                </p>

                <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                  <p className="text-sm text-slate-500 mb-1">新しい1日の目標</p>
                  <p className="text-xl font-bold text-white">
                    {newDailyGoalHours}時間 {newDailyGoalMinsRemainder}分
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-600">
                  ※ {recoveryDays}日間で帳尻を合わせる場合の計算です
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
