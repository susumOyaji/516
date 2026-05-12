import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';

export const StockCard = ({ 
  data, 
  onRemove, 
  onRefresh, 
  loading,
  variant = 'list'
}) => {
  const isPositive = parseFloat(data.change.toString()) >= 0;
  const currencySymbol = data.currency === 'JPY' ? '¥' : (data.currency === 'USD' ? '$' : (data.isJp ? '¥' : '$'));

  if (variant === 'hero') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative group flex flex-col gap-1 p-2"
        id={`stock-hero-${data.symbol}`}
      >
        <div className="flex justify-between items-end">
          <h2 className="text-5xl font-light tracking-tighter text-white">
            {data.symbol}{data.isJp ? '.T' : ''}
          </h2>
          <div className={`px-3 py-1 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'} text-black text-[11px] font-bold rounded-full mb-1 italic flex items-center gap-1`}>
            {isPositive ? '+' : ''}{data.change}
            {data.changePercent !== undefined && (
               <span className="text-[9px] opacity-80 font-medium ml-1">({data.changePercent.toFixed(2)}%)</span>
            )}
            <div className="flex gap-1 ml-2 opacity-60">
              <button onClick={onRefresh} className="hover:scale-110 active:scale-95 transition-transform">
                <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
              </button>
              <button onClick={onRemove} className="hover:scale-110 active:scale-95 transition-transform">
                <X size={10} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-widest text-white/40 truncate max-w-[200px]">
            {data.name || 'Market Asset'}
          </span>
          <span className="text-2xl font-mono text-white/90">
            {currencySymbol}{typeof data.price === 'number' ? data.price.toLocaleString() : data.price}
          </span>
        </div>
        
        {/* Decorative Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4 mb-2" />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
      id={`stock-list-${data.symbol}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'} ${loading ? 'animate-pulse' : ''}`} />
        <div>
          <p className="text-xs font-bold tracking-tight text-white/90">
            {data.symbol}{data.isJp ? '.T' : ''}
          </p>
          <p className="text-[10px] text-white/40 uppercase tracking-tighter truncate max-w-[120px]">
            {data.name || 'Asset'}
          </p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm text-white/80">
            {currencySymbol}{typeof data.price === 'number' ? data.price.toLocaleString() : data.price}
          </p>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={onRefresh} className="text-white/20 hover:text-white"><RefreshCw size={10} /></button>
             <button onClick={onRemove} className="text-white/20 hover:text-rose-400"><X size={10} /></button>
          </div>
        </div>
        <p className={`text-[10px] font-medium italic ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? '+' : ''}{data.change}
          {data.changePercent !== undefined && (
             <span className="ml-1 opacity-70">({data.changePercent.toFixed(2)}%)</span>
          )}
        </p>
      </div>
    </motion.div>
  );
};
