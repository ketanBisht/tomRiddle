"use client";

import React, { useState, useEffect, useRef } from "react";
import { getRiddleResponse, RiddleState } from "../utils/riddleEngine";
import { audio } from "../utils/AudioEngine";

export default function Diary() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [inputMode, setInputMode] = useState<"type" | "draw">("type");
  const [isMuted, setIsMuted] = useState(true);
  
  // Diary Game State
  const [riddleState, setRiddleState] = useState<RiddleState>({
    userName: "",
    trustScore: 10,
    conversationCount: 0,
    stage: "intro",
    lastInputWasDrawing: false,
  });

  // Typing Inputs
  const [userText, setUserText] = useState("");
  const [fadingText, setFadingText] = useState("");
  const [isTextFading, setIsTextFading] = useState(false);

  // Drawing Canvas Inputs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isCanvasFading, setIsCanvasFading] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Riddle Reply Outputs
  const [riddleText, setRiddleText] = useState("");
  const [riddleEmotion, setRiddleEmotion] = useState<"neutral" | "pleased" | "annoyed" | "hostile">("neutral");
  const [isRiddleWriting, setIsRiddleWriting] = useState(false);
  const [flashGreen, setFlashGreen] = useState(false);
  
  // Ref to scroll container for automatic scrolling of dialogue history
  const historyEndRef = useRef<HTMLDivElement | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ sender: "user" | "riddle"; text: string; isDrawing?: boolean }>>([]);

  // Initialize audio and ambient sound on open
  const handleOpenDiary = () => {
    setIsOpening(true);
    audio.playPageFlip();
    
    setTimeout(() => {
      setIsOpen(true);
      setIsOpening(false);
      // Start background hum (if not muted)
      if (!isMuted) {
        audio.startAmbient();
      }
    }, 1200);
  };

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    if (!muted && isOpen) {
      audio.startAmbient();
    }
  };

  // Reset Riddle Memory and Start Over
  const handleReset = () => {
    audio.playPageFlip();
    setIsOpen(false);
    setDialogueHistory([]);
    setRiddleText("");
    setUserText("");
    setFadingText("");
    setHasDrawn(false);
    setRiddleState({
      userName: "",
      trustScore: 10,
      conversationCount: 0,
      stage: "intro",
      lastInputWasDrawing: false,
    });
    setRiddleEmotion("neutral");
    
    // Clear canvas if active
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Resize canvas for drawing
  useEffect(() => {
    if (isOpen && inputMode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.strokeStyle = riddleEmotion === "hostile" ? "#580c0c" : "#16161a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctxRef.current = ctx;
      }
    }
  }, [isOpen, inputMode, riddleEmotion]);

  // Pointer drawing event handlers
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isRiddleWriting || isCanvasFading) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
    }
    setIsDrawing(true);
    setHasDrawn(true);
    lastPosRef.current = { x, y };
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || isRiddleWriting || isCanvasFading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();

    // Sound effect: draw scratch
    const lastPos = lastPosRef.current;
    const dist = Math.hypot(x - lastPos.x, y - lastPos.y);
    if (dist > 6) {
      audio.playScratch(75, true);
      lastPosRef.current = { x, y };
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Keyboard Pen Scratch Sound
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" && e.key !== "Backspace" && e.key !== "Shift") {
      audio.playScratch(60, true);
    }
  };

  // Process User typed message
  const handlePourHeartText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim() || isRiddleWriting || isTextFading) return;

    setDialogueHistory((prev) => [...prev, { sender: "user", text: userText }]);
    setFadingText(userText);
    setUserText("");
    setIsTextFading(true);
    setRiddleText(""); // Clear old riddle text

    // Play absorbing sound
    audio.playScratch(800, false);

    // Trigger Riddle Response after bleed animation finishes
    setTimeout(() => {
      setIsTextFading(false);
      setFadingText("");
      triggerRiddleReply(userText);
    }, 2200);
  };

  // Process User drawing/handwriting
  const handlePourHeartDrawing = () => {
    if (!hasDrawn || isRiddleWriting || isCanvasFading) return;

    setDialogueHistory((prev) => [...prev, { sender: "user", text: "[Handwritten Drawing]", isDrawing: true }]);
    setIsCanvasFading(true);
    setRiddleText(""); // Clear old riddle text

    // Play absorbing scratch sweep
    audio.playWhisper();

    setTimeout(() => {
      setIsCanvasFading(false);
      setHasDrawn(false);
      // Clear drawing canvas content
      if (canvasRef.current && ctxRef.current) {
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      triggerRiddleReply("[drawing]");
    }, 2200);
  };

  // Trigger Riddle response logic
  const triggerRiddleReply = (inputText: string) => {
    setIsRiddleWriting(true);
    
    // Get simulated response from engine
    const { response, nextState } = getRiddleResponse(inputText, riddleState);
    setRiddleState(nextState);
    setRiddleEmotion(response.emotion);

    // Audio effects for emotion transitions
    if (response.emotion === "hostile") {
      setFlashGreen(true);
      audio.playHeartbeat();
      audio.playWhisper();
      setTimeout(() => setFlashGreen(false), 500);
    } else if (response.emotion === "pleased") {
      audio.playWhisper();
    } else {
      audio.playHeartbeat();
    }

    // Typewriter handwritten response logic
    let charIndex = 0;
    const textToType = response.text;
    setRiddleText("");

    const typingInterval = setInterval(() => {
      if (charIndex < textToType.length) {
        const nextChar = textToType.charAt(charIndex);
        setRiddleText((prev) => prev + nextChar);

        // Sound effect: scribble letter
        if (nextChar !== " " && nextChar !== ".") {
          audio.playScratch(65, response.emotion === "pleased");
        }

        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsRiddleWriting(false);
        setDialogueHistory((prev) => [...prev, { sender: "riddle", text: textToType }]);
      }
    }, 55 + Math.random() * 35); // Human-like variable typing speed
  };

  // Automatic scrolling to bottom of conversations
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogueHistory, riddleText]);

  // Clean up ambient audio on unmount
  useEffect(() => {
    return () => {
      audio.stopAmbient();
    };
  }, []);

  return (
    <div className={`relative w-full max-w-5xl h-[620px] flex items-center justify-center book-container ${flashGreen ? "avada-flash" : ""}`}>
      
      {/* 1. Mute & Reset Header Controls */}
      <div className="absolute top-[-50px] right-4 flex items-center gap-3 z-40 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-amber-900/30 text-xs tracking-wider text-amber-100 font-cinzel">
        <button 
          onClick={handleToggleMute} 
          className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          title={isMuted ? "Unmute Ambient Theme" : "Mute Sound"}
        >
          {isMuted ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              <span>Muted</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              <span className="text-amber-400">Ambient Active</span>
            </>
          )}
        </button>
        <span className="text-amber-900/50">|</span>
        <button 
          onClick={handleReset} 
          className="hover:text-amber-400 transition-colors cursor-pointer"
          title="Clear all pages and start over"
        >
          Reset Diary
        </button>
      </div>

      {/* 2. Interactive Book Wrapper */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Closed Cover State */}
        {!isOpen && (
          <div 
            onClick={!isOpening ? handleOpenDiary : undefined}
            className={`absolute w-[440px] h-[580px] leather-cover rounded-r-2xl rounded-l-md flex flex-col items-center justify-between py-16 px-8 cursor-pointer select-none transition-all duration-1000 ${
              isOpening ? "book-cover-left shadow-2xl" : "hover:translate-y-[-5px] hover:shadow-[0_20px_45px_rgba(0,0,0,0.8)]"
            }`}
            style={{
              transform: isOpening ? "rotateY(-140deg)" : "rotateY(0deg)",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Ornate Gold Trim Corners */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-500/50 rounded-tl-sm"></div>
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-500/50 rounded-tr-sm"></div>
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-500/50 rounded-bl-sm"></div>
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-500/50 rounded-br-sm"></div>

            <div className="flex flex-col items-center gap-1 mt-4">
              <span className="text-xs text-amber-600/60 uppercase tracking-[0.3em] font-cinzel">Preserved Ink</span>
              <span className="text-[10px] text-amber-700/40 uppercase tracking-[0.2em] font-cinzel">Circa 1943</span>
            </div>

            <div className="flex flex-col items-center">
              {/* Vertical Gold Foil Text */}
              <h1 className="text-4xl text-amber-500 font-cinzel font-bold tracking-[0.4em] select-none text-center select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                T. M. RIDDLE
              </h1>
              <div className="w-16 h-[1px] bg-amber-500/30 my-4"></div>
              <p className="text-[10px] font-cinzel text-amber-600/70 tracking-[0.2em] uppercase">Diary</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-amber-500/60 animate-pulse font-cinzel tracking-wider">Click to open...</span>
              {isOpening && <span className="text-[10px] text-amber-600/40 italic">opening the seal...</span>}
            </div>
          </div>
        )}

        {/* Open Book State */}
        {isOpen && (
          <div className="w-full h-full flex rounded-lg shadow-2xl overflow-hidden scale-100 opacity-100 transition-all duration-700">
            
            {/* Left Page (Lore, History, Atmosphere) */}
            <div className="w-1/2 h-full parchment parchment-page-left flex flex-col justify-between p-12 select-none relative">
              {/* Candle Shadow overlays */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/10 via-transparent to-transparent pointer-events-none"></div>
              
              <div className="flex flex-col gap-6 mt-4">
                <h3 className="font-cinzel text-amber-950/80 text-xl tracking-[0.2em] font-bold border-b border-amber-900/20 pb-2">
                  T. M. RIDDLE
                </h3>
                
                {/* Scrollable Dialouge Log */}
                <div className="flex-1 max-h-[360px] overflow-y-auto pr-2 space-y-4 text-amber-950/80 font-parchment text-base leading-relaxed scrollbar-thin scrollbar-thumb-amber-950/20">
                  {dialogueHistory.length === 0 ? (
                    <div className="italic text-amber-900/50 mt-12 text-center text-sm">
                      &ldquo;I do not mind sharing my diary. Some secrets are too heavy to keep alone...&rdquo;
                    </div>
                  ) : (
                    dialogueHistory.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col gap-1 pb-2 border-b border-amber-900/5 ${
                          item.sender === "user" ? "items-end text-right" : "items-start text-left"
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider text-amber-800/40">
                          {item.sender === "user" ? "You" : "Tom Riddle"}
                        </span>
                        <span 
                          className={`${
                            item.sender === "user" 
                              ? "font-sans text-amber-950/70 text-sm" 
                              : "font-riddle text-amber-950 text-xl font-medium tracking-wide"
                          }`}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[10px] text-amber-800/50 font-cinzel tracking-widest flex justify-between">
                <span>LONDON, 1943</span>
                <span>PAGE LVII</span>
              </div>
            </div>

            {/* Central Bind/Spine shadow */}
            <div className="w-6 h-full spine-shadow absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 z-20 pointer-events-none"></div>

            {/* Right Page (Main Interactive Drawing & Writing Area) */}
            <div className="w-1/2 h-full parchment parchment-page-right flex flex-col justify-between p-12 relative">
              
              {/* Top Bar controls */}
              <div className="flex justify-between items-center z-30">
                {/* Input mode switcher */}
                <div className="flex gap-2 bg-amber-900/10 p-0.5 rounded-lg border border-amber-950/10 font-cinzel text-[10px] tracking-wider font-semibold">
                  <button 
                    onClick={() => { setInputMode("type"); setHasDrawn(false); }}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      inputMode === "type" 
                        ? "bg-[#e5d4ba] text-amber-950 shadow-sm" 
                        : "text-amber-800/60 hover:text-amber-950"
                    }`}
                  >
                    Quill (Type)
                  </button>
                  <button 
                    onClick={() => { setInputMode("draw"); setUserText(""); }}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      inputMode === "draw" 
                        ? "bg-[#e5d4ba] text-amber-950 shadow-sm" 
                        : "text-amber-800/60 hover:text-amber-950"
                    }`}
                  >
                    Inkwell (Draw)
                  </button>
                </div>

                {/* Status message */}
                <span className="text-[10px] uppercase font-cinzel tracking-widest text-amber-800/50 animate-pulse">
                  {isRiddleWriting ? "Tom is writing..." : isTextFading || isCanvasFading ? "Ink absorbing..." : "Awaiting Ink"}
                </span>
              </div>

              {/* Central Writing / Drawing Canvas Container */}
              <div className="relative flex-1 my-6 rounded border border-dashed border-amber-950/5 flex flex-col justify-center items-center overflow-hidden">
                
                {/* Quill (Type) Input Mode */}
                {inputMode === "type" && (
                  <div className="w-full h-full flex flex-col justify-between relative">
                    
                    {/* Floating Fading ink layer */}
                    {isTextFading && (
                      <div className="absolute inset-0 flex items-center justify-center p-6 text-center select-none pointer-events-none z-10">
                        <p className={`font-sans text-xl font-medium tracking-wide text-zinc-900 ink-bleed-fade`}>
                          {fadingText}
                        </p>
                      </div>
                    )}

                    {/* Tom Riddle's Handwriting Output (while actively writing) */}
                    {riddleText && (
                      <div className="absolute inset-0 flex items-center justify-center p-6 text-center select-none pointer-events-none z-15">
                        <p 
                          className="font-riddle text-3xl tracking-wide select-none leading-relaxed"
                          style={{
                            color: riddleEmotion === "hostile" ? "var(--color-ink-red)" : 
                                   riddleEmotion === "pleased" ? "var(--color-ink-green)" : 
                                   "var(--color-ink)"
                          }}
                        >
                          {riddleText}
                        </p>
                      </div>
                    )}

                    {/* Main input area */}
                    {!isTextFading && !riddleText && (
                      <form onSubmit={handlePourHeartText} className="w-full h-full flex flex-col justify-between p-4">
                        <textarea
                          value={userText}
                          onChange={(e) => setUserText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Write your secrets here. Press Enter or click 'Pour Heart'..."
                          disabled={isRiddleWriting}
                          className="w-full flex-1 bg-transparent text-amber-950 placeholder-amber-900/35 border-none resize-none focus:outline-none focus:ring-0 font-sans text-base leading-relaxed text-center quill-cursor"
                        />
                        <div className="flex justify-center mt-2">
                          <button
                            type="submit"
                            disabled={!userText.trim() || isRiddleWriting}
                            className="bg-amber-950 text-[#f2e6d0] hover:bg-amber-900 px-6 py-2 rounded-full font-cinzel text-xs font-bold tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 cursor-pointer"
                          >
                            Pour Heart
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Inkwell (Draw/Stylus) Input Mode */}
                {inputMode === "draw" && (
                  <div className="w-full h-full flex flex-col justify-between relative no-scroll-touch">
                    
                    {/* Tom Riddle's Handwriting Output (while active) */}
                    {riddleText && (
                      <div className="absolute inset-0 flex items-center justify-center p-6 text-center select-none pointer-events-none z-20">
                        <p 
                          className="font-riddle text-3xl tracking-wide leading-relaxed"
                          style={{
                            color: riddleEmotion === "hostile" ? "var(--color-ink-red)" : 
                                   riddleEmotion === "pleased" ? "var(--color-ink-green)" : 
                                   "var(--color-ink)"
                          }}
                        >
                          {riddleText}
                        </p>
                      </div>
                    )}

                    {/* Canvas drawing container */}
                    <canvas
                      ref={canvasRef}
                      onPointerDown={startDrawing}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      onPointerLeave={stopDrawing}
                      className={`w-full h-full bg-transparent ink-draw-cursor z-10 ${
                        isCanvasFading ? "ink-bleed-fade" : ""
                      } ${riddleText ? "hidden" : "block"}`}
                    />

                    {/* Instructions / Drawing controls */}
                    {!riddleText && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-30">
                        <button
                          onClick={handlePourHeartDrawing}
                          disabled={!hasDrawn || isRiddleWriting || isCanvasFading}
                          className="bg-amber-950 text-[#f2e6d0] hover:bg-amber-900 px-6 py-2 rounded-full font-cinzel text-xs font-bold tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 cursor-pointer"
                        >
                          Pour Ink
                        </button>
                        <button
                          onClick={() => {
                            if (canvasRef.current && ctxRef.current) {
                              ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                              setHasDrawn(false);
                            }
                          }}
                          disabled={!hasDrawn || isRiddleWriting || isCanvasFading}
                          className="border border-amber-950/20 text-amber-950 hover:bg-amber-950/5 px-4 py-2 rounded-full font-cinzel text-[10px] font-bold tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    
                    {!hasDrawn && !riddleText && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-center p-6">
                        <p className="font-cinzel text-xs text-amber-900/35 tracking-widest">
                          Use finger, pen, or mouse to write or draw.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Bottom page indicators */}
              <div className="text-[10px] text-amber-800/50 font-cinzel tracking-widest flex justify-between select-none">
                <span>PAGE LVIII</span>
                <span>PROPERTY OF T. M. RIDDLE</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
