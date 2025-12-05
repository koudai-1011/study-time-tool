import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  onClick?: () => void;
  compact?: boolean; // コンパクト表示
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, color, onClick, compact = false }) => (
  <motion.div
    className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm ${
      compact ? 'p-3' : 'p-6'
    } ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    whileTap={{ scale: 0.98 }}
  >
    <div className={`flex items-center gap-2 ${compact ? 'mb-2' : 'mb-4'}`}>
      <div
        className={`rounded-lg ${color} flex items-center justify-center ${
          compact ? 'w-8 h-8' : 'w-12 h-12'
        }`}
      >
        {icon}
      </div>
      <p className={`text-slate-500 dark:text-slate-400 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
        {label}
      </p>
    </div>
    <motion.h3
      className={`font-bold text-slate-800 dark:text-slate-100 ${compact ? 'text-lg' : 'text-2xl'}`}
      key={value}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {value}
    </motion.h3>
    <p className={`text-slate-400 dark:text-slate-500 mt-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {subtext}
    </p>
  </motion.div>
);
