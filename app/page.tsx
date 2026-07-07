import Diary from "./components/Diary";

export default function Home() {
  return (
    <main className="flex-1 w-full min-h-screen desk-bg flex flex-col items-center justify-between py-12 px-4 relative select-none">
      
      {/* Moving Candlelight Glow Overlay */}
      <div className="candlelight-overlay"></div>

      {/* Floating Dust Particle Ambient Layer (WebGL or CSS) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute top-[20%] left-[10%] w-1.5 h-1.5 bg-amber-300/10 rounded-full blur-[1px] animate-pulse"></div>
        <div className="absolute top-[60%] left-[25%] w-2 h-2 bg-amber-400/5 rounded-full blur-[1px] animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-[30%] right-[15%] w-1 h-1 bg-amber-200/10 rounded-full blur-[0.5px] animate-pulse" style={{ animationDelay: "4s" }}></div>
        <div className="absolute bottom-[20%] right-[30%] w-2 h-2 bg-amber-300/5 rounded-full blur-[1.5px] animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Header Info */}
      <header className="text-center z-20 select-none pointer-events-none mt-4">
        <h2 className="text-amber-500/35 font-cinzel text-xs tracking-[0.6em] uppercase">
          Magical Artifact Simulation
        </h2>
        <h1 className="text-amber-100 font-cinzel text-3xl md:text-4xl tracking-[0.3em] font-bold mt-2 text-center select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
          TOM RIDDLE&apos;S DIARY
        </h1>
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto mt-3"></div>
      </header>

      {/* Main Diary Scene */}
      <section className="w-full flex justify-center items-center my-6 z-20">
        <Diary />
      </section>

      {/* Footer & Candles Details */}
      <footer className="text-center z-20 flex flex-col items-center gap-4">
        
        {/* Pure CSS Flickering Candle in the Corner */}
        <div className="fixed bottom-8 left-8 hidden lg:flex flex-col items-center justify-end h-28 pointer-events-none z-10">
          {/* Candle Flame */}
          <div className="relative w-3.5 h-6 rounded-t-full bg-gradient-to-b from-amber-200 via-orange-500 to-red-600 blur-[0.5px] animate-[flicker_1s_infinite_alternate_ease-in-out] shadow-[0_0_15px_rgba(249,115,22,0.6)]">
            <div className="absolute bottom-0 left-1 w-1.5 h-1.5 bg-blue-600 rounded-full filter blur-[0.2px]"></div>
          </div>
          {/* Wick */}
          <div className="w-[1.5px] h-2 bg-zinc-800"></div>
          {/* Wax Candle Body */}
          <div className="w-5 h-16 bg-gradient-to-r from-amber-100 to-amber-200/90 rounded-t-sm shadow-md border-r border-amber-300/30 flex flex-col items-center">
            {/* Melting wax drips */}
            <div className="w-2 h-4 bg-amber-100/90 rounded-b-full ml-[-8px]"></div>
          </div>
          {/* Brass Holder */}
          <div className="w-10 h-1.5 bg-yellow-700/80 rounded-full shadow border-t border-yellow-600/30"></div>
        </div>

        <div className="max-w-md bg-zinc-900/60 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-amber-900/20 text-center">
          <p className="text-[11px] font-sans text-amber-100/50 leading-relaxed">
            <strong className="text-amber-500/80 font-cinzel tracking-wider uppercase block mb-1">How to Speak to the Memory</strong>
            Pour your heart into the pages by typing your words or drawing with your stylus/finger. Click &apos;Pour Heart&apos; or &apos;Pour Ink&apos; to let the parchment absorb your thoughts. Riddle will answer.
          </p>
        </div>

        <p className="text-[9px] font-cinzel text-amber-800/40 tracking-[0.2em] uppercase select-none mt-2">
          &copy; 1943 T.M. RIDDLE. PRESERVED IN INK FOR FIFTY YEARS.
        </p>
      </footer>
    </main>
  );
}

