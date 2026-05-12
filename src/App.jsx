/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import FloatingWidget from './components/FloatingWidget';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex items-center justify-center font-sans">
      {/* Desktop Background Simulation */}
      <div className="absolute inset-0 opacity-20 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 text-center space-y-6 max-w-2xl px-6 relative">
        <div className="space-y-2">
          <h1 className="text-6xl font-light tracking-tighter text-white/90">
            Market.<span className="text-white/40">Observer</span>
          </h1>
          <div className="w-24 h-[1px] bg-white/20 mx-auto" />
        </div>
        
        <p className="text-lg text-white/40 font-medium tracking-wide">
          High-fidelity desktop ticker system. <br />
          Optimized for Yahoo Finance & Yahoo Japan.
        </p>

        <div className="mt-12 p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl inline-block">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">
            Electron Widget System v.1.04
          </p>
        </div>
      </div>

      {/* The Floating Widget */}
      <FloatingWidget />

      {/* UI Decorative Elements */}
      <div className="absolute bottom-12 right-12 flex flex-col items-end gap-2 pointer-events-none select-none">
        <div className="text-[60px] font-black leading-none opacity-5 tracking-tighter uppercase">Quotes</div>
        <div className="w-32 h-[1px] bg-white/10" />
      </div>
    </div>
  );
}
