"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Diary from "./components/Diary";

export default function DiaryScene() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="flex-1 w-full min-h-screen desk-bg flex flex-col items-center justify-between py-6 sm:py-12 px-4 relative select-none overflow-hidden">

      {/* Candlelight Glow */}
      <div className="candlelight-overlay" />

      {/* Floating Dust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute top-[20%] left-[10%] w-1.5 h-1.5 bg-amber-300/10 rounded-full blur-[1px] animate-pulse" />
        <div className="absolute top-[60%] left-[25%] w-2 h-2 bg-amber-400/5 rounded-full blur-[1px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[30%] right-[15%] w-1 h-1 bg-amber-200/10 rounded-full blur-[0.5px] animate-pulse" style={{ animationDelay: "4s" }} />
        <div className="absolute bottom-[20%] right-[30%] w-2 h-2 bg-amber-300/5 rounded-full blur-[1.5px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header — hides when book is open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.header
            key="header"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
            transition={{ duration: 0.5 }}
            className="text-center z-20 select-none pointer-events-none mt-4"
          >
            <h2 className="text-amber-500/35 font-cinzel text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.6em] uppercase">
              Magical Artifact Simulation
            </h2>
            <h1 className="text-amber-100 font-cinzel text-2xl sm:text-3xl md:text-4xl tracking-[0.15em] sm:tracking-[0.3em] font-bold mt-2 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
              TOM RIDDLE&apos;S DIARY
            </h1>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto mt-3" />
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Diary Scene — expands to fill screen when open */}
      <motion.section
        animate={isOpen ? { flex: 1, width: "100%", marginTop: 0, marginBottom: 0 } : { flex: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="w-full flex justify-center items-center z-20"
      >
        <Diary onOpenChange={setIsOpen} />
      </motion.section>

      {/* Footer — hides when book is open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.footer
            key="footer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.25 } }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="absolute bottom-8 w-full text-center z-20 pointer-events-none"
          >
            <p className="text-[9px] font-cinzel text-amber-800/40 tracking-[0.25em] uppercase select-none">
              &copy; 1943 T.M. RIDDLE. PRESERVED IN INK FOR FIFTY YEARS.
            </p>
          </motion.footer>
        )}
      </AnimatePresence>
    </main>
  );
}
