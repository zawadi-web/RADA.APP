/**
 * Rada Intent Prompts Catalog
 * Culturally grounded conversation starters for Nairobi urban daters.
 * Each prompt is designed to give the reader an immediate hook to start a conversation.
 */

export interface RadaPrompt {
  id: string;
  question: string;
  category: "lifestyle" | "values" | "romance" | "personality" | "fun";
  placeholder: string;
}

export const RADA_PROMPTS: RadaPrompt[] = [
  // Lifestyle
  {
    id: "sunday-nairobi",
    question: "My ideal Sunday in Nairobi looks like...",
    category: "lifestyle",
    placeholder: "e.g. Karura Forest jog, then iced coffee at Java...",
  },
  {
    id: "go-to-date-spot",
    question: "My go-to date spot in the city is...",
    category: "lifestyle",
    placeholder: "e.g. Rooftop sundowners at 14 Riverside...",
  },
  {
    id: "weekend-vibe",
    question: "On weekends you'll find me...",
    category: "lifestyle",
    placeholder: "e.g. At the flea market in Muthaiga...",
  },
  {
    id: "comfort-food",
    question: "The meal I would cook to impress you is...",
    category: "lifestyle",
    placeholder: "e.g. Pilau with kachumbari and a cold Stoney...",
  },
  {
    id: "morning-or-night",
    question: "I'm more of a...",
    category: "lifestyle",
    placeholder: "5am Karura jogger or midnight Westlands person?",
  },
  // Values
  {
    id: "non-negotiable",
    question: "Non-negotiable on a first date...",
    category: "values",
    placeholder: "e.g. Real conversation, not phone-scrolling...",
  },
  {
    id: "green-flag",
    question: "A green flag that immediately wins me over...",
    category: "values",
    placeholder: "e.g. You know your barista by name...",
  },
  {
    id: "hill-to-die-on",
    question: "A hill I will absolutely die on...",
    category: "values",
    placeholder: "e.g. Nyama choma is better than brunch...",
  },
  {
    id: "looking-for-someone",
    question: "I'm looking for someone who...",
    category: "values",
    placeholder: "e.g. Means what they say and says what they mean...",
  },
  // Romance
  {
    id: "perfect-first-date",
    question: "My idea of a perfect first date...",
    category: "romance",
    placeholder: "e.g. Walk around Nairobi National Park then chai...",
  },
  {
    id: "love-language",
    question: "My love language is...",
    category: "romance",
    placeholder: "e.g. Acts of service — I'll fix it before you ask...",
  },
  {
    id: "way-to-win-me",
    question: "The way to win me over is...",
    category: "romance",
    placeholder: "e.g. Surprise plans, not vague 'we should hang'...",
  },
  // Personality
  {
    id: "unlikely-fact",
    question: "Something unlikely about me...",
    category: "personality",
    placeholder: "e.g. I can cook 8 different ugali styles...",
  },
  {
    id: "two-truths-lie",
    question: "Two truths and a lie (your guess)...",
    category: "personality",
    placeholder: "e.g. I speak 3 languages, I've met Lupita, I hate chai...",
  },
  {
    id: "conversation-starter",
    question: "Best conversation I ever had was about...",
    category: "personality",
    placeholder: "e.g. Whether Nairobi has a real music scene...",
  },
  // Fun
  {
    id: "nairobi-vs-mombasa",
    question: "Nairobi or Mombasa for a weekend? Here's why...",
    category: "fun",
    placeholder: "e.g. Mombasa — ocean therapy is non-negotiable...",
  },
  {
    id: "unpopular-opinion",
    question: "My unpopular opinion about Nairobi...",
    category: "fun",
    placeholder: "e.g. Traffic is actually the best podcast time...",
  },
  {
    id: "order-for-me",
    question: "If you ordered for me at a Nairobi restaurant, you'd get me...",
    category: "fun",
    placeholder: "e.g. Beef masala with extra kachumbari...",
  },
];

/**
 * Returns a prompt object by its ID.
 */
export function getPromptById(id: string): RadaPrompt | undefined {
  return RADA_PROMPTS.find((p) => p.id === id);
}

/**
 * Returns a random selection of N prompts.
 */
export function getRandomPrompts(count: number = 5): RadaPrompt[] {
  const shuffled = [...RADA_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
