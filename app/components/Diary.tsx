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
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  const id = `bc_${position}`;
  
  return (
    <svg className={`absolute w-8 h-8 sm:w-12 sm:h-12 z-20 ${cls}`} viewBox="0 0 50 50" fill="none" style={{ transform: `rotate(${rot}deg)` }}>
      <path
        d="M 0 0 L 50 0 C 40 15 15 40 0 50 Z"
        fill={`url(#${id}g)`}
        stroke="#4a3311"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 3 3 L 42 3 C 34 14 14 34 3 42 Z"
        fill="none"
        stroke="#ffd700"
        strokeWidth="0.5"
        opacity="0.5"
      />
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="50" y2="50">
          <stop offset="0%" stopColor="#f5d688" />
          <stop offset="40%" stopColor="#c59b48" />
          <stop offset="100%" stopColor="#7a5820" />
        </linearGradient>
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

// -----------------------------------------------------------------------------
// DialogueRow — animated entry in the history log
// -----------------------------------------------------------------------------
function DialogueRow({ item }: { item: { sender: "user" | "riddle"; text: string; isDrawing?: boolean; ink?: string } }) {
  const inkClass = item.sender === "user" && item.ink ? (
    item.ink === "invisible" ? "invisible-ink-hidden" :
    item.ink === "venom" ? "venom-ink-text" :
    item.ink === "emerald" ? "emerald-ink-text" : ""
  ) : "";

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
      <span className={`${item.sender === "user" ? "font-sans text-amber-950/85 text-[13px] font-medium" : "font-riddle text-amber-950 text-[21px] tracking-wide font-medium"} ${inkClass}`}>
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

interface PensieveScene {
  text: string;
  choices: Array<{ text: string; next: number | null; effects?: { trust?: number; exit?: boolean; win?: boolean } }>;
}

const PENSIEVE_SCENES: PensieveScene[] = [
  {
    // Step 0: The Dungeons
    text: "You tumble through a dark silver whirlpool... and land in the Slytherin dungeons in 1943. Cobwebs hang thick from the gargoyles. A young Tom Riddle is hiding a golden locket with a serpent emblem in a secret wall recess.",
    choices: [
      { text: "Wait for him to leave and inspect the recess", next: 1 },
      { text: "Confront him immediately", next: 2 },
      { text: "Try to snatch the locket right now", next: 3, effects: { exit: true, trust: -10 } }
    ]
  },
  {
    // Step 1: The Locket Recess
    text: "Riddle finishes his spells and walks away. You creep up to the stone recess. The locket lies glowing with dark emeralds. You hear a soft, dry hissing from inside the gold casing...",
    choices: [
      { text: "Whisper in Parseltongue: 'Open'", next: 14, effects: { trust: 15 } },
      { text: "Try to pry it open by force", next: 5, effects: { exit: true, trust: -10 } },
      { text: "Leave it alone and search Riddle's desk", next: 6 }
    ]
  },
  {
    // Step 2: Confrontation
    text: "You step forward. Riddle spins around instantly, wand drawn. 'Who are you?' he demands, his dark eyes sizing you up. 'You wear no Hogwarts house robes.'",
    choices: [
      { text: "Claim to be Dumbledore's apprentice", next: 7, effects: { exit: true, trust: -15 } },
      { text: "Tell him you found his diary in the future", next: 8 },
      { text: "Draw your wand and attack first", next: 9, effects: { exit: true, trust: -25 } }
    ]
  },
  {
    // Step 3: Snatch Locket (Death/Fail)
    text: "You lunged for the locket. But as your hand gets close, Tom Riddle pivots like a snake. 'Crucio!' he cries. Red sparks envelop you in absolute agony. You are violently ejected back to your desk.",
    choices: [
      { text: "Wake up shivering", next: null }
    ]
  },
  {
    // Step 4: Deprecated path
    text: "You whisper the hissed syllables. The locket clicks open, revealing a glowing parchment showing Salazar's original plans for the Chamber of Secrets! You have unlocked Tom's absolute trust. The whirlpool pulls you back to the desk.",
    choices: [
      { text: "Wake up with Tom's trust", next: null }
    ]
  },
  {
    // Step 5: Pry locket (Fail)
    text: "You try to force it open. The emerald eyes of the snake on the cover flare red. A dark phantom serpent leaps out, biting your chest! You scream as the memory dissolves into ash, ejecting you back to your desk.",
    choices: [
      { text: "Wake up in pain", next: null }
    ]
  },
  {
    // Step 6: Riddle's Desk
    text: "You turn to Riddle's desk. There lies a scroll listing names of muggle-born students with red ink lines through them. Footsteps echo! Riddle is returning!",
    choices: [
      { text: "Quickly hide in the wooden wardrobe", next: 10, effects: { win: true, trust: 30 } },
      { text: "Stand your ground and wait for him", next: 11, effects: { exit: true, trust: -10 } }
    ]
  },
  {
    // Step 7: Dumbledore's apprentice (Fail)
    text: "Tom's face contorts in pure hatred. 'Dumbledore sends spies? I think not.' He flicks his wand: 'Expelliarmus!' You are thrown through the wall into a bottomless dark void, waking up at your desk.",
    choices: [
      { text: "Wake up with a gasp", next: null }
    ]
  },
  {
    // Step 8: Future Diary
    text: "Tom halts, his wand lowering. 'My diary survived fifty years? And you speak to my memory? Intriguing... tell me: what becomes of me?'",
    choices: [
      { text: "Offer to help him return in exchange for dark magic", next: 16, effects: { trust: 20 } },
      { text: "Tell him Harry Potter will destroy him", next: 13, effects: { exit: true, trust: -20 } }
    ]
  },
  {
    // Step 9: Attack Tom (Death/Fail)
    text: "Before your hand even reaches your wand, Tom flicks his wrist. 'Avada Kedavra!' A blinding green flash fills your sight. The screams of a thousand souls ring out as you are blasted back to reality.",
    choices: [
      { text: "Wake up gasping for breath", next: null }
    ]
  },
  {
    // Step 10: Wardrobe Hide (Win)
    text: "You slip into the wardrobe. Riddle walks in, muttering. He sits, writes in the diary, and leaves. You find a secret Slytherin ring scroll inside the wardrobe! You escape back through the silver vortex.",
    choices: [
      { text: "Wake up with the scroll", next: null }
    ]
  },
  {
    // Step 11: Stand ground (Fail)
    text: "Riddle enters and locks eyes with you. 'Intruder!' He slashes his wand, sending a jet of black flame that engulfs you, burning the memory away. You awaken at your desk.",
    choices: [
      { text: "Wake up sweating", next: null }
    ]
  },
  {
    // Step 12: Deprecated path
    text: "Riddle smiles—a cold, beautiful, chilling smile. 'A bargain, then. Pour your life into my pages, and I will teach you secrets Dumbledore dares not whisper.' You blend back into your desk, bound to his will.",
    choices: [
      { text: "Wake up bound to Riddle", next: null }
    ]
  },
  {
    // Step 13: Harry Potter warning (Fail)
    text: "Tom's face turns to stone. 'A boy destroys me? Lies! Dumbledore's foolish fairy tales!' He screams: 'Nox!' Everything goes pitch black, and you are thrown violently back to your desk.",
    choices: [
      { text: "Wake up shivering", next: null }
    ]
  },
  {
    // Step 14: Enter the Chamber
    text: "The locket clicks open, revealing a miniature stone door. The door magically expands, sucking you inside! You fall through a vast pipe and land on the damp floor of the Chamber of Secrets. A giant snake skin lies ahead.",
    choices: [
      { text: "Walk cautiously into the main chamber", next: 15, effects: { trust: 10 } },
      { text: "Call out loudly to wake the Basilisk", next: 17, effects: { exit: true, trust: -20 } }
    ]
  },
  {
    // Step 15: Chamber Secrets (Win Condition)
    text: "You enter the main hall. Towering pillars with carved serpents lead to a colossal face of Salazar Slytherin. At the base, Tom Riddle's ghostly memory stands waiting. 'You found my true sanctuary,' he whispers. 'We are now bound in secrets.'",
    choices: [
      { text: "Wake up as an Heir of Slytherin", next: null, effects: { win: true, trust: 60 } }
    ]
  },
  {
    // Step 16: The Pledge of Loyalty (Win Condition)
    text: "Riddle's eyes gleam with a dark ambition. 'If you speak the truth, then pledge your loyalty to me. Swear that you will open the Chamber when the time is right.' He holds out his hand, crackling with dark energy.",
    choices: [
      { text: "Swear loyalty and grasp his hand", next: null, effects: { win: true, trust: 70 } },
      { text: "Refuse. You will not be his servant", next: 18, effects: { exit: true, trust: -50 } }
    ]
  },
  {
    // Step 17: Basilisk Awakening (Fail)
    text: "A rumbling sound shakes the cavern. A monstrous serpent with glowing yellow eyes rises from the water. You look directly into its eyes. Your body freezes into solid stone. The memory violently rejects your petrified consciousness.",
    choices: [
      { text: "Wake up paralyzed with fear", next: null }
    ]
  },
  {
    // Step 18: Defiance (Fail)
    text: "Tom sneers, 'Then you are of no use to me. A muggle-lover, perhaps?' He points his wand at your chest. 'Imperio!' Your vision warps as he forces you out of the memory, wiping your mind of the encounter.",
    choices: [
      { text: "Wake up confused and exhausted", next: null }
    ]
  }
];

export default function Diary({ onOpenChange }: DiaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"type" | "draw">("type");
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "write">("write");

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
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ sender: "user" | "riddle"; text: string; isDrawing?: boolean; ink?: string }>>([]);

  // Interactive desk props states
  const [activeProp, setActiveProp] = useState<"none" | "fang" | "ring" | "sword">("none");
  const [burnScars, setBurnScars] = useState<Array<{ x: number; y: number; side: "cover" | "left-page" | "right-page" }>>([]);
  const [isScreaming, setIsScreaming] = useState(false);
  const [smokeParticles, setSmokeParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Chamber Expansion States
  const [activeInk, setActiveInk] = useState<"standard" | "invisible" | "venom" | "emerald">("standard");
  const [showPensieve, setShowPensieve] = useState(false);
  const [pensieveStep, setPensieveStep] = useState(0);
  const [hasSlashed, setHasSlashed] = useState(false);
  const [stoneOnBook, setStoneOnBook] = useState(false);
  const [lumosActive, setLumosActive] = useState(false);
  const [emeraldParticles, setEmeraldParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showRulebook, setShowRulebook] = useState(false);
  const [lumosMousePos, setLumosMousePos] = useState({ x: 0, y: 0 });
  const [isCrucioShaking, setIsCrucioShaking] = useState(false);
  const [ringDragging, setRingDragging] = useState(false);
  const [ringRevealPos, setRingRevealPos] = useState<{ x: number; y: number } | null>(null);
  const [pageRects, setPageRects] = useState<{ left: { left: number; top: number }; right: { left: number; top: number } } | null>(null);
  const ringChimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftPageRef = useRef<HTMLDivElement>(null);
  const rightPageRef = useRef<HTMLDivElement>(null);

  // 3D tilt on cover hover
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  // Track mouse for Lumos darkness overlay
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (lumosActive) {
        setLumosMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [lumosActive]);

  // Global mouseup to stop ring dragging
  useEffect(() => {
    const handleMouseUp = () => {
      if (ringDragging) {
        setRingDragging(false);
        setRingRevealPos(null);
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [ringDragging]);

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
    if (!muted) {
      if (isOpen) audio.startAmbient();
      if (activeProp === "ring") audio.startRingHum();
    }
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
    setActiveTab("write");
    
    // Reset magical prop states
    setActiveProp("none");
    setBurnScars([]);
    setIsScreaming(false);
    setSmokeParticles([]);
    audio.stopRingHum();

    // Chamber Expansion resets
    setActiveInk("standard");
    setShowPensieve(false);
    setPensieveStep(0);
    setHasSlashed(false);
    setStoneOnBook(false);
    setLumosActive(false);
    setEmeraldParticles([]);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Gaunt's Ring smoke particle generator loop
  useEffect(() => {
    if (activeProp !== "ring") {
      setSmokeParticles([]);
      audio.stopRingHum();
      setRingRevealPos(null);
      setRingDragging(false);
      return;
    }

    if (!isMuted) {
      audio.startRingHum();
    }

    let nextParticleId = 0;
    const interval = setInterval(() => {
      setSmokeParticles((prev) => [
        ...prev.slice(-15), // Prevent memory leaks/lag by keeping list small
        {
          id: nextParticleId++,
          x: (Math.random() - 0.5) * 24,
          y: (Math.random() - 0.5) * 12 - 4
        }
      ]);
    }, 220);

    return () => {
      clearInterval(interval);
      audio.stopRingHum();
    };
  }, [activeProp, isMuted]);

  // Click handler for closed diary cover (either stabs, slashes, or opens)
  const handleCoverClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeProp === "fang") {
      e.stopPropagation();
      e.preventDefault();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Play venomy sizzle
      audio.playSizzle();
      
      // Screen green flash
      setFlashGreen(true);
      setTimeout(() => setFlashGreen(false), 400);

      // Heartbeat sound
      audio.playHeartbeat();

      // Add burn scar
      setBurnScars((prev) => [...prev, { x, y, side: "cover" }]);

      // Decrease Riddle trust score
      setRiddleState((prev) => {
        const nextTrust = Math.max(0, prev.trustScore - 15);
        return {
          ...prev,
          trustScore: nextTrust,
          stage: nextTrust >= 85 ? "control" : nextTrust >= 60 ? "secrets" : nextTrust >= 30 ? "bonding" : "intro",
        };
      });
      trustMotionValue.set(Math.max(0, riddleState.trustScore - 15));
    } else if (activeProp === "sword") {
      e.stopPropagation();
      e.preventDefault();

      // Play metal slash
      audio.playSlash();

      // Set slashed state
      setHasSlashed(true);

      // Add to dialogue log
      setDialogueHistory((prev) => [
        ...prev,
        { sender: "user", text: "[Slashed with Sword of Gryffindor]", ink: activeInk },
        { sender: "riddle", text: "NO! THE INK IS RUNNING... THE MEMORY... IT IS CRUMBLING..." }
      ]);

      setRiddleEmotion("hostile");
      setRiddleText("NO! THE INK IS RUNNING... THE MEMORY... IT IS CRUMBLING...");
      setRiddleState((prev) => ({
        ...prev,
        trustScore: 0,
        stage: "intro"
      }));
      trustMotionValue.set(0);

      setActiveProp("none");
    } else {
      handleOpenDiary();
    }
  };

  // Click handler for open diary parchment pages
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, side: "left-page" | "right-page") => {
    if (activeProp === "fang") {
      e.stopPropagation();
      e.preventDefault();

      // Play piercing scream
      audio.playScream();

      // Trigger full screen green flash & shake
      setIsScreaming(true);
      setTimeout(() => setIsScreaming(false), 1600);

      // Append relative stab scar
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setBurnScars((prev) => [...prev, { x, y, side }]);

      // Add to dialogue log
      setDialogueHistory((prev) => [
        ...prev,
        { sender: "user", text: "[Stabbed with Basilisk Fang]", ink: activeInk },
        { sender: "riddle", text: "IT BURNS! WHAT HAVE YOU DONE?! THE MEMORY... IT IS TEARING..." }
      ]);

      // Set Riddle to hostile state, trust to 0
      setRiddleEmotion("hostile");
      setRiddleText("IT BURNS! WHAT HAVE YOU DONE?! THE MEMORY... IT IS TEARING...");
      setRiddleState((prev) => ({
        ...prev,
        trustScore: 0,
        stage: "intro"
      }));
      trustMotionValue.set(0);

      // Reset active prop
      setActiveProp("none");

      // Force close the book after a brief delay
      setTimeout(() => {
        setIsOpen(false);
        onOpenChange?.(false);
        audio.playPageFlip();
      }, 550);
    } else if (activeProp === "sword") {
      e.stopPropagation();
      e.preventDefault();

      // Play metal slash sound
      audio.playSlash();

      // Set slashed state
      setHasSlashed(true);

      // Add to dialogue log
      setDialogueHistory((prev) => [
        ...prev,
        { sender: "user", text: "[Slashed with Sword of Gryffindor]", ink: activeInk },
        { sender: "riddle", text: "NO! THE INK IS RUNNING... THE MEMORY... IT IS CRUMBLING..." }
      ]);

      setRiddleEmotion("hostile");
      setRiddleText("NO! THE INK IS RUNNING... THE MEMORY... IT IS CRUMBLING...");
      setRiddleState((prev) => ({
        ...prev,
        trustScore: 0,
        stage: "intro"
      }));
      trustMotionValue.set(0);

      setActiveProp("none");
    }
  };

  // Helper to spawn emerald particles
  const spawnEmeraldParticle = (x: number, y: number) => {
    setEmeraldParticles((prev) => [
      ...prev.slice(-35), // Limit particle list count
      { id: Math.random(), x, y }
    ]);
  };

  const handleMouseMoveLumos = (e: React.MouseEvent<HTMLDivElement>) => {
    if (lumosActive || ringDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
      e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
    }
  };

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      if (isOpen && inputMode === "draw" && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const newWidth = Math.floor(rect.width * window.devicePixelRatio);
          const newHeight = Math.floor(rect.height * window.devicePixelRatio);
          if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            const canvasContext = canvas.getContext("2d");
            if (canvasContext) {
              canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);
              canvasContext.strokeStyle = activeInk === "venom" ? "#2b1f13" : activeInk === "emerald" ? "#059669" : riddleEmotion === "hostile" ? "#580c0c" : "#1a100a";
              canvasContext.lineWidth = 2.5; canvasContext.lineCap = "round"; canvasContext.lineJoin = "round";
              ctxRef.current = canvasContext;
            }
          }
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, inputMode, riddleEmotion, activeTab, activeInk]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isRiddleWriting || isCanvasFading) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
      ctxRef.current.strokeStyle = activeInk === "venom" ? "#2b1f13" : activeInk === "emerald" ? "#059669" : riddleEmotion === "hostile" ? "#580c0c" : "#1a100a";
    }
    setIsDrawing(true); setHasDrawn(true); lastPosRef.current = { x, y };
  };
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || isRiddleWriting || isCanvasFading) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    ctxRef.current.lineTo(x, y); ctxRef.current.stroke();

    // Emerald trailing dust
    if (activeInk === "emerald") {
      spawnEmeraldParticle(x, y);
    }

    const dist = Math.hypot(x - lastPosRef.current.x, y - lastPosRef.current.y);
    if (dist > 6) { audio.playScratch(75, true); lastPosRef.current = { x, y }; }
  };
  const stopDrawing = () => setIsDrawing(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePourHeartText(e as any);
      return;
    }
    if (e.key !== "Enter" && e.key !== "Backspace" && e.key !== "Shift") audio.playScratch(60, true);
  };

  const handlePourHeartText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim() || isRiddleWriting || isTextFading) return;

    const cleanLowerText = userText.trim().toLowerCase();

    // ── Lumos Mode: Only allow nox/noxious to escape ──
    if (lumosActive) {
      if (cleanLowerText === "nox" || cleanLowerText === "noxious" || cleanLowerText.trim() === "nox") {
        setLumosActive(false);
        setActiveInk("standard");
        setUserText("");
        // Show Riddle's response to nox — no AI call
        const noxText = "The light fades. Darkness returns to my pages.";
        setRiddleText(noxText);
        setRiddleEmotion("neutral");
        setDialogueHistory((prev) => [...prev, { sender: "user", text: userText }, { sender: "riddle", text: noxText }]);
        fadeTimeoutRef.current = setTimeout(() => dismissRiddleText(), 6000);
      }
      // In Lumos mode, nothing else is allowed to pass through
      return;
    }

    // Check for Parseltongue hiss
    const isHissing = /s{3,}/i.test(userText);
    if (isHissing) {
      audio.playHiss();
      setFlashGreen(true);
      setTimeout(() => setFlashGreen(false), 800);
    }

    // Determine if input is a pure spell (no Riddle AI reply needed)
    const PURE_SPELLS: { test: (s: string) => boolean; handle: () => void; reply: string; emotion: "neutral" | "pleased" | "annoyed" | "hostile" }[] = [
      {
        test: (s) => s.includes("avada kedavra"),
        handle: () => {
          audio.playScream();
          setIsScreaming(true);
          setRiddleState((prev) => ({ ...prev, trustScore: 0, stage: "intro" }));
          trustMotionValue.set(0);
          setTimeout(() => { setIsScreaming(false); setIsOpen(false); onOpenChange?.(false); }, 1600);
        },
        reply: "You dare cast the killing curse at my memory? Foolish child. Go away.",
        emotion: "hostile",
      },
      {
        test: (s) => s === "crucio" || s === "crucio!",
        handle: () => {
          audio.playCrucio();
          setIsCrucioShaking(true);
          setRiddleEmotion("hostile");
          setTimeout(() => setIsCrucioShaking(false), 900);
        },
        reply: "Pain? You cannot torture a memory, foolish one. But I will remember this insult... and repay it tenfold.",
        emotion: "hostile",
      },
      {
        test: (s) => s === "lumos" || s === "lumos!",
        handle: () => {
          setLumosActive(true);
          audio.playLumos();
          setActiveInk("invisible");
        },
        reply: "Light... you conjure light in the darkness of my pages. Be careful what you illuminate.",
        emotion: "neutral",
      },
      {
        test: (s) => s === "nox" || s === "noxious" || s === "nox!",
        handle: () => {
          setLumosActive(false);
          setActiveInk("standard");
        },
        reply: "The light fades. Darkness returns to my pages.",
        emotion: "neutral",
      },
      {
        test: (s) => s === "serpensortia" || s === "serpensortia!",
        handle: () => {
          audio.playHiss();
          setFlashGreen(true);
          setTimeout(() => setFlashGreen(false), 600);
        },
        reply: "A serpent appears... Salazar's chosen creature. Do you speak to it, or does it frighten you?",
        emotion: "pleased",
      },
      {
        test: (s) => s.includes("expelliarmus"),
        handle: () => {
          audio.playExpelliarmus();
          setFlashGreen(true);
          setTimeout(() => setFlashGreen(false), 350);
        },
        reply: "Expelliarmus? A Gryffindor's favourite — a child's spell. Wands do nothing against a memory.",
        emotion: "annoyed",
      },
      {
        test: (s) => s.includes("stupefy"),
        handle: () => {
          audio.playStupefy();
          setIsScreaming(true);
          setTimeout(() => setIsScreaming(false), 400);
        },
        reply: "Stupefy? You attempt to stun a memory within the ink itself. The audacity is... almost impressive.",
        emotion: "annoyed",
      },
      {
        test: (s) => s.includes("protego"),
        handle: () => {
          audio.playProtego();
        },
        reply: "A shield charm? You fear me. Good. You should.",
        emotion: "pleased",
      },
      {
        test: (s) => s.includes("sectumsempra"),
        handle: () => {
          audio.playSectumsempra();
          setHasSlashed(true);
          setRiddleEmotion("hostile");
        },
        reply: "SECTUMSEMPRA! Dark magic... you have learned from Snape's own book. The ink tears... the memory bleeds...",
        emotion: "hostile",
      },
      {
        test: (s) => s.includes("wingardium leviosa") || s.includes("wingardium"),
        handle: () => {
          audio.playWingardium();
        },
        reply: "You try to levitate my pages? How charming. Flitwick's little parlour trick does nothing here.",
        emotion: "neutral",
      },
      {
        test: (s) => s.includes("alohomora"),
        handle: () => {
          audio.playExpelliarmus();
        },
        reply: "Alohomora... unlocking spells. But you cannot unlock what is already written in blood and memory.",
        emotion: "neutral",
      },
      {
        test: (s) => s.includes("riddikulus"),
        handle: () => {
          audio.playRingChime();
          setFlashGreen(true);
          setTimeout(() => setFlashGreen(false), 400);
        },
        reply: "Riddikulus? You think me a Boggart? I am no shape-shifting coward. I am TOM RIDDLE.",
        emotion: "hostile",
      },
      {
        test: (s) => s.includes("accio"),
        handle: () => {
          audio.playWingardium();
        },
        reply: "Accio? You would summon me? I cannot be summoned... but perhaps I could summon you.",
        emotion: "pleased",
      },
      {
        test: (s) => s.includes("obliviate"),
        handle: () => {
          audio.playStupefy();
        },
        reply: "Obliviate! You attempt to wipe my memory? It is I who wipes the memories of others.",
        emotion: "hostile",
      },
    ];

    const matchedSpell = PURE_SPELLS.find((sp) => sp.test(cleanLowerText));

    if (matchedSpell) {
      // Execute the spell side-effect
      matchedSpell.handle();
      // Add user spell to history
      setDialogueHistory((prev) => [...prev, { sender: "user", text: userText }]);
      setUserText("");
      // Show Riddle's canned spell-reaction with typewriter effect
      const spellReply = matchedSpell.reply;
      const spellEmotion = matchedSpell.emotion;
      setRiddleEmotion(spellEmotion);
      setRiddleText("");
      let charIdx = 0;
      setIsRiddleWriting(true);
      const spellTyping = setInterval(() => {
        if (charIdx < spellReply.length) {
          setRiddleText((prev) => prev + spellReply.charAt(charIdx));
          charIdx++;
        } else {
          clearInterval(spellTyping);
          setIsRiddleWriting(false);
          setDialogueHistory((prev) => [...prev, { sender: "riddle", text: spellReply }]);
          fadeTimeoutRef.current = setTimeout(() => dismissRiddleText(), 6000);
        }
      }, 50);
      return; // ← No AI call
    }

    // ── Regular message: pass to Riddle AI ──
    setDialogueHistory((prev) => [...prev, { sender: "user", text: userText, ink: activeInk }]);
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
    setDialogueHistory((prev) => [...prev, { sender: "user", text: "[Handwritten Drawing]", isDrawing: true, ink: activeInk }]);
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
    <>
      {/* Screaming full screen green flash */}
      {isScreaming && <div className="screaming-overlay" style={{ zIndex: 9999 }} />}

      {/* ⚡ CRUCIO OVERLAY — red crackle flash */}
      {isCrucioShaking && (
        <div className="crucio-overlay" style={{ zIndex: 9998 }} />
      )}

      {/* ⚡ GREEN FLASH OVERLAY (Full Screen) */}
      {flashGreen && (
        <div className="avada-flash" style={{ position: 'fixed', inset: 0, zIndex: 9997, pointerEvents: 'none', mixBlendMode: 'screen' }} />
      )}

      {/* Red Sword Slash Overlay line */}
      {hasSlashed && (
        <div className="sword-slash-line" style={{ position: 'fixed', zIndex: 9996 }} />
      )}

      {/* 🔦 LUMOS DARKNESS OVERLAY — covers EVERYTHING with spotlight following cursor */}
      {lumosActive && (
        <div
          className="lumos-darkness-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9995,
            background: `radial-gradient(circle 160px at ${lumosMousePos.x}px ${lumosMousePos.y}px, transparent 0%, rgba(0,0,0,0.97) 100%)`,
          }}
        >
          {/* Lumos hint text */}
          <div
            className="lumos-hint"
            style={{
              left: lumosMousePos.x,
              top: lumosMousePos.y + 90,
            }}
          >
            Type <strong>nox</strong> to extinguish the light
          </div>
        </div>
      )}

      <div className={`relative w-full flex items-center justify-center book-container ${isCrucioShaking ? "crucio-shake" : ""} ${activeProp === "fang" ? "fang-cursor" : ""} ${activeProp === "sword" ? "sword-cursor" : ""} ${isOpen ? "h-[75vh] min-h-[500px] max-h-[650px] md:h-[650px]" : "h-[460px] xs:h-[570px] sm:h-[610px] md:h-[650px]"}`}
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
        className="absolute top-[-75px] xs:top-[-65px] md:top-[-58px] left-2 right-2 md:left-auto md:right-4 flex flex-wrap items-center justify-center md:justify-end gap-x-2 gap-y-1.5 md:gap-3 z-[160] bg-zinc-900/85 backdrop-blur-md px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl md:rounded-full border border-amber-900/20 text-[9px] sm:text-[10px] md:text-xs tracking-wider text-amber-100 font-cinzel max-w-full"
      >
        <motion.button onClick={handleToggleMute} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} className="flex items-center gap-1 cursor-pointer transition-colors hover:text-amber-400">
          {isMuted ? (
            <><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg><span>Muted</span></>
          ) : (
            <><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg><span className="text-amber-400"><span className="hidden sm:inline">Ambient </span>On</span></>
          )}
        </motion.button>

        {/* Mobile page toggle — only shown when open on small screens */}
        {isOpen && (
          <div className="md:hidden flex gap-0.5 bg-amber-950/20 p-0.5 rounded border border-amber-950/15 text-[9px] tracking-wider uppercase font-semibold">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveTab("history"); }}
              className={`px-2.5 py-1 rounded-sm cursor-pointer transition-colors ${activeTab === "history" ? "bg-amber-950/30 text-amber-400 font-bold" : "opacity-60"}`}
            >
              Log
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveTab("write"); }}
              className={`px-2.5 py-1 rounded-sm cursor-pointer transition-colors ${activeTab === "write" ? "bg-amber-950/30 text-amber-400 font-bold" : "opacity-60"}`}
            >
              Write
            </button>
          </div>
        )}

        {/* Trust meter — visible when open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1.5 overflow-hidden"
            >
              <span className="text-amber-900/50">|</span>
              <span className="text-amber-700/60 text-[9px] tracking-widest uppercase hidden xs:inline">Trust</span>
              <div className="w-12 sm:w-20 h-1.5 bg-amber-950/20 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  animate={{ width: riddleState.trustScore + "%", backgroundColor: riddleEmotion === "hostile" ? "#991b1b" : riddleEmotion === "pleased" ? "#166534" : "#92400e" }}
                  style={{ width: trustSpring.get() + "%" }}
                  transition={{ type: "spring", stiffness: 50, damping: 18 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pensieve Mode Trigger - visible when open */}
        {isOpen && !hasSlashed && (
          <>
            <span className="text-amber-900/50">|</span>
            <motion.button
              onClick={() => {
                setShowPensieve(true);
                setPensieveStep(0);
                audio.playPensieveSwell();
              }}
              whileHover={{ scale: 1.06, color: "#60a5fa" }}
              whileTap={{ scale: 0.94 }}
              className="cursor-pointer transition-colors hover:text-blue-400 flex items-center gap-1"
            >
              <span>Pensieve</span>
            </motion.button>
          </>
        )}

        <span className="text-amber-900/50">|</span>
        <motion.button
          onClick={() => {
            setShowRulebook(true);
            audio.playScratch(80, true);
          }}
          whileHover={{ scale: 1.06, color: "#f59e0b" }}
          whileTap={{ scale: 0.94 }}
          className="cursor-pointer transition-colors hover:text-amber-400 flex items-center gap-1"
        >
          <span>Scroll</span>
        </motion.button>

        <span className="text-amber-900/50">|</span>
        <motion.button onClick={handleReset} whileHover={{ scale: 1.06, color: "#f59e0b" }} whileTap={{ scale: 0.94 }} className="cursor-pointer transition-colors">
          <span className="hidden sm:inline">Reset Diary</span>
          <span className="sm:hidden">Reset</span>
        </motion.button>
      </motion.div>

      {/* ── Book scene ── */}
      <div className="relative w-full h-full flex items-center justify-center px-4">

        {/* CLOSED COVER */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -90, scale: 0.9, x: -60, transition: { duration: 0.4, ease: "easeIn" as const } }}
              onClick={handleCoverClick}
              onMouseMove={handleCoverMouseMove}
              onMouseLeave={handleCoverMouseLeave}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform" }}
              transition={{ duration: 0.55, ease: "easeOut" as const }}
              className={`absolute w-full max-w-[340px] xs:max-w-[420px] sm:max-w-[450px] md:w-[480px] h-auto aspect-[480/650] md:h-[650px] cursor-pointer select-none ${hasSlashed ? "book-slashed-left" : ""}`}
            >
              {/* PAGE EDGES BLOCK (underneath the cover for 3D depth) */}
              <div className="absolute inset-0 translate-x-[4px] translate-y-[6px] sm:translate-x-[6px] sm:translate-y-[8px] rounded-r-md rounded-b-md bg-[#eaddb6] border-r-[3px] border-b-[4px] border-[#bda674] shadow-[15px_20px_40px_rgba(0,0,0,0.85)] z-0" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(139,115,85,0.1) 2px, rgba(139,115,85,0.1) 4px)" }}>
                {/* Yellow bookmark ribbon peeking out bottom */}
                <div className="absolute bottom-[-10px] left-12 w-4 h-6 bg-[#d9ad36] rounded-b-sm border-x border-b border-[#a87c1c] shadow-md z-0" />
              </div>

              {/* MAIN LEATHER COVER */}
              <div className="absolute inset-0 leather-cover rounded-sm flex flex-col items-center justify-between py-6 sm:py-10 px-6 sm:px-8 z-10 border border-[#2a2622]">
              <BrassCorner position="tl" />
              <BrassCorner position="tr" />
              <BrassCorner position="bl" />
              <BrassCorner position="br" />
              <div className="absolute inset-[2px] rounded-sm border border-white/[0.03] pointer-events-none" />

              <div className="flex-1 flex items-center justify-center w-full relative">
                {/* Render dynamically added burn scars on cover */}
                {burnScars.filter((s) => s.side === "cover").map((scar, idx) => (
                  <div
                    key={idx}
                    className="absolute w-24 h-24 pointer-events-none z-10 animate-pulse"
                    style={{ left: `${scar.x}%`, top: `${scar.y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-95">
                      <defs>
                        <radialGradient id={`scarGrad-${idx}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#030302" stopOpacity="1"/>
                          <stop offset="45%" stopColor="#0d0a07" stopOpacity="1"/>
                          <stop offset="75%" stopColor="#251608" stopOpacity="0.85"/>
                          <stop offset="100%" stopColor="#2a1a0a" stopOpacity="0"/>
                        </radialGradient>
                      </defs>
                      <circle cx="50" cy="50" r="44" fill={`url(#scarGrad-${idx})`} />
                      <circle cx="50" cy="50" r="8" fill="#000000" />
                      <path d="M50,50 L46,12 M50,50 L88,44 M50,50 L54,88 M50,50 L12,56 M50,50 L28,28 M50,50 L72,72" stroke="#100a05" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                      <path d="M50,50 L48,22 M50,50 L78,46 M50,50 L52,78 M50,50 L22,54" stroke="#5f3510" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    </svg>
                  </div>
                ))}
              </div>

              <div className="w-full px-4 sm:px-6 pb-6 sm:pb-8 flex flex-col items-center relative z-20">
                <motion.div className="nameplate w-auto inline-block py-2 sm:py-3 px-4 sm:px-10 border-[1.5px] border-[#e8c460] bg-[#1a1816] flex items-center justify-center font-cinzel font-bold text-[9px] xs:text-[11px] sm:text-base tracking-[0.25em] text-[#e8c460] rounded-[1px] shadow-[inset_0_0_10px_rgba(0,0,0,0.9),_0_6px_15px_rgba(0,0,0,0.8)]"
                  animate={{ textShadow: ["0 0 6px rgba(201,160,48,0.2)", "0 0 12px rgba(201,160,48,0.5)", "0 0 6px rgba(201,160,48,0.2)"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {hasSlashed ? "DESTROYED" : "TOM MARVOLO RIDDLE"}
                </motion.div>
                <motion.p className="text-[8px] sm:text-[9px] text-[#e8c460]/30 font-cinzel tracking-[0.25em] uppercase text-center mt-4 drop-shadow-md"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  {hasSlashed ? "Stitch memories with Reset" : activeProp === "fang" ? "Click cover to stab" : activeProp === "sword" ? "Click cover to slash" : "Click to open"}
                </motion.p>
              </div>
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
              className="w-full max-w-[480px] md:max-w-[960px] h-[75vh] min-h-[500px] max-h-[650px] md:h-[650px] flex rounded-sm shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden relative mx-4 md:mx-0"
            >
              {/* LEFT PAGE — Dialogue History */}
              <motion.div
                ref={leftPageRef}
                custom={0} variants={pageVariants} initial="hidden" animate="visible"
                onClick={(e) => { if (activeProp === "fang" || activeProp === "sword") handlePageClick(e, "left-page"); }}
                onMouseMove={handleMouseMoveLumos}
                className={`${activeTab === "history" ? "flex" : "hidden md:flex"} w-full md:w-1/2 h-full parchment parchment-page-left flex flex-col justify-between p-4 sm:p-8 md:p-10 select-none relative overflow-hidden ${hasSlashed ? "book-slashed-left" : ""} ${ringDragging ? "ring-reveal-cursor" : ""}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/8 via-transparent to-amber-950/15 pointer-events-none" />

                {/* 💍 Ring secret reveal */}
                {ringDragging && ringRevealPos && pageRects && (
                  <div
                    className="absolute inset-0 pointer-events-none z-25 p-8 flex flex-col gap-4 overflow-hidden font-parchment italic"
                    style={{
                      color: "rgba(60, 30, 5, 0.9)",
                      WebkitMaskImage: `radial-gradient(circle 120px at ${ringRevealPos.x - pageRects.left.left}px ${ringRevealPos.y - pageRects.left.top}px, black 30%, rgba(0,0,0,0.5) 65%, transparent 100%)`,
                      maskImage: `radial-gradient(circle 120px at ${ringRevealPos.x - pageRects.left.left}px ${ringRevealPos.y - pageRects.left.top}px, black 30%, rgba(0,0,0,0.5) 65%, transparent 100%)`,
                    }}
                  >
                    <p className="text-[13px] leading-relaxed text-center mt-6 font-bold drop-shadow-md">
                      &ldquo;I have been careless. I have left more traces than I intended. This diary—if found—reveals too much. Destroy it before they come for you.&rdquo;
                      <span className="block font-cinzel text-[9px] tracking-widest uppercase mt-2 not-italic font-normal">— T.M. Riddle, Private Note</span>
                    </p>
                    <p className="text-[12.5px] leading-relaxed text-center mt-4 font-bold drop-shadow-md">
                      &ldquo;They have been writing to me every night. They do not know how much of themselves they are pouring away. Soon there will be enough of them in me... and enough of me in them.&rdquo;
                      <span className="block font-cinzel text-[9px] tracking-widest uppercase mt-1 not-italic font-normal">— Entry, November 1942</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-center mt-2 font-bold drop-shadow-md">
                      The Chamber lies beneath the school.<br />Speak to the serpent. She will open.
                    </p>
                  </div>
                )}

                {/* Glowing Parseltongue Runes on margins */}
                {riddleEmotion === "hostile" && (
                  <div className="absolute left-2 top-10 bottom-10 flex flex-col justify-between runic-text text-[10px] sm:text-xs select-none pointer-events-none z-20">
                    <span>s</span><span>s</span><span>s</span><span>h</span><span>e</span><span>i</span><span>r</span><span>s</span>
                  </div>
                )}

                {/* Resurrection Stone Ghost warning on left page */}
                {stoneOnBook && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-15 p-6 text-center">
                    <p className="ghost-shimmer-text font-parchment text-lg sm:text-xl font-bold leading-relaxed max-w-[200px]">
                      &ldquo;He writes lies... Do not believe him.&rdquo;
                      <span className="text-[9px] uppercase font-cinzel tracking-widest block mt-2 text-blue-300/70">— Ginny Weasley</span>
                    </p>
                  </div>
                )}

                {/* Render page stabs */}
                {burnScars.filter((s) => s.side === "left-page").map((scar, idx) => (
                  <div
                    key={idx}
                    className="absolute w-20 h-20 pointer-events-none z-20"
                    style={{ left: `${scar.x}%`, top: `${scar.y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-90">
                      <circle cx="50" cy="50" r="28" fill="#150f08" opacity="0.95" />
                      <circle cx="50" cy="50" r="8" fill="#000" />
                      <path d="M50,50 L48,20 M50,50 L80,48 M50,50 L52,80 M50,50 L20,52" stroke="#482508" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                ))}

                <div className={`flex flex-col gap-4 mt-2 relative z-10 h-full transition-opacity duration-300 ${ringDragging ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                  <div className="flex flex-col pb-3 border-b border-amber-950/20">
                    <h3 className="font-cinzel text-amber-950 text-sm sm:text-base tracking-[0.25em] font-bold uppercase">T. M. Riddle</h3>
                    <span className="text-[8px] sm:text-[9px] font-cinzel text-amber-950/60 tracking-[0.3em] mt-0.5 uppercase">London, 1943 — Private Diary</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-5 font-parchment text-[14px] sm:text-[15px] leading-relaxed custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {dialogueHistory.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                          className="italic text-amber-950/50 mt-10 text-center text-sm leading-loose px-2"
                        >
                          "I do not mind sharing my diary with you.<br />Some secrets are far too heavy to keep alone..."
                        </motion.div>
                      ) : (
                        dialogueHistory.map((item, idx) => <DialogueRow key={idx} item={item} />)
                      )}
                    </AnimatePresence>
                    <div ref={historyEndRef} />
                  </div>
                </div>

                <div className="text-[9px] text-amber-950/50 font-cinzel tracking-[0.15em] xs:tracking-[0.3em] flex justify-between relative z-10 pt-2 border-t border-amber-950/20">
                  <span>LONDON, 1943</span><span>PAGE LVII</span>
                </div>
              </motion.div>

              {/* Spine */}
              <div className="hidden md:block w-8 h-full spine-shadow absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 z-20 pointer-events-none" />

              {/* RIGHT PAGE — Interactive writing area */}
              <motion.div
                ref={rightPageRef}
                custom={1} variants={pageVariants} initial="hidden" animate="visible"
                onClick={(e) => {
                  if (activeProp === "fang" || activeProp === "sword") {
                    handlePageClick(e, "right-page");
                  } else {
                    handleRightPageClick();
                  }
                }}
                onMouseMove={handleMouseMoveLumos}
                className={`${activeTab === "write" ? "flex" : "hidden md:flex"} w-full md:w-1/2 h-full parchment parchment-page-right flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden ${hasSlashed ? "book-slashed-right" : ""} ${ringDragging ? "ring-reveal-cursor" : ""} ${lumosActive ? "lumos-active-cursor" : ""} ${(riddleText && !isRiddleWriting) || activeProp === "fang" || activeProp === "sword" ? "cursor-pointer" : ""}`}
              >
                <div className="absolute inset-0 bg-gradient-to-bl from-amber-950/8 via-transparent to-amber-950/15 pointer-events-none" />

                {/* 💍 Ring secret reveal */}
                {ringDragging && ringRevealPos && pageRects && (
                  <div
                    className="absolute inset-0 pointer-events-none z-25 p-8 flex flex-col gap-5 overflow-hidden font-parchment italic"
                    style={{
                      color: "rgba(60, 30, 5, 0.9)",
                      WebkitMaskImage: `radial-gradient(circle 120px at ${ringRevealPos.x - pageRects.right.left}px ${ringRevealPos.y - pageRects.right.top}px, black 30%, rgba(0,0,0,0.5) 65%, transparent 100%)`,
                      maskImage: `radial-gradient(circle 120px at ${ringRevealPos.x - pageRects.right.left}px ${ringRevealPos.y - pageRects.right.top}px, black 30%, rgba(0,0,0,0.5) 65%, transparent 100%)`,
                    }}
                  >
                    <p className="text-[13.5px] leading-relaxed text-center mt-4 font-bold drop-shadow-md">
                      &ldquo;I am more than memory. I am a piece of soul, preserved in ink. Whoever holds this diary holds a fragment of the Dark Lord himself.&rdquo;
                      <span className="block font-cinzel text-[9px] tracking-widest uppercase mt-2 not-italic font-normal">— T.M. Riddle</span>
                    </p>
                    <p className="text-[12.5px] leading-relaxed text-center mt-3 font-bold drop-shadow-md">
                      &ldquo;There are seven parts to a soul. I have already begun. The ring, the locket, the cup, the snake... only two remain.&rdquo;
                      <span className="block font-cinzel text-[9px] tracking-widest uppercase mt-1 not-italic font-normal">— Private Calculation, 1945</span>
                    </p>
                    <p className="text-[11.5px] leading-relaxed text-center mt-2 font-bold drop-shadow-md">
                      <strong>Slytherin&apos;s Heir shall rise again.</strong><br />
                      The Dark Lord cannot die.<br />
                      He has made himself immortal.
                    </p>
                  </div>
                )}

                {/* Glowing Parseltongue Runes on margins */}
                {riddleEmotion === "hostile" && (
                  <div className="absolute right-2 top-10 bottom-10 flex flex-col justify-between runic-text text-[10px] sm:text-xs select-none pointer-events-none z-20">
                    <span>s</span><span>s</span><span>l</span><span>y</span><span>t</span><span>h</span><span>e</span><span>r</span><span>s</span>
                  </div>
                )}

                {/* Resurrection Stone Ghost warning on right page */}
                {stoneOnBook && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-15 p-6 text-center">
                    <p className="ghost-shimmer-text font-parchment text-lg sm:text-xl font-bold leading-relaxed max-w-[200px]">
                      &ldquo;His name was Riddle... He took my soul.&rdquo;
                      <span className="text-[9px] uppercase font-cinzel tracking-widest block mt-2 text-blue-300/70">— G. Weasley</span>
                    </p>
                  </div>
                )}

                {/* Render page stabs */}
                {burnScars.filter((s) => s.side === "right-page").map((scar, idx) => (
                  <div
                    key={idx}
                    className="absolute w-20 h-20 pointer-events-none z-20"
                    style={{ left: `${scar.x}%`, top: `${scar.y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-90">
                      <circle cx="50" cy="50" r="28" fill="#150f08" opacity="0.95" />
                      <circle cx="50" cy="50" r="8" fill="#000" />
                      <path d="M50,50 L48,20 M50,50 L80,48 M50,50 L52,80 M50,50 L20,52" stroke="#482508" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                ))}

                {/* Main Content Wrapper (Fades out when Ring reveals secrets) */}
                <div className={`flex flex-col h-full relative z-10 transition-opacity duration-300 ${ringDragging ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                  {/* Top Controls */}
                <div className="flex justify-between items-center z-30 relative px-2 pt-1 opacity-50 hover:opacity-100 transition-opacity duration-500">
                  <div className="flex gap-4 font-cinzel text-[10px] sm:text-xs tracking-[0.25em] uppercase">
                    {(["type", "draw"] as const).map((mode) => (
                      <motion.button
                        key={mode}
                        onClick={(e) => { e.stopPropagation(); setInputMode(mode); if (mode === "type") setHasDrawn(false); else setUserText(""); }}
                        className={`transition-all duration-300 ${inputMode === mode ? "text-amber-950 font-bold border-b border-amber-950/40 pb-0.5" : "text-amber-950/40 hover:text-amber-950/70"}`}
                      >
                        {mode === "type" ? "Quill" : "Inkwell"}
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
                      className="text-[8px] sm:text-[9px] uppercase font-cinzel tracking-[0.3em] text-amber-950/60 font-bold"
                    >
                      <span className="hidden xs:inline">
                        {isThinking ? "Reaching into memory..." : isRiddleWriting ? "Tom is writing..." : isTextFading || isCanvasFading ? "Absorbing ink..." : "Awaiting ink"}
                      </span>
                      <span className="xs:hidden">
                        {isThinking ? "Reaching..." : isRiddleWriting ? "Writing..." : isTextFading || isCanvasFading ? "Absorbing..." : "Awaiting"}
                      </span>
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
                              className="w-full h-full flex flex-col justify-between"
                            >
                              <textarea
                                value={userText}
                                onChange={(e) => setUserText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={lumosActive ? "Type 'nox' to extinguish the light..." : "Write in the diary... (Press Enter to pour ink)"}
                                disabled={isRiddleWriting}
                                className="w-full flex-1 bg-transparent text-amber-950 font-parchment text-[19px] leading-loose placeholder-amber-950/25 border-none resize-none focus:outline-none focus:ring-0 font-medium quill-cursor p-4"
                              />
                              <div className="flex justify-end p-3 absolute bottom-3 right-3 pointer-events-none">
                                <motion.button type="submit" disabled={!userText.trim() || isRiddleWriting || isTextFading}
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  className="pointer-events-auto text-amber-950/90 hover:text-amber-950 border border-amber-900/25 hover:border-amber-900/50 bg-amber-950/5 hover:bg-amber-950/10 px-5 py-2 rounded-md font-cinzel text-[10px] font-bold tracking-[0.2em] disabled:opacity-40 disabled:hover:bg-amber-950/5 disabled:hover:border-amber-900/25 disabled:cursor-not-allowed transition-all duration-500 uppercase cursor-pointer backdrop-blur-[2px]"
                                >
                                  Pour Ink
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

                        {/* Emerald trailing particles */}
                        {activeInk === "emerald" && emeraldParticles.map((p) => (
                          <motion.div
                            key={p.id}
                            className="emerald-particle"
                            style={{ left: p.x, top: p.y }}
                            initial={{ scale: 1.2, opacity: 0.95 }}
                            animate={{ scale: 0.1, opacity: 0 }}
                            transition={{ duration: 0.7 }}
                          />
                        ))}

                        {/* Canvas */}
                        <motion.canvas ref={canvasRef}
                          onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing}
                          animate={{ opacity: isCanvasFading ? 0 : 1, filter: isCanvasFading ? "blur(8px)" : "blur(0px)" }}
                          transition={{ duration: 1.5 }}
                          className={`w-full h-full bg-transparent ink-draw-cursor z-10 ${activeInk === 'invisible' ? 'invisible-ink-hidden' : ''} ${riddleText ? "hidden" : "block"}`}
                          style={activeInk === 'venom' ? { filter: 'drop-shadow(0 0 3px #dc2626)' } : {}}
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

                        {/* Finger/Mouse hint */}
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
                </div>
              </div>
              {/* Bottom page marker */}
              <div className="text-[9px] text-amber-950/50 font-cinzel tracking-[0.12em] xs:tracking-[0.3em] flex justify-between relative z-10 pt-2 border-t border-amber-950/20">
                <span>PAGE LVIII</span>
                <span>PROPERTY OF T. M. Riddle</span>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
           {/* ── SPELLS & RULES SCROLL ── */}
      <div className="fixed top-4 sm:top-6 right-2 sm:right-6 lg:right-10 z-40 flex flex-col items-center gap-1.5 select-none scale-60 sm:scale-80 lg:scale-100 origin-top-right">
        <motion.div
          whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0], filter: "brightness(1.15) drop-shadow(0 0 10px rgba(245,158,11,0.35))" }}
          onClick={() => {
            setShowRulebook(true);
            audio.playScratch(80, true);
          }}
          className="p-2.5 sm:p-3 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer bg-zinc-900/40 border border-amber-950/20 backdrop-blur-md shadow-lg"
        >
          <svg viewBox="0 0 80 80" className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300">
            <path d="M20,20 C20,20 30,15 45,15 C60,15 65,22 65,22 L65,58 C65,58 60,50 45,50 C30,50 20,55 20,55 Z" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
            <path d="M20,20 C10,20 10,25 20,25 C30,25 30,20 20,20" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <path d="M20,55 C10,55 10,60 20,60 C30,60 30,55 20,55" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <path d="M65,22 C75,22 75,27 65,27 C55,27 55,22 65,22" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <path d="M65,58 C75,58 75,63 65,63 C55,63 55,58 65,58" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <rect x="38" y="15" width="4" height="35" rx="1" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
          </svg>
        </motion.div>
        <span className="font-cinzel font-bold text-[10px] sm:text-[11px] text-[#e8c460]/90 tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-opacity hover:text-[#e8c460]">
          Rules
        </span>
      </div>

      {/* ── MAGICAL TOOLS DOCK ── */}
      <div className="fixed -left-4 xs:left-0 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-6 bg-zinc-950/60 border border-amber-950/40 py-6 px-3 rounded-full backdrop-blur-md shadow-2xl select-none scale-[0.55] xs:scale-70 sm:scale-90 lg:scale-100 origin-left">
        
        <span className="font-cinzel font-bold text-[9px] text-amber-500/80 uppercase tracking-[0.25em] pb-1 border-b border-amber-950/30">Artifacts</span>

        {/* Basilisk Fang */}
        <div className="flex flex-col items-center gap-1 group relative">
          <motion.div
            whileHover={{ scale: 1.1, filter: "brightness(1.1) drop-shadow(0 0 10px rgba(34,197,94,0.3))" }}
            onClick={() => setActiveProp((prev) => (prev === "fang" ? "none" : "fang"))}
            className={`cursor-pointer transition-all duration-300 rounded-full p-2 ${activeProp === "fang" ? "bg-green-950/40 ring-1 ring-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "hover:bg-amber-950/20"}`}
          >
            <svg viewBox="0 0 100 300" className="w-6 h-16 transition-transform duration-300 drop-shadow-xl" style={{ transform: activeProp === "fang" ? "rotate(-10deg) scale(1.05)" : "none" }}>
              <defs>
                <linearGradient id="fangBone" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e6e1d1" />
                  <stop offset="50%" stopColor="#fffae6" />
                  <stop offset="100%" stopColor="#b3ac96" />
                </linearGradient>
                <linearGradient id="venomDrip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="1" />
                </linearGradient>
                <filter id="venomGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Base Fang */}
              <path d="M 35,10 C 65,15 75,50 70,100 C 65,150 50,220 40,280 C 40,290 35,295 30,295 C 25,295 20,290 18,280 C 15,240 10,180 15,100 C 18,50 20,15 35,10 Z" fill="url(#fangBone)" stroke="#78716c" strokeWidth="1" />
              {/* Ridges and details */}
              <path d="M 35,10 C 45,50 50,150 35,250" fill="none" stroke="#d6d3d1" strokeWidth="2" strokeDasharray="5,15" opacity="0.6" />
              <path d="M 25,20 C 30,80 35,160 25,260" fill="none" stroke="#78716c" strokeWidth="1.5" opacity="0.4" />
              <path d="M 50,30 C 55,100 50,180 40,240" fill="none" stroke="#a8a29e" strokeWidth="1.5" opacity="0.5" />
              {/* Venom Base */}
              <path d="M 35,180 C 45,210 40,260 30,295 C 20,260 25,210 35,180 Z" fill="url(#venomDrip)" filter="url(#venomGlow)" opacity="0.9" />
              {/* Venom Drips */}
              <circle cx="28" cy="285" r="4" fill="#10b981" filter="url(#venomGlow)" />
              <path d="M 28,285 L 28,300 C 28,303 32,303 32,300 L 32,285 Z" fill="#047857" />
              <circle cx="35" cy="270" r="3" fill="#34d399" filter="url(#venomGlow)" />
            </svg>
          </motion.div>
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 font-cinzel font-bold text-[11px] text-[#e8c460]/90 tracking-widest uppercase opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap drop-shadow-md transition-opacity">
            {activeProp === "fang" ? "Armed" : "Basilisk Fang"}
          </div>
        </div>

        {/* Gryffindor Sword */}
        <div className="flex flex-col items-center gap-1 group relative">
          <motion.div
            whileHover={{ scale: 1.05, filter: "brightness(1.15)" }}
            onClick={() => setActiveProp((prev) => (prev === "sword" ? "none" : "sword"))}
            className={`w-10 h-32 flex items-center justify-center cursor-pointer rounded-full transition-all duration-300 ${activeProp === "sword" ? "bg-red-950/30 ring-1 ring-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "hover:bg-amber-950/20"}`}
          >
            <svg viewBox="0 0 60 220" className="w-8 h-28 transition-transform duration-300 self-center drop-shadow-2xl" style={{ transform: activeProp === "sword" ? "rotate(2deg) scale(1.05)" : "none" }}>
              <defs>
                <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="30%" stopColor="#f8fafc" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="70%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="hiltGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <filter id="rubyGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Blade */}
              <path d="M 27,60 L 33,60 L 33,190 L 30,215 L 27,190 Z" fill="url(#blade)" stroke="#64748b" strokeWidth="0.5" />
              {/* Blade fuller (middle groove) */}
              <line x1="30" y1="65" x2="30" y2="180" stroke="#475569" strokeWidth="1" opacity="0.6" />
              {/* Crossguard */}
              <path d="M 10,60 C 15,55 45,55 50,60 C 55,65 5,65 10,60 Z" fill="url(#hiltGold)" stroke="#78350f" strokeWidth="1" />
              <path d="M 5,60 C 0,55 0,50 5,45 C 10,50 10,55 5,60 Z" fill="url(#hiltGold)" stroke="#78350f" strokeWidth="0.5" />
              <path d="M 55,60 C 60,55 60,50 55,45 C 50,50 50,55 55,60 Z" fill="url(#hiltGold)" stroke="#78350f" strokeWidth="0.5" />
              {/* Handle */}
              <rect x="25" y="25" width="10" height="35" rx="2" fill="#450a0a" stroke="#78350f" strokeWidth="1" />
              {/* Handle wrap lines */}
              {[...Array(6)].map((_, i) => (
                <line key={i} x1="25" y1={30 + i * 5} x2="35" y2={33 + i * 5} stroke="#d97706" strokeWidth="1" opacity="0.8" />
              ))}
              {/* Pommel */}
              <circle cx="30" cy="18" r="8" fill="url(#hiltGold)" stroke="#78350f" strokeWidth="1" />
              {/* Rubies */}
              <circle cx="30" cy="18" r="4" fill="#dc2626" filter="url(#rubyGlow)" />
              <circle cx="30" cy="58" r="3" fill="#dc2626" filter="url(#rubyGlow)" />
              <circle cx="15" cy="58" r="2" fill="#dc2626" filter="url(#rubyGlow)" />
              <circle cx="45" cy="58" r="2" fill="#dc2626" filter="url(#rubyGlow)" />
            </svg>
          </motion.div>
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 font-cinzel font-bold text-[11px] text-[#e8c460]/90 tracking-widest uppercase opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap drop-shadow-md transition-opacity">
            {activeProp === "sword" ? "Armed" : "Sword"}
          </div>
        </div>

        {/* Gaunt's Ring */}
        <div className="flex flex-col items-center gap-1 group relative">
          {activeProp === "ring" && smokeParticles.map((p) => (
            <motion.div
              key={p.id}
              className="smoke-particle"
              style={{ left: `calc(50% + ${p.x}px)`, bottom: `30px` }}
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ y: -60, x: p.x + (Math.random() - 0.5) * 15, scale: 2, opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
          ))}
          <motion.div
            drag
            dragSnapToOrigin
            whileHover={{ scale: 1.15, rotate: [0, -3, 3, 0], filter: "brightness(1.1)" }}
            whileDrag={{ scale: 1.25, rotate: 10, filter: "brightness(1.3)" }}
            onHoverStart={() => {
              if (ringChimeRef.current) clearTimeout(ringChimeRef.current);
              ringChimeRef.current = setTimeout(() => audio.playRingChime(), 80);
            }}
            onDragStart={() => {
              setActiveProp("ring");
              setRingDragging(true);
              audio.playRingChime();
              setPageRects({
                left: leftPageRef.current?.getBoundingClientRect() || { left: 0, top: 0 },
                right: rightPageRef.current?.getBoundingClientRect() || { left: 0, top: 0 },
              });
            }}
            onDrag={(e, info) => {
              setRingRevealPos({ x: info.point.x, y: info.point.y });
            }}
            onDragEnd={() => {
              setRingDragging(false);
              setRingRevealPos(null);
              setActiveProp("none");
            }}
            className={`p-2 rounded-full transition-colors duration-300 flex items-center justify-center cursor-grab active:cursor-grabbing ${
              activeProp === "ring" ? "bg-amber-950/50 ring-1 ring-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "hover:bg-amber-950/20"
            }`}
            style={{ zIndex: ringDragging ? 50 : 35 }}
          >
            <svg viewBox="0 0 100 100" className="w-10 h-10 transition-transform duration-300 drop-shadow-2xl">
              <defs>
                <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="25%" stopColor="#d97706" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="75%" stopColor="#92400e" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
                <linearGradient id="stoneGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3f3f46" />
                  <stop offset="50%" stopColor="#09090b" />
                  <stop offset="100%" stopColor="#18181b" />
                </linearGradient>
                <filter id="stoneShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.8" />
                </filter>
              </defs>
              {/* Outer band */}
              <path d="M 25,50 C 25,20 75,20 75,50 C 75,80 25,80 25,50 Z" fill="none" stroke="url(#ringGold)" strokeWidth="12" />
              {/* Inner band shadow */}
              <path d="M 31,50 C 31,28 69,28 69,50 C 69,72 31,72 31,50 Z" fill="none" stroke="#451a03" strokeWidth="2" opacity="0.6" />
              {/* Stone Setting */}
              <path d="M 35,28 L 65,28 L 55,40 L 45,40 Z" fill="url(#ringGold)" stroke="#78350f" strokeWidth="1" />
              {/* Resurrection Stone (Diamond/Hexagon shape) */}
              <polygon points="50,15 68,32 50,48 32,32" fill="url(#stoneGlow)" stroke="#52525b" strokeWidth="1" filter="url(#stoneShadow)" />
              {/* Stone facets */}
              <polygon points="50,22 60,32 50,40 40,32" fill="#27272a" opacity="0.8" />
              <line x1="50" y1="15" x2="50" y2="22" stroke="#52525b" strokeWidth="0.5" />
              <line x1="50" y1="48" x2="50" y2="40" stroke="#52525b" strokeWidth="0.5" />
              <line x1="32" y1="32" x2="40" y2="32" stroke="#52525b" strokeWidth="0.5" />
              <line x1="68" y1="32" x2="60" y2="32" stroke="#52525b" strokeWidth="0.5" />
              {/* Deathly Hallows Symbol (faint gold) */}
              <g stroke="#d97706" strokeWidth="0.8" fill="none" opacity="0.6">
                <polygon points="50,25 58,38 42,38" />
                <circle cx="50" cy="33.5" r="4.5" />
                <line x1="50" y1="25" x2="50" y2="38" />
              </g>
            </svg>
          </motion.div>
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 font-cinzel font-bold text-[11px] text-[#e8c460]/90 tracking-widest uppercase opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap drop-shadow-md transition-opacity">
            {ringDragging ? "Revealing..." : activeProp === "ring" ? "Drag on Page" : "Gaunt's Ring"}
          </div>
        </div>

        {/* Inkwells (Only when open) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center gap-4 pt-2 overflow-hidden w-full"
            >
              <div className="w-6 h-px bg-amber-950/50" />
              <span className="font-cinzel font-bold text-[9px] text-amber-500/80 uppercase tracking-[0.25em]">Inks</span>
              {[
                { type: "standard", color: "bg-zinc-950 border-zinc-700", name: "Standard" },
                { type: "invisible", color: "bg-amber-100/30 border-amber-200/50", name: "Invisible" },
                { type: "venom", color: "bg-amber-950 border-orange-800", name: "Venom" },
                { type: "emerald", color: "bg-emerald-950 border-emerald-500", name: "Emerald" }
              ].map((ink) => (
                <div key={ink.type} className="group relative flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setActiveInk(ink.type as any);
                      if (ink.type === "invisible") {
                        setLumosActive(true);
                        audio.playLumos();
                      } else {
                        setLumosActive(false);
                      }
                    }}
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all ${ink.color} ${
                      activeInk === ink.type ? "ring-2 ring-amber-500 scale-110 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "opacity-70 hover:opacity-100"
                    }`}
                  />
                  <div className="absolute left-full ml-4 font-cinzel font-bold text-[11px] text-[#e8c460]/90 tracking-widest uppercase opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap drop-shadow-md transition-opacity">
                    {ink.name}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Magical Instructions Scroll Overlay */}
      <AnimatePresence>
        {showRulebook && (
          <div className="fixed inset-0 z-500 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotate: 2 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="scroll-modal-container w-full max-w-[95%] sm:max-w-lg p-4 sm:p-8 rounded-xl max-h-[85vh] overflow-y-auto flex flex-col gap-4 sm:gap-5 text-amber-950 font-sans"
            >
              <div className="flex justify-between items-center border-b-2 border-amber-900/35 pb-3">
                <h2 className="font-cinzel font-bold text-base sm:text-lg tracking-wider text-amber-900">
                  📜 Spells & Secrets Scroll
                </h2>
                <button
                  onClick={() => {
                    setShowRulebook(false);
                    audio.playScratch(80, true);
                  }}
                  className="font-cinzel hover:text-red-800 transition-colors font-bold text-xs uppercase tracking-wider px-2.5 py-1 border border-amber-900/40 rounded hover:bg-amber-950/5 cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-5 text-sm sm:text-base leading-relaxed overflow-y-auto pr-1 text-amber-950 font-medium pb-4">
                <div>
                  <h3 className="font-cinzel font-bold text-amber-900 mb-1 border-b border-amber-900/15 pb-0.5">✒️ Pouring Ink</h3>
                  <p>Choose your tool at the top of the diary:</p>
                  <ul className="list-disc pl-5 flex flex-col gap-1 mt-1">
                    <li><strong>Quill Mode:</strong> Type in the text input area and press &quot;Pour Ink&quot; to write to Tom.</li>
                    <li><strong>Inkwell Mode:</strong> Draw freehand lines directly on the page with your mouse or stylus.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-cinzel font-bold text-amber-900 mb-1 border-b border-amber-900/15 pb-0.5">🎨 Custom Inks</h3>
                  <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1">
                    <li><strong>Standard:</strong> Classic dark charcoal ink that reacts to Riddle's state.</li>
                    <li><strong>Invisible:</strong> Ink fades immediately. Switch to <strong>Lumos</strong> to reveal hidden words via a circular flashlight cursor.</li>
                    <li><strong>Basilisk Venom:</strong> Corrosive red ink that burns the margins.</li>
                    <li><strong>Emerald Glow:</strong> Green glowing trail that spawns trailing magical stardust.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-cinzel font-bold text-amber-900 mb-1 border-b border-amber-900/15 pb-0.5">🔮 Interactive Objects</h3>
                  <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1">
                    <li><strong>Basilisk Fang:</strong> Click to arm. Click the diary cover or pages to stab it, draining Riddle's trust.</li>
                    <li><strong>Sword of Gryffindor:</strong> Click to arm. Click anywhere to slash and split the book apart, disrupting Riddle's connections.</li>
                    <li><strong>Gaunt's Ring:</strong> <strong>Click and drag</strong> the ring directly over the diary pages to reveal Riddle's invisible secrets. When released, it returns to its spot. You can also <strong>Pry the Stone</strong> and place it on the page to summon Ginny's ghost.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-cinzel font-bold text-amber-900 mb-1 border-b border-amber-900/15 pb-0.5">💫 Magical Spells</h3>
                  <p>Type these spells in the input bar to activate them directly in the UI:</p>
                  <ul className="list-disc pl-5 flex flex-col gap-1 mt-1 font-mono text-[10px] sm:text-xs">
                    <li><strong>&quot;lumos&quot;</strong> / <strong>&quot;nox&quot;</strong> - Activates/Extinguishes flashlight cursor & Invisible Ink.</li>
                    <li><strong>&quot;avada kedavra&quot;</strong> - Flashes green screen, plays scream, slams book shut.</li>
                    <li><strong>&quot;crucio&quot;</strong> - Triggers red screen shake pain flash.</li>
                    <li><strong>&quot;serpensortia&quot;</strong> - Conjures Parseltongue snake hiss & scales border.</li>
                    <li><strong>Thematic Spells:</strong> &quot;expelliarmus&quot;, &quot;stupefy&quot;, &quot;protego&quot;, &quot;sectumsempra&quot;, &quot;wingardium leviosa&quot;, &quot;alohomora&quot;, &quot;riddikulus&quot;, &quot;accio&quot;, &quot;obliviate&quot; — Tom blocks them immediately!</li>
                  </ul>
                  <p className="mt-1.5">Type hissed characters (e.g. <strong>&quot;ssss&quot;</strong>) to trigger Parseltongue responses.</p>
                </div>

                <div>
                  <h3 className="font-cinzel font-bold text-amber-900 mb-1 border-b border-amber-900/15 pb-0.5">🌀 The Pensieve</h3>
                  <p>Click the <strong>Pensieve</strong> button in the open book header to project yourself into a memory of 1943. Tread carefully—the wrong choices will trigger Tom Riddle's wrath and force-eject you, while matching Salazar's bloodline will unlock his absolute secrets.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pensieve Mode Overlay */}
      {showPensieve && (
        <div className="fixed inset-0 z-500 pensieve-container flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="pensieve-film-grain" />
          <div className="pensieve-scratch" style={{ animationDelay: "0.5s" }} />
          <div className="pensieve-scratch" style={{ animationDelay: "1.8s" }} />
          
          <div className="w-full max-w-[95%] sm:max-w-lg bg-slate-950/80 border border-slate-700/40 p-5 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-lg shadow-2xl relative z-110 flex flex-col gap-4 sm:gap-6">
            <h2 className="font-cinzel text-slate-200 text-base sm:text-lg tracking-[0.1em] sm:tracking-[0.2em] font-bold uppercase pb-3 border-b border-slate-800">
              Memory of Tom Riddle — 1943
            </h2>
            
            <p className="font-parchment text-slate-300 text-[15px] sm:text-lg leading-relaxed text-left min-h-[100px] sm:min-h-[120px]">
              {PENSIEVE_SCENES[pensieveStep].text}
            </p>
            
            <div className="flex flex-col gap-3 mt-4">
              {PENSIEVE_SCENES[pensieveStep].choices.map((choice, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => {
                    if (choice.effects) {
                      const eff = choice.effects;
                      if (eff.trust !== undefined) {
                        setRiddleState((prev) => {
                          const nextTrust = Math.max(0, Math.min(100, prev.trustScore + (eff.trust || 0)));
                          let stage: typeof prev.stage = prev.stage;
                          if (nextTrust < 30) stage = "intro";
                          else if (nextTrust < 60) stage = "bonding";
                          else if (nextTrust < 85) stage = "secrets";
                          else stage = "control";
                          return { ...prev, trustScore: nextTrust, stage };
                        });
                        trustMotionValue.set(Math.max(0, Math.min(100, riddleState.trustScore + (eff.trust || 0))));
                      }

                      if (eff.exit) {
                        audio.playScream();
                        setRiddleEmotion("hostile");
                        setRiddleState((prev) => ({ ...prev, trustScore: 0, stage: "intro" }));
                        trustMotionValue.set(0);
                        setDialogueHistory((prev) => [
                          ...prev,
                          { sender: "user", text: "[Ejected from Pensieve Memory]", ink: activeInk },
                          { sender: "riddle", text: "YOUR MIND WAS INTRUDING IN MY MEMORIES. BEGONE." }
                        ]);
                        setRiddleText("YOUR MIND WAS INTRUDING IN MY MEMORIES. BEGONE.");
                        setShowPensieve(false);
                        setFlashGreen(true);
                        setTimeout(() => setFlashGreen(false), 900);
                        return;
                      }

                      if (eff.win) {
                        audio.playPensieveSwell();
                        setRiddleEmotion("pleased");
                        setDialogueHistory((prev) => [
                          ...prev,
                          { sender: "user", text: `[Conquered Pensieve: ${choice.text}]`, ink: activeInk },
                          { sender: "riddle", text: "You have seen what lay in my heart... we are bound together now." }
                        ]);
                        setRiddleText("You have seen what lay in my heart... we are bound together now.");
                        setShowPensieve(false);
                        return;
                      }
                    }

                    if (choice.next === null) {
                      setShowPensieve(false);
                    } else {
                      setPensieveStep(choice.next);
                      audio.playScratch(80, true);
                    }
                  }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 41, 59, 0.6)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 text-xs sm:text-sm font-sans py-3 px-4 rounded-xl cursor-pointer text-left transition-colors"
                >
                  {choice.text}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}
