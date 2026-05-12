import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Settings, ExternalLink, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import { StockCard } from './StockCard';

interface StockData {
  symbol: string;
  name?: string;
  price: string | number;
  change: string | number;
  changePercent?: number;
  isJp: boolean;
}

export default function FloatingWidget() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [inputSymbol, setInputSymbol] = useState("");
  const [isJpSearch, setIsJpSearch] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ticker-stocks');
    if (saved && saved !== '[]') {
      try {
        const parsed = JSON.parse(saved);
        setStocks(parsed);
        parsed.forEach((s: StockData) => refreshStock(s.symbol, s.isJp));
      } catch (e) {
        console.error("Failed to load stocks", e);
        loadDefaults();
      }
    } else {
        loadDefaults();
    }

    const interval = setInterval(() => {
      setStocks(prev => {
        prev.forEach(s => refreshStock(s.symbol, s.isJp));
        return prev;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDefaults = async () => {
    await addStock("7203", true); // Toyota
    await addStock("AAPL", false); // Apple
    await addStock("^DJI", false); // Dow Jones
  };

  useEffect(() => {
    if (stocks.length > 0) {
      localStorage.setItem('ticker-stocks', JSON.stringify(stocks));
    }
  }, [stocks]);

  const fetchStock = async (symbol: string, isJp: boolean) => {
    const endpoint = isJp ? `/api/stocks/yahoo-jp/${encodeURIComponent(symbol)}` : `/api/stocks/yahoo-finance/${encodeURIComponent(symbol)}`;
    const response = await axios.get(endpoint);
    return { ...response.data, isJp };
  };

  const addStock = async (symbol: string, isJp: boolean) => {
    if (!symbol) return;
    const cleanSymbol = symbol.trim().toUpperCase();
    
    // Prevent duplicates using functional update state to ensure we have latest
    let isDuplicate = false;
    setStocks(prev => {
      if (prev.find(s => s.symbol === cleanSymbol && s.isJp === isJp)) {
        isDuplicate = true;
      }
      return prev;
    });
    
    if (isDuplicate) return;

    setLoading(prev => ({ ...prev, [cleanSymbol]: true }));
    setError(null);
    try {
      const data = await fetchStock(cleanSymbol, isJp);
      setStocks(prev => {
        if (prev.find(s => s.symbol === cleanSymbol && s.isJp === isJp)) return prev;
        return [data, ...prev];
      });
      setInputSymbol("");
    } catch (e) {
      setError(`Failed to add ${cleanSymbol}.`);
    } finally {
      setLoading(prev => ({ ...prev, [cleanSymbol]: false }));
    }
  };

  const refreshStock = async (symbol: string, isJp: boolean) => {
    setLoading(prev => ({ ...prev, [symbol]: true }));
    try {
      const data = await fetchStock(symbol, isJp);
      setStocks(prev => prev.map(s => s.symbol === symbol && s.isJp === isJp ? data : s));
    } catch (e) {
      console.error(`Failed to refresh ${symbol}`, e);
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  const removeStock = (symbol: string, isJp: boolean) => {
    setStocks(prev => prev.filter(s => !(s.symbol === symbol && s.isJp === isJp)));
  };

  return (
    <div className="fixed top-8 right-8 w-[480px] z-50 pointer-events-none" id="floating-widget-root">
      <motion.div 
        drag
        dragMomentum={false}
        className="pointer-events-auto bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Window Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex gap-1.5 focus-within:opacity-100 transition-opacity">
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/40">Market.Observer // Tokyo</span>
          <div className="flex items-center gap-3">
             <button id="toggle-jp" onClick={() => setIsJpSearch(!isJpSearch)} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${isJpSearch ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white/20'}`}>
                {isJpSearch ? 'JPN' : 'GLO'}
             </button>
             <Settings size={12} className="text-white/20 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Input & Controls */}
        <div className="px-8 pt-6 pb-2 space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={14} />
            <input
              id="stock-input"
              type="text"
              placeholder={isJpSearch ? "Enter Code... (7203)" : "Enter Symbol... (AAPL)"}
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStock(inputSymbol, isJpSearch)}
            />
          </div>
          {error && <p className="text-[10px] text-rose-500 font-medium tracking-tight uppercase">{error}</p>}
        </div>

        {/* Stock Display Section */}
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {stocks.length > 0 && (
              <div className="flex flex-col gap-8">
                {/* Hero Stock */}
                <StockCard
                  key={`${stocks[0].symbol}-${stocks[0].isJp}`}
                  data={stocks[0]}
                  variant="hero"
                  onRemove={() => removeStock(stocks[0].symbol, stocks[0].isJp)}
                  onRefresh={() => refreshStock(stocks[0].symbol, stocks[0].isJp)}
                  loading={loading[stocks[0].symbol]}
                />

                {/* Sub Tickers List */}
                {stocks.length > 1 && (
                  <div className="grid grid-cols-1 gap-6 pb-4">
                    {stocks.slice(1).map((stock) => (
                      <StockCard
                        key={`${stock.symbol}-${stock.isJp}`}
                        data={stock}
                        variant="list"
                        onRemove={() => removeStock(stock.symbol, stock.isJp)}
                        onRefresh={() => refreshStock(stock.symbol, stock.isJp)}
                        loading={loading[stock.symbol]}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
          
          {stocks.length === 0 && (
            <div className="text-center py-12 opacity-20">
              <p className="text-xs uppercase tracking-[0.2em]">Awaiting Data Feed</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto p-6 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] uppercase tracking-tighter text-white/30 font-bold">Live Stream • Yahoo! Finance</span>
          </div>
          <div className="text-[9px] text-white/20 font-mono">
            UPDATED: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
