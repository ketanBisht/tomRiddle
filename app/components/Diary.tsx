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
    <div className={`relative w-full flex items-center justify-center book-container ${flashGreen ? "avada-flash" : ""} ${isCrucioShaking ? "crucio-shake" : ""} ${activeProp === "fang" ? "fang-cursor" : ""} ${activeProp === "sword" ? "sword-cursor" : ""} ${isOpen ? "h-[75vh] min-h-[500px] max-h-[650px] md:h-[650px]" : "h-[460px] xs:h-[570px] sm:h-[610px] md:h-[650px]"}`}
    >
      {/* Screaming full screen green flash */}
      {isScreaming && <div className="screaming-overlay" />}

      {/* ⚡ CRUCIO OVERLAY — red crackle flash */}
      {isCrucioShaking && (
        <div className="crucio-overlay" />
      )}

      {/* Red Sword Slash Overlay line */}
      {hasSlashed && (
        <div className="sword-slash-line" />
      )}

      {/* 🔦 LUMOS DARKNESS OVERLAY — covers EVERYTHING with spotlight following cursor */}
      {lumosActive && (
        <div
          className="lumos-darkness-overlay"
          style={{
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

      {/* Ambient ink motes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {MOTE_CONFIG.map((cfg, i) => <InkMote key={i} config={cfg} />)}
      </div>

      {/* Header controls — always visible above book */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="absolute top-[-58px] left-4 right-4 md:left-auto md:right-4 flex items-center justify-between md:justify-end gap-2 md:gap-3 z-40 bg-zinc-900/85 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-amber-900/20 text-[10px] sm:text-xs tracking-wider text-amber-100 font-cinzel"
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
              className={`absolute w-full max-w-[340px] xs:max-w-[420px] sm:max-w-[450px] md:w-[480px] h-auto aspect-[480/650] md:h-[650px] leather-cover rounded-sm flex flex-col items-center justify-between py-6 sm:py-10 px-6 sm:px-8 cursor-pointer select-none shadow-[0_20px_55px_rgba(0,0,0,0.85)] ${hasSlashed ? "book-slashed-left" : ""}`}
            >
              <BrassCorner position="tl" />
              <BrassCorner position="tr" />
              <BrassCorner position="bl" />
              <BrassCorner position="br" />
              <div className="absolute inset-[2px] rounded-sm border border-white/[0.03] pointer-events-none" />

              <div className="flex-1 flex items-center justify-center w-full relative">
                <BurnScar />

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

              <div className="w-full px-3 pb-6">
                <motion.div className="nameplate w-full py-2 px-3 flex items-center justify-center font-cinzel font-bold text-[10px] xs:text-xs sm:text-sm tracking-[0.12em] xs:tracking-[0.18em] rounded-[2px]"
                  animate={{ textShadow: ["0 0 8px rgba(201,160,48,0.3)", "0 0 18px rgba(201,160,48,0.65)", "0 0 8px rgba(201,160,48,0.3)"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {hasSlashed ? "DESTROYED" : "TOM MARVOLO RIDDLE"}
                </motion.div>
                <motion.p className="text-[8px] sm:text-[9px] text-amber-700/40 font-cinzel tracking-[0.25em] uppercase text-center mt-3"
                  animate={{ opacity: [0.3, 0.65, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  {hasSlashed ? "Stitch memories with Reset" : activeProp === "fang" ? "Click cover to stab" : activeProp === "sword" ? "Click cover to slash" : "Click to open"}
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
              className="w-full max-w-[480px] md:max-w-[960px] h-[75vh] min-h-[500px] max-h-[650px] md:h-[650px] flex rounded-sm shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden relative mx-4 md:mx-0"
            >
              {/* LEFT PAGE — Dialogue History */}
              <motion.div
                ref={leftPageRef}
                custom={0} variants={pageVariants} initial="hidden" animate="visible"
                onClick={(e) => { if (activeProp === "fang" || activeProp === "sword") handlePageClick(e, "left-page"); }}
                onMouseMove={handleMouseMoveLumos}
                className={`${activeTab === "history" ? "flex" : "hidden md:flex"} w-full md:w-1/2 h-full parchment parchment-page-left flex flex-col justify-between p-6 sm:p-10 select-none relative overflow-hidden ${hasSlashed ? "book-slashed-left" : ""} ${ringDragging ? "ring-reveal-cursor" : ""}`}
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
                    <h3 className="font-cinzel text-amber-950 text-base tracking-[0.25em] font-bold uppercase">T. M. Riddle</h3>
                    <span className="text-[9px] font-cinzel text-amber-950/60 tracking-[0.3em] mt-0.5 uppercase">London, 1943 — Private Diary</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-5 font-parchment text-[15px] leading-relaxed custom-scrollbar">
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
                      className="text-[8px] sm:text-[9px] uppercase font-cinzel tracking-widest text-amber-950/65 font-bold"
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
                              className="w-full h-full flex flex-col justify-between p-2"
                            >
                              <textarea
                                value={userText}
                                onChange={(e) => setUserText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={lumosActive ? "Type 'nox' to extinguish the light..." : "Write your secrets here..."}
                                disabled={isRiddleWriting}
                                className="w-full flex-1 bg-transparent text-amber-950 font-parchment text-lg leading-loose placeholder-amber-950/45 border-none resize-none focus:outline-none focus:ring-0 font-medium quill-cursor"
                                style={{ paddingTop: "4px" }}
                              />
                              <div className="flex justify-center mt-1">
                                <motion.button type="submit" disabled={!userText.trim() || isRiddleWriting}
                                  whileHover={{ scale: 1.04, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-7 py-2 rounded-sm font-cinzel text-[10px] font-bold tracking-widest disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer uppercase border shadow-md transition-colors ${lumosActive ? "bg-amber-900/80 text-amber-100 border-amber-600/60 hover:bg-amber-800" : "bg-[#1f160e] text-[#f7eede] hover:bg-[#2d2116] border-amber-950/30"}`}
                                >
                                  {lumosActive ? "Cast Spell" : "Pour Heart"}
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

      {/* ── DESK PROPS ── */}
      {/* Basilisk Fang — Left Desk Corner */}
      <div className={`fixed md:absolute bottom-6 left-6 md:bottom-auto md:left-6 lg:left-12 md:top-[68%] md:-translate-y-1/2 z-35 flex flex-col items-center gap-2 select-none`}>
        <motion.div
          whileHover={{ scale: 1.05, filter: "brightness(1.1) drop-shadow(0 0 10px rgba(34,197,94,0.3))" }}
          onClick={() => setActiveProp((prev) => (prev === "fang" ? "none" : "fang"))}
          className={`p-3 sm:p-4 rounded-2xl transition-all duration-300 cursor-pointer prop-display-frame ${
            activeProp === "fang" ? "active-prop-glow-fang" : ""
          }`}
        >
          <svg viewBox="0 0 60 180" className="w-8 h-20 sm:w-10 sm:h-24 transition-transform duration-300" style={{ transform: activeProp === "fang" ? "rotate(-10deg) scale(1.05)" : "none" }}>
            <path d="M10,10 C10,10 15,60 18,100 C21,140 18,160 12,175 C30,150 42,120 40,80 C38,40 28,20 10,10 Z" fill="#fafaf9" stroke="#44403c" strokeWidth="2.5" />
            <path d="M12,20 C12,20 16,55 18,90 C20,125 18,145 14,160 C26,140 33,115 32,80 C31,45 24,30 12,20 Z" fill="url(#venomGlow)" opacity="0.65" />
            <defs>
              <linearGradient id="venomGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        <span className="font-cinzel text-[8px] sm:text-[9px] text-amber-100/50 tracking-wider uppercase bg-zinc-950/80 px-2 py-0.5 rounded border border-amber-950/15">
          {activeProp === "fang" ? "Active" : "Basilisk Fang"}
        </span>
      </div>

      {/* Marvolo Gaunt's Ring — Right Desk Corner */}
      <div className={`fixed md:absolute bottom-6 right-6 md:bottom-auto md:right-6 lg:right-12 md:top-[68%] md:-translate-y-1/2 z-35 flex flex-col items-center gap-2 select-none`}>
        {/* Smoke particles */}
        {activeProp === "ring" && smokeParticles.map((p) => (
          <motion.div
            key={p.id}
            className="smoke-particle"
            style={{ left: `calc(50% + ${p.x}px)`, bottom: `80px` }}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ y: -80, x: p.x + (Math.random() - 0.5) * 20, scale: 2.2, opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        ))}
        
        <motion.div
          drag
          dragSnapToOrigin
          whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0], filter: "brightness(1.1)" }}
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
          className={`p-3.5 sm:p-5 rounded-2xl transition-colors duration-300 flex items-center justify-center cursor-grab active:cursor-grabbing prop-display-frame ${
            activeProp === "ring" ? "active-prop-glow-ring" : ""
          }`}
          style={{ zIndex: ringDragging ? 50 : 35 }}
        >
          <svg viewBox="0 0 80 80" className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300">
            <circle cx="40" cy="50" r="22" fill="none" stroke="url(#ringGold)" strokeWidth="6" />
            <path d="M 28 32 L 52 32 L 40 16 Z" fill="url(#ringGold)" stroke="#78350f" strokeWidth="1" />
            <polygon points="40,8 54,24 40,40 26,24" fill="#09090b" stroke="#78350f" strokeWidth="1.5" />
            <g stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.8">
              <polygon points="40,14 49,28 31,28" />
              <circle cx="40" cy="23.5" r="4.5" />
              <line x1="40" y1="14" x2="40" y2="28" />
            </g>
            <defs>
              <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        
        {activeProp === "ring" && (
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setStoneOnBook((prev) => {
                const next = !prev;
                if (next) {
                  audio.playGhostWhisper();
                }
                return next;
              });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`mt-1.5 px-2.5 py-1 rounded border font-cinzel text-[8px] sm:text-[9px] tracking-wider uppercase transition-all duration-300 ${
              stoneOnBook
                ? "bg-blue-950/40 border-blue-400 text-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.3)]"
                : "bg-zinc-950/80 border-amber-950/20 text-amber-100/55 hover:text-amber-100"
            }`}
          >
            {stoneOnBook ? "Stone: On" : "Pry Stone"}
          </motion.button>
        )}

        <span className="font-cinzel text-[8px] sm:text-[9px] text-amber-100/50 tracking-wider uppercase bg-zinc-950/80 px-2 py-0.5 rounded border border-amber-950/15 mt-1 text-center leading-tight">
          {ringDragging ? "Revealing..." : "Drag to Reveal"}
        </span>
      </div>

      {/* Sword of Gryffindor Prop - rested at right side of desk */}
      <div className="fixed md:absolute bottom-6 right-8 md:bottom-auto md:right-1 lg:right-4 md:top-[65%] md:-translate-y-1/2 md:rotate-90 z-35 flex flex-col items-center gap-1 select-none origin-center">
        <motion.div
          whileHover={{ scale: 1.02, filter: "brightness(1.15)" }}
          onClick={() => {
            setActiveProp((prev) => (prev === "sword" ? "none" : "sword"));
          }}
          className={`w-72 sm:w-80 h-14 rounded-xl border flex items-center justify-between px-3 transition-all duration-300 cursor-pointer ${
            activeProp === "sword"
              ? "bg-red-950/45 border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.4)] ring-1 ring-red-500/20"
              : "bg-[#18110b]/90 border-amber-950/40 hover:border-amber-700/50 shadow-[0_12px_28px_rgba(0,0,0,0.7)]"
          }`}
          style={{
            backgroundImage: "radial-gradient(circle at center, rgba(127,29,29,0.2) 0%, transparent 80%)"
          }}
        >
          {/* Left peg mount */}
          <div className="w-1.5 h-6 bg-amber-950/85 border-t border-amber-800 rounded-sm self-end mb-1.5 ml-8" />
          
          <svg viewBox="0 0 160 30" className="w-48 h-10 transition-transform duration-300 self-center" style={{ transform: activeProp === "sword" ? "translateY(-1px) rotate(1deg)" : "none" }}>
            {/* Sword blade */}
            <path d="M22,15 L130,12 L150,15 L130,18 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <line x1="22" y1="15" x2="130" y2="15" stroke="#cbd5e1" strokeWidth="0.5" />
            {/* Rubies on blade */}
            <circle cx="125" cy="15" r="1" fill="#ef4444" />
            <circle cx="110" cy="15" r="0.8" fill="#ef4444" />
            <circle cx="95" cy="15" r="0.8" fill="#ef4444" />
            {/* Crossguard */}
            <path d="M18,3 C18,3 22,12 22,15 C22,18 18,27 18,27 L22,27 C22,27 25,18 25,15 C25,12 22,3 22,3 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
            {/* Rubies on Crossguard */}
            <circle cx="20.5" cy="8" r="0.8" fill="#ef4444" />
            <circle cx="20.5" cy="22" r="0.8" fill="#ef4444" />
            {/* Hilt / Grip with golden wire wrap */}
            <rect x="5" y="12" width="13" height="6" rx="1" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.5" />
            <line x1="8" y1="12" x2="10" y2="18" stroke="#fbbf24" strokeWidth="0.6" />
            <line x1="11" y1="12" x2="13" y2="18" stroke="#fbbf24" strokeWidth="0.6" />
            <line x1="14" y1="12" x2="16" y2="18" stroke="#fbbf24" strokeWidth="0.6" />
            {/* Pommel with large ruby */}
            <circle cx="2" cy="15" r="3.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
            <circle cx="2" cy="15" r="1.5" fill="#ef4444" />
          </svg>
          
          {/* Right peg mount */}
          <div className="w-1.5 h-6 bg-amber-950/85 border-t border-amber-800 rounded-sm self-end mb-1.5 mr-8" />

          {/* Label status */}
          <div className="absolute top-1 right-2 flex items-center gap-1 font-cinzel text-[7px] text-amber-500/70 uppercase tracking-widest font-bold">
            {activeProp === "sword" ? "Active" : "Gryffindor Sword"}
          </div>
        </motion.div>
      </div>

      {/* Inkwell Rack prop - Left Side of Desk */}
      <div className={`fixed md:absolute bottom-6 left-24 md:bottom-auto md:left-6 lg:left-12 md:top-[22%] md:-translate-y-1/2 z-35 flex md:flex-col items-center gap-3 bg-zinc-900/80 border border-amber-950/20 px-3 py-2 md:py-4 rounded-2xl backdrop-blur-md select-none`}>
        <span className="font-cinzel text-[8px] text-amber-500/80 uppercase tracking-widest md:rotate-270 md:my-4">Inkwell</span>
        {[
          { type: "standard", color: "bg-zinc-950 border-zinc-700", name: "Standard" },
          { type: "invisible", color: "bg-amber-100/30 border-amber-200/50 shadow-[0_0_8px_rgba(253,240,138,0.2)]", name: "Invisible" },
          { type: "venom", color: "bg-amber-950 border-orange-800 shadow-[0_0_8px_rgba(249,115,22,0.4)]", name: "Venom" },
          { type: "emerald", color: "bg-emerald-950 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]", name: "Emerald" }
        ].map((ink) => (
          <motion.button
            key={ink.type}
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
            className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all ${ink.color} ${
              activeInk === ink.type ? "ring-2 ring-amber-500 scale-110" : "opacity-70 hover:opacity-100"
            }`}
            title={`${ink.name} Ink`}
          />
        ))}
      </div>

      {/* Spells & Secrets Scroll Prop — Left Desk Corner (under inkwells) */}
      <div className="fixed md:absolute bottom-6 left-28 md:bottom-auto md:left-6 lg:left-12 md:top-[85%] md:-translate-y-1/2 z-35 flex flex-col items-center gap-1.5 select-none">
        <motion.div
          whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0], filter: "brightness(1.15) drop-shadow(0 0 10px rgba(245,158,11,0.35))" }}
          onClick={() => {
            setShowRulebook(true);
            audio.playScratch(80, true);
          }}
          className="p-3 sm:p-4 rounded-2xl transition-all duration-300 flex items-center justify-center cursor-pointer prop-display-frame"
        >
          <svg viewBox="0 0 80 80" className="w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300">
            <path d="M20,20 C20,20 30,15 45,15 C60,15 65,22 65,22 L65,58 C65,58 60,50 45,50 C30,50 20,55 20,55 Z" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
            <path d="M20,20 C10,20 10,25 20,25 C30,25 30,20 20,20" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <path d="M20,55 C10,55 10,60 20,60 C30,60 30,55 20,55" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <path d="M65,22 C75,22 75,27 65,27 C55,27 55,22 65,22" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <path d="M65,58 C75,58 75,63 65,63 C55,63 55,58 65,58" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <rect x="38" y="15" width="4" height="35" rx="1" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
          </svg>
        </motion.div>
        <span className="font-cinzel text-[8px] sm:text-[9px] text-amber-100/50 tracking-wider uppercase bg-zinc-950/80 px-2 py-0.5 rounded border border-amber-950/15">
          Spells Scroll
        </span>
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
              className="scroll-modal-container w-full max-w-lg p-6 sm:p-8 rounded-xl max-h-[85vh] overflow-y-auto flex flex-col gap-5 text-amber-950 font-sans"
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

              <div className="flex flex-col gap-4 text-xs sm:text-sm leading-relaxed overflow-y-auto pr-1">
                <div>
                  <h3 className="font-cinzel font-bold text-amber-900 mb-1 border-b border-amber-900/15 pb-0.5">✒️ Pouring Heart</h3>
                  <p>Type in the text input area and press <strong>&quot;Pour Heart&quot;</strong>, or draw freehand lines with your stylus or mouse directly on the page.</p>
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
          
          <div className="w-full max-w-lg bg-slate-950/80 border border-slate-700/40 p-8 rounded-3xl backdrop-blur-lg shadow-2xl relative z-110 flex flex-col gap-6">
            <h2 className="font-cinzel text-slate-200 text-lg tracking-[0.2em] font-bold uppercase pb-3 border-b border-slate-800">
              Memory of Tom Riddle — 1943
            </h2>
            
            <p className="font-parchment text-slate-300 text-base sm:text-lg leading-relaxed text-left min-h-[120px]">
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
  );
}
