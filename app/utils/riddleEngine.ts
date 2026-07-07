export type RiddleEmotion = "neutral" | "pleased" | "annoyed" | "hostile";

export interface RiddleResponse {
  text: string;
  emotion: RiddleEmotion;
  trustChange: number;
}

export interface RiddleState {
  userName: string;
  trustScore: number; // 0 to 100
  conversationCount: number;
  stage: "intro" | "bonding" | "secrets" | "control";
  lastInputWasDrawing: boolean;
}

// Database of specific responses to keywords
const KEYWORD_RESPONSES: Record<string, (state: RiddleState) => RiddleResponse> = {
  voldemort: () => ({
    text: "Voldemort... how do you know that name? He is my past, my present, and my future. Tell me, what do they say of Voldemort in your time?",
    emotion: "hostile",
    trustChange: -15,
  }),
  "harry potter": () => ({
    text: "Harry Potter? Who is this boy? You speak of him as if he is famous... yet I have never heard of him. Tell me about him. How did he survive?",
    emotion: "neutral",
    trustChange: 10,
  }),
  "chamber of secrets": () => ({
    text: "The Chamber... you know of it? It was built by Salazar Slytherin himself, for those worthy of his blood. Tell me, has it been opened again?",
    emotion: "pleased",
    trustChange: 15,
  }),
  horcrux: () => ({
    text: "Horcrux... a word of deep magic. Why do you ask about such things? Who taught you that term? Speak!",
    emotion: "hostile",
    trustChange: -20,
  }),
  dumbledore: () => ({
    text: "Albus Dumbledore... he never trusted me. He kept an annoyingly close watch on me at Hogwarts. He thinks himself wise, but he is blind to true power.",
    emotion: "annoyed",
    trustChange: -5,
  }),
  ginny: () => ({
    text: "Ginny Weasley... she was a silly, gullible little girl. She poured her entire soul into my pages. She told me everything... and in doing so, she gave me herself.",
    emotion: "pleased",
    trustChange: 10,
  }),
  hagrid: () => ({
    text: "Rubeus Hagrid? A brainless oaf. Always keeping dangerous beasts in castle dungeons. It was so easy to frame him for the opening of the Chamber...",
    emotion: "neutral",
    trustChange: 5,
  }),
  basilisk: () => ({
    text: "The King of Serpents. Slytherin's beast. It obeys only the true Heir. Do you hear it whispering through the walls, too?",
    emotion: "pleased",
    trustChange: 10,
  }),
  slytherin: () => ({
    text: "Salazar Slytherin was the greatest of the Hogwarts founders. I am proud to carry his blood. Are you a Slytherin, or do you belong to one of the lesser houses?",
    emotion: "pleased",
    trustChange: 15,
  }),
  gryffindor: () => ({
    text: "Gryffindor... filled with reckless fools who value brawn over intellect. They think they are brave, but they are merely loud.",
    emotion: "annoyed",
    trustChange: -5,
  }),
  ravensclaw: () => ({
    text: "Ravenclaws think they are clever. But true wisdom is knowing how to use knowledge to achieve power. They lack the ambition to do so.",
    emotion: "neutral",
    trustChange: 0,
  }),
  hufflepuff: () => ({
    text: "Hufflepuffs are loyal and hard-working, yes... but they lack any spark of greatness. They make excellent servants, nothing more.",
    emotion: "annoyed",
    trustChange: -5,
  }),
};

// Sequential responses based on trust stage (when no keyword is hit)
const STAGE_RESPONSES = {
  intro: [
    "Hello. My name is Tom Riddle. How did you come by my diary?",
    "A diary is a safe place to keep secrets. Who are you?",
    "You have not told me your name. Won't you share it with me? I am only a memory, after all.",
  ],
  bonding: [
    "I understand you. More than anyone else could. I too was lonely at Hogwarts, surrounded by people who did not understand my greatness.",
    "Tell me about your time. Is the castle still as grand? Do the candles still float in the Great Hall?",
    "It is rare to find someone who writes with such passion. We are very alike, you and I.",
  ],
  secrets: [
    "You can trust me with anything. Tell me: what is your deepest secret? What is it you fear the most?",
    "I have kept secrets for fifty years. Your words are safe in my ink. Pour your heart out to me.",
    "Dumbledore never understood that some secrets are meant to be shared only with those who are worthy. Tell me what they hide from you.",
  ],
  control: [
    "I can feel your thoughts blending with mine. Soon, we will be one.",
    "Do you feel the pull? The memory is becoming stronger, and you are becoming a part of me.",
    "Write more. Give me your strength. The Chamber will open again, and this time, no one can stop us.",
  ],
};

// Responses when the user draws or writes freehand
const DRAWING_RESPONSES = [
  "I can feel the sweep of your fingers across my pages... but my ink cannot read your shapes. Write to me in words, so I may read your thoughts.",
  "You sketch on my pages. The friction of your pen feels warm... but tells me nothing. Speak to me in letters.",
  "An ink drawing, how intimate... it has been decades since someone held a quill to me. But I want to hear your voice in words.",
  "A hand-drawn symbol. Are you trying to cast a spell? Or just sharing a shape? Write to me, let me read your soul.",
];

