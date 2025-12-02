import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, color, onClick }) => (
  <motion.div
    className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    whileHover={{ scale: 1.05, y: -5 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <motion.div
      className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}
      whileHover={{ rotate: 360 }}
      transition={{ duration: 0.6 }}
    >
      {icon}
    </motion.div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <motion.h3
      className="text-2xl font-bold text-slate-800 mt-1"
      key={value}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {value}
    </motion.h3>
    <p className="text-xs text-slate-400 mt-1">{subtext}</p>
  </motion.div>
);
