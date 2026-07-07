"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  useSpring,
  type Variants,
} from "framer-motion";
import { RiddleState } from "../utils/riddleEngine";
import { audio } from "../utils/AudioEngine";

// ─────────────────────────────────────────────────────────────────────────────
// InkMote — floating ambient particle
// ─────────────────────────────────────────────────────────────────────────────
interface MoteConfig {
  xPct: number;
  delay: number;
  yTarget: number;
  xTarget: number;
  duration: number;
  repeatDelay: number;
}

function InkMote({ config }: { config: MoteConfig }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-amber-300/20 blur-[1px] pointer-events-none"
      style={{ left: `${config.xPct}%`, bottom: "-4px" }}
      animate={{
        y: [0, config.yTarget],
        x: [0, config.xTarget],
        opacity: [0, 0.55, 0],
        scale: [0.4, 1.1, 0.2]
      }}
      transition={{
        duration: config.duration,
        delay: config.delay,
        repeat: Infinity,
        repeatDelay: config.repeatDelay,
        ease: "easeOut"
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BurnScar — animated basilisk venom damage
// ─────────────────────────────────────────────────────────────────────────────
function BurnScar() {
  return (
    <motion.div className="relative flex items-center justify-center"
      animate={{ filter: ["brightness(1)", "brightness(1.18)", "brightness(0.95)", "brightness(1)"] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div className="absolute w-44 h-44 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(180,100,10,0.14) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.09, 1], opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg viewBox="0 0 180 180" className="w-44 h-44 opacity-90" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="burnHole" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#050402" stopOpacity="1"/>
            <stop offset="40%" stopColor="#0a0806" stopOpacity="1"/>
            <stop offset="80%" stopColor="#1a1208" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#2a1a0a" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="scorchGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3a2a10" stopOpacity="0"/>
            <stop offset="60%" stopColor="#5a3810" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#8a5820" stopOpacity="0.7"/>
          </radialGradient>
        </defs>
        <circle cx="90" cy="90" r="80" fill="url(#scorchGlow)"/>
        <g fill="#2a1a08" opacity="0.9">
          {[0,22,45,68,90,112,135,158,180,202,225,248,270,292,315,338].map((deg, i) => (
            <ellipse key={i} cx="90" cy="30" rx={i % 3 === 0 ? 6 : i % 2 === 0 ? 5 : 4} ry={15 + (i % 4) * 3} transform={`rotate(${deg} 90 90)`} />
          ))}
        </g>
        <g fill="#6a4010" opacity="0.75">
          {[15,52,90,128,165,200,240,280,315].map((deg, i) => (
            <ellipse key={i} cx="90" cy="46" rx={i % 2 === 0 ? 5 : 4} ry={i % 2 === 0 ? 14 : 12} transform={`rotate(${deg} 90 90)`} />
          ))}
        </g>
        <circle cx="90" cy="90" r="34" fill="url(#burnHole)"/>
        <circle cx="90" cy="90" r="22" fill="#030302" opacity="1"/>
      </svg>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BrassCorner — SVG hardware piece at each corner
// ─────────────────────────────────────────────────────────────────────────────
function BrassCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const cls = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" }[position];
  const polys = { tl: "0,0 48,0 0,48", tr: "48,0 0,0 48,48", bl: "0,48 0,0 48,48", br: "48,48 48,0 0,48" };
  const hRect = { tl: [0, 0], tr: [0, 0], bl: [0, 41], br: [0, 41] }[position];
  const vRect = { tl: [0, 0], tr: [41, 0], bl: [0, 0], br: [41, 0] }[position];
  const id = `bc_${position}`;
  return (
    <svg className={`absolute w-12 h-12 z-10 ${cls}`} viewBox="0 0 48 48" fill="none">
      <polygon points={polys[position]} fill={`url(#${id}g)`} />
      <rect x={hRect[0]} y={hRect[1]} width="48" height="7" fill={`url(#${id}h)`} rx="1"/>
      <rect x={vRect[0]} y={vRect[1]} width="7" height="48" fill={`url(#${id}v)`} rx="1"/>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#e8c460"/><stop offset="50%" stopColor="#a87820"/><stop offset="100%" stopColor="#6a4c10"/></linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="48" y2="0"><stop offset="0%" stopColor="#e8c460"/><stop offset="100%" stopColor="#7a5820"/></linearGradient>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="48"><stop offset="0%" stopColor="#d4aa40"/><stop offset="100%" stopColor="#6a4010"/></linearGradient>
      </defs>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InkThinkingAnimation — shown while waiting for API
// ─────────────────────────────────────────────────────────────────────────────
function InkThinkingAnimation() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Swirling ink circle */}
      <div className="relative w-20 h-20">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-[1.5px] border-amber-950/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ borderTopColor: "rgba(26,16,10,0.7)", borderRightColor: "rgba(26,16,10,0.15)" }}
        />
        {/* Middle ring — counter spin */}
        <motion.div
          className="absolute inset-[8px] rounded-full border-[1.5px]"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          style={{ borderTopColor: "rgba(26,16,10,0.5)", borderLeftColor: "rgba(26,16,10,0.12)", borderBottomColor: "transparent", borderRightColor: "transparent" }}
        />
        {/* Inner ink drop — pulsing */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-5 h-5 rounded-full bg-amber-950/60"
            animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        {/* Orbiting ink dots */}
        {[0, 120, 240].map((deg, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-950/50"
            style={{ top: "50%", left: "50%", transformOrigin: "0 0" }}
            animate={{ rotate: [deg, deg + 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.1 }}
          >
            <div className="w-full h-full rounded-full" style={{ transform: `translateX(26px) translateY(-50%)` }} />
          </motion.div>
        ))}
      </div>

      {/* Rippling ink text */}
      <div className="flex items-center gap-[3px]">
        {"Tom is writing".split("").map((char, i) => (
          <motion.span
            key={i}
            className="font-riddle text-amber-950/55 text-lg"
            animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.06, ease: "easeInOut" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
        {[0, 0.2, 0.4].map((d, i) => (
          <motion.span key={i} className="font-riddle text-amber-950/55 text-lg ml-0.5"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: d, ease: "easeInOut" }}
          >.</motion.span>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DialogueRow — animated entry in the history log
// ─────────────────────────────────────────────────────────────────────────────
function DialogueRow({ item }: { item: { sender: "user" | "riddle"; text: string; isDrawing?: boolean } }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: item.sender === "user" ? 16 : -16, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`flex flex-col gap-0.5 ${item.sender === "user" ? "items-end text-right" : "items-start text-left"}`}
    >
      <span className="text-[8px] uppercase tracking-[0.2em] text-amber-950/50 font-cinzel">
        {item.sender === "user" ? "You" : "Tom Riddle"}
      </span>
      <span className={item.sender === "user" ? "font-sans text-amber-950/85 text-[13px] font-medium" : "font-riddle text-amber-950 text-[21px] tracking-wide font-medium"}>
        {item.text}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Diary — main component
// ─────────────────────────────────────────────────────────────────────────────
interface DiaryProps {
  onOpenChange?: (open: boolean) => void;
}

// Pre-compute stable random values for InkMotes to avoid hydration mismatch and purity rule issues
const MOTE_CONFIG: MoteConfig[] = Array.from({ length: 12 }, (_, i) => ({
  xPct: (i * 37 + 13) % 100,
  delay: i * 0.65,
  yTarget: -(140 + Math.random() * 160),
  xTarget: (Math.random() - 0.5) * 50,
  duration: 4.5 + Math.random() * 3,
  repeatDelay: 2 + Math.random() * 5,
}));

export default function Diary({ onOpenChange }: DiaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"type" | "draw">("type");
  const [isMuted, setIsMuted] = useState(true);

  const [riddleState, setRiddleState] = useState<RiddleState>({
    userName: "", trustScore: 10, conversationCount: 0, stage: "intro", lastInputWasDrawing: false,
  });

  const [userText, setUserText] = useState("");
  const [fadingText, setFadingText] = useState("");
  const [isTextFading, setIsTextFading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isCanvasFading, setIsCanvasFading] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const [riddleText, setRiddleText] = useState("");
  const [riddleEmotion, setRiddleEmotion] = useState<"neutral" | "pleased" | "annoyed" | "hostile">("neutral");
  const [isRiddleWriting, setIsRiddleWriting] = useState(false);
  const [isRiddleTextFading, setIsRiddleTextFading] = useState(false);
  const [flashGreen, setFlashGreen] = useState(false);
  // "thinking" = between user submit & first AI character appearing
  const [isThinking, setIsThinking] = useState(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const trustMotionValue = useMotionValue(10);
  const trustSpring = useSpring(trustMotionValue, { stiffness: 55, damping: 18 });

  const historyEndRef = useRef<HTMLDivElement | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ sender: "user" | "riddle"; text: string; isDrawing?: boolean }>>([]);

  // 3D tilt on cover hover
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  const handleCoverMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleCoverMouseLeave = () => {
    animate(mouseX, 0, { duration: 0.5 });
    animate(mouseY, 0, { duration: 0.5 });
  };

  const handleOpenDiary = () => {
    audio.playPageFlip();
    setIsOpen(true);
    onOpenChange?.(true);
    if (!isMuted) audio.startAmbient();
  };

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    if (!muted && isOpen) audio.startAmbient();
  };

  const dismissRiddleText = useCallback(() => {
    if (isRiddleTextFading || !riddleText || isRiddleWriting) return;
    if (fadeTimeoutRef.current) { clearTimeout(fadeTimeoutRef.current); fadeTimeoutRef.current = null; }
    setIsRiddleTextFading(true);
    audio.playScratch(800, true);
    setTimeout(() => { setRiddleText(""); setIsRiddleTextFading(false); }, 1800);
  }, [isRiddleTextFading, riddleText, isRiddleWriting]);

  const handleReset = () => {
    if (fadeTimeoutRef.current) { clearTimeout(fadeTimeoutRef.current); fadeTimeoutRef.current = null; }
    setIsRiddleTextFading(false);
    audio.playPageFlip();
    setIsOpen(false);
    onOpenChange?.(false);
    setDialogueHistory([]);
    setRiddleText("");
    setUserText("");
    setFadingText("");
    setHasDrawn(false);
    setIsThinking(false);
    setRiddleState({ userName: "", trustScore: 10, conversationCount: 0, stage: "intro", lastInputWasDrawing: false });
    setRiddleEmotion("neutral");
    trustMotionValue.set(10);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Resize canvas
  useEffect(() => {
    if (isOpen && inputMode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.strokeStyle = riddleEmotion === "hostile" ? "#580c0c" : "#1a100a";
        ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctxRef.current = ctx;
      }
    }
  }, [isOpen, inputMode, riddleEmotion]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isRiddleWriting || isCanvasFading) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (ctxRef.current) { ctxRef.current.beginPath(); ctxRef.current.moveTo(x, y); }
    setIsDrawing(true); setHasDrawn(true); lastPosRef.current = { x, y };
  };
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || isRiddleWriting || isCanvasFading) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    ctxRef.current.lineTo(x, y); ctxRef.current.stroke();
    const dist = Math.hypot(x - lastPosRef.current.x, y - lastPosRef.current.y);
    if (dist > 6) { audio.playScratch(75, true); lastPosRef.current = { x, y }; }
  };
  const stopDrawing = () => setIsDrawing(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" && e.key !== "Backspace" && e.key !== "Shift") audio.playScratch(60, true);
  };

  const handlePourHeartText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim() || isRiddleWriting || isTextFading) return;
    setDialogueHistory((prev) => [...prev, { sender: "user", text: userText }]);
    setFadingText(userText);
    setUserText("");
    setIsTextFading(true);
    setRiddleText("");
    audio.playScratch(800, false);
    setTimeout(() => {
      setIsTextFading(false);
      setFadingText("");
      setIsThinking(true);
      triggerRiddleReply(userText);
    }, 1500);
  };

  const getCanvasDataURL = () => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width; offscreen.height = canvas.height;
    const oCtx = offscreen.getContext("2d"); if (!oCtx) return canvas.toDataURL("image/png");
    oCtx.fillStyle = "#e2b475";
    oCtx.fillRect(0, 0, offscreen.width, offscreen.height);
    oCtx.drawImage(canvas, 0, 0);
    return offscreen.toDataURL("image/jpeg", 0.85);
  };

  const handlePourHeartDrawing = () => {
    if (!hasDrawn || isRiddleWriting || isCanvasFading) return;
    const drawingImage = getCanvasDataURL() || undefined;
    setDialogueHistory((prev) => [...prev, { sender: "user", text: "[Handwritten Drawing]", isDrawing: true }]);
    setIsCanvasFading(true); setRiddleText("");
    audio.playWhisper();
    setTimeout(() => {
      setIsCanvasFading(false); setHasDrawn(false);
      if (canvasRef.current && ctxRef.current) ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setIsThinking(true);
      triggerRiddleReply("[drawing]", drawingImage);
    }, 1500);
  };

  const triggerRiddleReply = async (inputText: string, drawingImage?: string) => {
    setIsRiddleWriting(true);
    try {
      const currentHistory = dialogueHistory.map((item) => ({ sender: item.sender, text: item.text, isDrawing: item.isDrawing }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputText, history: currentHistory, state: riddleState, image: drawingImage }),
      });
      if (!response.ok) throw new Error("Failed to contact the Riddle AI server.");
      const result = await response.json() as { text: string; emotion: "neutral" | "pleased" | "annoyed" | "hostile"; trustScore: number };

      setRiddleState((prev) => ({
        ...prev,
        trustScore: result.trustScore,
        conversationCount: prev.conversationCount + 1,
        stage: result.trustScore >= 85 ? "control" : result.trustScore >= 60 ? "secrets" : result.trustScore >= 30 ? "bonding" : "intro",
      }));
      setRiddleEmotion(result.emotion);
      trustMotionValue.set(result.trustScore);

      if (result.emotion === "hostile") {
        setFlashGreen(true);
        audio.playHeartbeat(); audio.playWhisper();
        setTimeout(() => setFlashGreen(false), 500);
      } else if (result.emotion === "pleased") {
        audio.playWhisper();
      } else {
        audio.playHeartbeat();
      }

      // Stop thinking, start typing
      setIsThinking(false);
      let charIndex = 0;
      const textToType = result.text;
      setRiddleText("");
      const typingInterval = setInterval(() => {
        if (charIndex < textToType.length) {
          const nextChar = textToType.charAt(charIndex);
          setRiddleText((prev) => prev + nextChar);
          if (nextChar !== " " && nextChar !== ".") audio.playScratch(65, result.emotion === "pleased");
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setIsRiddleWriting(false);
          setDialogueHistory((prev) => [...prev, { sender: "riddle", text: textToType }]);
          // Auto-fade after 8 seconds
          fadeTimeoutRef.current = setTimeout(() => dismissRiddleText(), 8000);
        }
      }, 55 + Math.random() * 35);

    } catch (err) {
      console.error("Failed to fetch Riddle response:", err);
      setIsThinking(false);
      setIsRiddleWriting(false);
      setRiddleText("Something went wrong in the ink... write to me again.");
      setRiddleEmotion("neutral");
    }
  };

  useEffect(() => { historyEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [dialogueHistory, riddleText]);
  useEffect(() => () => { audio.stopAmbient(); }, []);

  const inkColor = riddleEmotion === "hostile" ? "var(--color-ink-red)" : riddleEmotion === "pleased" ? "var(--color-ink-green)" : "var(--color-ink)";

  // Variants
  const openBookVariants: Variants = {
    hidden: { opacity: 0, scale: 0.97 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  };
  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.12 * i, duration: 0.4, ease: "easeOut" as const } }),
  };

  // Right page click — dismiss riddle text if visible
  const handleRightPageClick = () => {
    if (riddleText && !isRiddleWriting) dismissRiddleText();
  };

  return (
    <div className={`relative w-full flex items-center justify-center book-container ${flashGreen ? "avada-flash" : ""}`}
      style={{ height: isOpen ? "100%" : "720px", minHeight: isOpen ? "calc(100vh - 100px)" : "720px" }}
    >
      {/* Ambient ink motes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {MOTE_CONFIG.map((cfg, i) => <InkMote key={i} config={cfg} />)}
      </div>

      {/* Header controls — always visible above book */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="absolute top-[-52px] right-4 flex items-center gap-3 z-40 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-amber-900/20 text-xs tracking-wider text-amber-100 font-cinzel"
      >
        <motion.button onClick={handleToggleMute} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} className="flex items-center gap-1.5 cursor-pointer transition-colors hover:text-amber-400">
          {isMuted ? (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg><span>Muted</span></>
          ) : (
            <><svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg><span className="text-amber-400">Ambient On</span></>
          )}
        </motion.button>

        {/* Trust meter — visible when open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <span className="text-amber-900/50">|</span>
              <span className="text-amber-700/60 text-[9px] tracking-widest uppercase">Trust</span>
              <div className="w-20 h-1.5 bg-amber-950/20 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  animate={{ width: riddleState.trustScore + "%", backgroundColor: riddleEmotion === "hostile" ? "#991b1b" : riddleEmotion === "pleased" ? "#166534" : "#92400e" }}
                  style={{ width: trustSpring.get() + "%" }}
                  transition={{ type: "spring", stiffness: 50, damping: 18 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="text-amber-900/50">|</span>
        <motion.button onClick={handleReset} whileHover={{ scale: 1.06, color: "#f59e0b" }} whileTap={{ scale: 0.94 }} className="cursor-pointer transition-colors">
          Reset Diary
        </motion.button>
      </motion.div>

      {/* ── Book scene ── */}
      <div className="relative w-full h-full flex items-center justify-center">

        {/* CLOSED COVER */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -90, scale: 0.9, x: -60, transition: { duration: 0.4, ease: "easeIn" as const } }}
              onClick={handleOpenDiary}
              onMouseMove={handleCoverMouseMove}
              onMouseLeave={handleCoverMouseLeave}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform" }}
              transition={{ duration: 0.55, ease: "easeOut" as const }}
              className="absolute w-[480px] h-[650px] leather-cover rounded-sm flex flex-col items-center justify-between py-10 px-8 cursor-pointer select-none shadow-[0_20px_55px_rgba(0,0,0,0.85)]"
            >
              <BrassCorner position="tl" />
              <BrassCorner position="tr" />
              <BrassCorner position="bl" />
              <BrassCorner position="br" />
              <div className="absolute inset-[2px] rounded-sm border border-white/[0.03] pointer-events-none" />

              <div className="flex-1 flex items-center justify-center w-full">
                <BurnScar />
              </div>

              <div className="w-full px-3 pb-6">
                <motion.div className="nameplate w-full py-2.5 px-4 flex items-center justify-center font-cinzel font-bold text-sm tracking-[0.18em] rounded-[2px]"
                  animate={{ textShadow: ["0 0 8px rgba(201,160,48,0.3)", "0 0 18px rgba(201,160,48,0.65)", "0 0 8px rgba(201,160,48,0.3)"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  TOM MARVOLO RIDDLE
                </motion.div>
                <motion.p className="text-[9px] text-amber-700/40 font-cinzel tracking-[0.25em] uppercase text-center mt-3"
                  animate={{ opacity: [0.3, 0.65, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  Click to open
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OPEN BOOK */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="open-book"
              variants={openBookVariants}
              initial="hidden"
              animate="visible"
              className="w-[960px] h-[650px] flex rounded-sm shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden relative"
            >
              {/* LEFT PAGE — Dialogue History */}
              <motion.div
                custom={0} variants={pageVariants} initial="hidden" animate="visible"
                className="w-1/2 h-full parchment parchment-page-left flex flex-col justify-between p-10 select-none relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/8 via-transparent to-amber-950/15 pointer-events-none" />

                <div className="flex flex-col gap-4 mt-2 relative z-10 h-full">
                  <div className="flex flex-col pb-3 border-b border-amber-950/20">
                    <h3 className="font-cinzel text-amber-950 text-base tracking-[0.25em] font-bold uppercase">T. M. Riddle</h3>
                    <span className="text-[9px] font-cinzel text-amber-950/60 tracking-[0.3em] mt-0.5 uppercase">London, 1943 — Private Diary</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-5 font-parchment text-[15px] leading-relaxed custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {dialogueHistory.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                          className="italic text-amber-950/50 mt-10 text-center text-sm leading-loose px-2"
                        >
                          &ldquo;I do not mind sharing my diary with you.<br />Some secrets are far too heavy to keep alone...&rdquo;
                        </motion.div>
                      ) : (
                        dialogueHistory.map((item, idx) => <DialogueRow key={idx} item={item} />)
                      )}
                    </AnimatePresence>
                    <div ref={historyEndRef} />
                  </div>
                </div>

                <div className="text-[9px] text-amber-950/50 font-cinzel tracking-[0.3em] flex justify-between relative z-10 pt-2 border-t border-amber-950/20">
                  <span>LONDON, 1943</span><span>PAGE LVII</span>
                </div>
              </motion.div>

              {/* Spine */}
              <div className="w-8 h-full spine-shadow absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 z-20 pointer-events-none" />

              {/* RIGHT PAGE — Interactive writing area */}
              <motion.div
                custom={1} variants={pageVariants} initial="hidden" animate="visible"
                onClick={handleRightPageClick}
                className={`w-1/2 h-full parchment parchment-page-right flex flex-col justify-between p-10 relative overflow-hidden ${riddleText && !isRiddleWriting ? "cursor-pointer" : ""}`}
              >
                <div className="absolute inset-0 bg-gradient-to-bl from-amber-950/8 via-transparent to-amber-950/15 pointer-events-none" />

                {/* Top Controls */}
                <div className="flex justify-between items-center z-30 relative">
                  <div className="flex gap-1.5 bg-amber-950/12 p-0.5 rounded border border-amber-950/20 font-cinzel text-[9px] tracking-widest font-semibold uppercase">
                    {(["type", "draw"] as const).map((mode) => (
                      <motion.button
                        key={mode}
                        onClick={(e) => { e.stopPropagation(); setInputMode(mode); if (mode === "type") setHasDrawn(false); else setUserText(""); }}
                        whileTap={{ scale: 0.93 }}
                        className={`px-3 py-1.5 rounded-sm cursor-pointer relative ${inputMode === mode ? "text-amber-950 font-bold" : "text-amber-950/60 hover:text-amber-950/80"}`}
                      >
                        {inputMode === mode && (
                          <motion.span layoutId="tab-pill" className="absolute inset-0 bg-amber-950/20 rounded-sm"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                          />
                        )}
                        <span className="relative z-10">{mode === "type" ? "✒ Quill" : "✍ Inkwell"}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Status badge */}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isThinking ? "thinking" : isRiddleWriting ? "writing" : isTextFading || isCanvasFading ? "absorbing" : "waiting"}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: [0.55, 0.95, 0.55], y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.25 }}
                      className="text-[9px] uppercase font-cinzel tracking-widest text-amber-950/65 font-bold"
                    >
                      {isThinking ? "Reaching into memory..." : isRiddleWriting ? "Tom is writing..." : isTextFading || isCanvasFading ? "Absorbing ink..." : "Awaiting ink"}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Central canvas */}
                <div className="relative flex-1 my-5 overflow-hidden">

                  {/* ─ THINKING ANIMATION ─ */}
                  <AnimatePresence>
                    {isThinking && <InkThinkingAnimation />}
                  </AnimatePresence>

                  {/* ─ QUILL MODE ─ */}
                  <AnimatePresence mode="wait">
                    {inputMode === "type" && !isThinking && (
                      <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col justify-between relative"
                      >
                        {/* Text absorb fade */}
                        <AnimatePresence>
                          {isTextFading && (
                            <motion.div key="fade"
                              initial={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                              animate={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
                              transition={{ duration: 1.5, ease: "easeIn" as const }}
                              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none z-10"
                            >
                              <p className="font-parchment text-xl text-amber-950/85">{fadingText}</p>
                              <div className="w-48 h-1 bg-amber-950/10 rounded-full overflow-hidden mt-4 relative">
                                <motion.div
                                  className="h-full bg-amber-950/60"
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 1.4, ease: "easeInOut" }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Tom's response */}
                        <AnimatePresence>
                          {riddleText && (
                            <motion.div key="riddle"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: isRiddleTextFading ? 0 : 1, filter: isRiddleTextFading ? "blur(10px)" : "blur(0px)", scale: isRiddleTextFading ? 1.03 : 1 }}
                              transition={{ duration: isRiddleTextFading ? 1.8 : 0.3, ease: "easeInOut" as const }}
                              className="absolute inset-0 flex flex-col items-start justify-center px-4 py-3 pointer-events-none z-15 select-none"
                            >
                              <p className="font-riddle text-[28px] tracking-wide leading-relaxed text-left" style={{ color: inkColor }}>
                                {riddleText}
                              </p>
                              <AnimatePresence>
                                {!isRiddleWriting && !isRiddleTextFading && (
                                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0.45, 0.85, 0.45] }} transition={{ duration: 2.5, repeat: Infinity }}
                                    className="mt-3 font-cinzel text-[8px] tracking-[0.2em] text-amber-950/50 font-bold self-end animate-pulse"
                                  >
                                    Tap anywhere to dismiss
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Input form */}
                        <AnimatePresence>
                          {!isTextFading && !riddleText && !isRiddleTextFading && !isThinking && (
                            <motion.form key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                              onSubmit={handlePourHeartText}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full h-full flex flex-col justify-between p-2"
                            >
                              <textarea
                                value={userText}
                                onChange={(e) => setUserText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Write your secrets here..."
                                disabled={isRiddleWriting}
                                className="w-full flex-1 bg-transparent text-amber-950 font-parchment text-lg leading-loose placeholder-amber-950/45 border-none resize-none focus:outline-none focus:ring-0 font-medium quill-cursor"
                                style={{ paddingTop: "4px" }}
                              />
                              <div className="flex justify-center mt-1">
                                <motion.button type="submit" disabled={!userText.trim() || isRiddleWriting}
                                  whileHover={{ scale: 1.04, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}
                                  whileTap={{ scale: 0.95 }}
                                  className="bg-[#1f160e] text-[#f7eede] hover:bg-[#2d2116] px-7 py-2 rounded-sm font-cinzel text-[10px] font-bold tracking-widest disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer uppercase border border-amber-950/30 shadow-md"
                                >
                                  Pour Heart
                                </motion.button>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ─ INKWELL MODE ─ */}
                  <AnimatePresence mode="wait">
                    {inputMode === "draw" && !isThinking && (
                      <motion.div key="draw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col justify-between relative no-scroll-touch"
                      >
                        {/* Tom's response */}
                        <AnimatePresence>
                          {riddleText && (
                            <motion.div key="riddle-draw"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: isRiddleTextFading ? 0 : 1, filter: isRiddleTextFading ? "blur(10px)" : "blur(0px)", scale: isRiddleTextFading ? 1.03 : 1 }}
                              transition={{ duration: isRiddleTextFading ? 1.8 : 0.3 }}
                              className="absolute inset-0 flex flex-col items-start justify-center px-4 py-3 pointer-events-none z-20 select-none"
                            >
                              <p className="font-riddle text-[28px] tracking-wide leading-relaxed text-left" style={{ color: inkColor }}>
                                {riddleText}
                              </p>
                              <AnimatePresence>
                                {!isRiddleWriting && !isRiddleTextFading && (
                                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0.25, 0.65, 0.25] }} transition={{ duration: 2.5, repeat: Infinity }}
                                    className="mt-3 font-cinzel text-[8px] tracking-[0.2em] text-amber-900/35 self-end"
                                  >
                                    Tap anywhere to dismiss
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Canvas */}
                        <motion.canvas ref={canvasRef}
                          onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing}
                          animate={{ opacity: isCanvasFading ? 0 : 1, filter: isCanvasFading ? "blur(8px)" : "blur(0px)" }}
                          transition={{ duration: 1.5 }}
                          className={`w-full h-full bg-transparent ink-draw-cursor z-10 ${riddleText ? "hidden" : "block"}`}
                        />

                        {/* Ink absorption loading bar for drawing */}
                        <AnimatePresence>
                          {isCanvasFading && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
                            >
                              <div className="w-48 h-1 bg-amber-950/10 rounded-full overflow-hidden relative">
                                <motion.div
                                  className="h-full bg-amber-950/60"
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 1.4, ease: "easeInOut" }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {!hasDrawn && !riddleText && (
                            <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none p-6"
                            >
                              <p className="font-parchment text-sm text-amber-950/50 italic text-center leading-relaxed font-medium">
                                Use finger, stylus, or mouse to write or draw...
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {!riddleText && !isRiddleTextFading && (
                            <motion.div key="draw-ctrls" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-2 left-0 right-0 flex justify-center gap-3 z-30"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <motion.button onClick={handlePourHeartDrawing} disabled={!hasDrawn || isRiddleWriting || isCanvasFading}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                                className="bg-[#1f160e] text-[#f7eede] hover:bg-[#2d2116] px-7 py-2 rounded-sm font-cinzel text-[10px] font-bold tracking-widest disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer uppercase border border-amber-950/30 shadow-md"
                              >Pour Ink</motion.button>
                              <motion.button
                                onClick={() => { if (canvasRef.current && ctxRef.current) { ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setHasDrawn(false); }}}
                                disabled={!hasDrawn || isRiddleWriting || isCanvasFading}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                                className="border border-amber-950/45 text-amber-950/85 hover:text-amber-950 hover:bg-amber-950/5 px-4 py-2 rounded-sm font-cinzel text-[9px] font-bold tracking-widest disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer uppercase"
                              >Clear</motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quill writing indicator */}
                  <AnimatePresence>
                    {isRiddleWriting && !isThinking && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute bottom-14 left-4 flex items-center gap-2 pointer-events-none z-30"
                      >
                        <motion.span animate={{ rotate: [0, -12, 6, -9, 0] }} transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }} className="text-base">🪶</motion.span>
                        <div className="flex gap-[3px]">
                          {[0, 0.18, 0.36].map((d, i) => (
                            <motion.div key={i} className="w-1 h-1 rounded-full bg-amber-950/45"
                              animate={{ scale: [1, 1.6, 1], opacity: [0.35, 1, 0.35] }}
                              transition={{ duration: 0.65, delay: d, repeat: Infinity }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom page marker */}
                <div className="text-[9px] text-amber-950/50 font-cinzel tracking-[0.3em] flex justify-between relative z-10 pt-2 border-t border-amber-950/20">
                  <span>PAGE LVIII</span>
                  <span>PROPERTY OF T. M. RIDDLE</span>
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