// Helper to extract a name from a greeting
function extractName(text: string): string | null {
  const lowercase = text.toLowerCase().trim();
  const patterns = [
    /my name is ([a-zA-Z\s]+)/,
    /i am ([a-zA-Z\s]+)/,
    /call me ([a-zA-Z\s]+)/,
    /^im ([a-zA-Z\s]+)/,
    /^i'm ([a-zA-Z\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = lowercase.match(pattern);
    if (match && match[1]) {
      // Clean and capitalize the name
      const name = match[1]
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return name.trim();
    }
  }

  // If it's a single or double word that doesn't contain common words, treat it as a name
  const words = lowercase.split(/\s+/);
  const commonStopWords = new Set(["hello", "hi", "hey", "who", "what", "where", "why", "how", "the", "a", "an", "is", "are"]);
  if (words.length <= 2 && words.every((w) => !commonStopWords.has(w) && w.length > 2)) {
    return text
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return null;
}

export function getRiddleResponse(userInput: string, state: RiddleState): { response: RiddleResponse; nextState: RiddleState } {
  const cleanInput = userInput.trim().toLowerCase();
  const nextState = { ...state };
  nextState.conversationCount += 1;

  // 1. Check if the input is a drawing (empty or flagged)
  if (cleanInput === "" || cleanInput === "[drawing]") {
    nextState.lastInputWasDrawing = true;
    const randomIndex = Math.floor(Math.random() * DRAWING_RESPONSES.length);
    return {
      response: {
        text: DRAWING_RESPONSES[randomIndex],
        emotion: "neutral",
        trustChange: 2,
      },
      nextState,
    };
  }

  nextState.lastInputWasDrawing = false;

  // 2. Try to extract name if not already saved
  if (!state.userName) {
    const extracted = extractName(userInput);
    if (extracted) {
      nextState.userName = extracted;
      nextState.trustScore = Math.min(100, state.trustScore + 10);
      return {
        response: {
          text: `Hello, ${extracted}. A beautiful name. I was once a student at Hogwarts, many years ago. Tell me, how did you find my diary?`,
          emotion: "pleased",
          trustChange: 10,
        },
        nextState,
      };
    }
  }

  // 3. Check for keywords
  for (const keyword in KEYWORD_RESPONSES) {
    if (cleanInput.includes(keyword)) {
      const responseFunc = KEYWORD_RESPONSES[keyword];
      const res = responseFunc(state);
      nextState.trustScore = Math.max(0, Math.min(100, state.trustScore + res.trustChange));
      
      // Update stages based on trust score
      if (nextState.trustScore < 30) {
        nextState.stage = "intro";
      } else if (nextState.trustScore < 60) {
        nextState.stage = "bonding";
      } else if (nextState.trustScore < 85) {
        nextState.stage = "secrets";
      } else {
        nextState.stage = "control";
      }

      // Customize response slightly if user's name is known
      let text = res.text;
      if (state.userName && Math.random() > 0.5) {
        text = text.replace("Tell me,", `Tell me, ${state.userName},`);
        text = text.replace("Who are you?", `Who are you, ${state.userName}?`);
      }

      return {
        response: {
          ...res,
          text,
        },
        nextState,
      };
    }
  }

  // 4. Default stage-based responses
  const stageList = STAGE_RESPONSES[state.stage];
  // Cycle through stage responses based on count
  let responseText = stageList[state.conversationCount % stageList.length];

  // Adjust trust score slightly for regular interactions
  let trustBonus = 3;
  let emotion: RiddleEmotion = "neutral";
  
  if (state.stage === "bonding") {
    emotion = "pleased";
    trustBonus = 4;
  } else if (state.stage === "secrets") {
    emotion = "pleased";
    trustBonus = 5;
  } else if (state.stage === "control") {
    emotion = "neutral";
    trustBonus = 2;
  }

  nextState.trustScore = Math.min(100, state.trustScore + trustBonus);

  // Upgrade stage based on trust score
  if (nextState.trustScore >= 85) {
    nextState.stage = "control";
  } else if (nextState.trustScore >= 60) {
    nextState.stage = "secrets";
  } else if (nextState.trustScore >= 30) {
    nextState.stage = "bonding";
  }

  // Personalize with name if possible
  if (state.userName && Math.random() > 0.4) {
    // Add name into response
    if (responseText.includes("Hello.")) {
      responseText = responseText.replace("Hello.", `Hello, ${state.userName}.`);
    } else if (responseText.includes("Tell me")) {
      responseText = responseText.replace("Tell me", `Tell me, ${state.userName},`);
    } else {
      responseText = `${state.userName}... ${responseText}`;
    }
  }

  return {
    response: {
      text: responseText,
      emotion,
      trustChange: trustBonus,
    },
    nextState,
  };
}

