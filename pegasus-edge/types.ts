
export enum AiToolId {
  TEXT_GENERATOR = 'text-generator',
  IMAGE_GENERATOR = 'image-generator',
  CHATBOT = 'chatbot',
  SEARCH_GROUNDING = 'search-grounding',
  CREATORS_EDGE_STUDIO = 'creators-edge-studio',
}

export interface AiTool {
  id: AiToolId;
  name: string;
  description: string;
  icon: React.ElementType;
  isFlagship?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  sources?: GroundingChunk[];
}

// Updated Subscription Plan Types
export enum PlanId {
  MONTHLY = 'monthly-20',
  LIFETIME = 'lifetime-999',
  PAY_PER_USE = 'pay-per-use-1', // For conceptual pay-per-use flow
}

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price: string;
  priceFrequency?: string; // Optional, as lifetime doesn't have it
  features: string[];
  cta: string;
  highlight?: boolean;
  themeGradient?: string;
  stripePriceId?: string; // Placeholder for actual Stripe Price ID
}

export enum UserSubscriptionTier {
  NONE = 'none', // Default, before any interaction
  FREE_STUDIO_USE_AVAILABLE = 'free-studio-use-available', // Hasn't used the free studio run
  POST_FREE_STUDIO_USE = 'post-free-studio-use', // Consumed free studio run, needs to pay or subscribe
  MONTHLY = 'monthly',
  LIFETIME = 'lifetime',
}

export interface UserProfile {
  tier: UserSubscriptionTier;
  creatorsStudioFreeUseConsumed: boolean;
  // Potentially add more specific usage counts here if needed
  // stripeCustomerId?: string; // Placeholder
}


export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}

export enum CreatorStepId {
  VISION = 'vision',
  SIGNATURE = 'signature',
  BLUEPRINT = 'blueprint',
  AUDIO_ALCHEMY = 'audio-alchemy',
  PACK = 'pack',
}

export interface CreatorStep {
  id: CreatorStepId;
  name:string;
  icon: React.ElementType;
}

export interface CreatorVisionOutput {
  titles: string[];
  angles: string[];
  audiencePersona: string;
}

export interface CreatorSignatureOutput {
  colorPalettes: Array<{ name: string; colors: string[] }>;
  fontPairings: Array<{ heading: string; body: string; vibe: string }>;
  thumbnailConcepts: string[];
}

export interface CreatorBlueprintOutput {
  talkingPoints: string[];
  introHooks: string[];
  ctaPhrases: string[];
  interactiveIdeas: string[];
}

export interface CreatorAudioOutput {
  musicStyleSuggestions: string[];
  jingleIdeas: string[];
  sfxConcepts: string[]; // Text-based concepts (already exists)
  voiceOverTone?: string;
  generatedMusic?: MusicAsset[]; // For actual generated audio snippets
  generatedSfx?: SfxAsset[]; // For actual generated SFX assets
}

export interface SfxAsset {
  id: string;
  description: string; // Prompt used for generation
  type: 'sfx';
  audioUrl?: string;
  duration?: number; // Optional, as SFX duration can be variable
  isLoading?: boolean;
  error?: string | null;
}

export interface CreatorsEdgeState {
  channelNiche: string;
  videoTopic: string;
  contentStyle: string;
  visionOutput: CreatorVisionOutput | null;
  signatureOutput: CreatorSignatureOutput | null;
  blueprintOutput: CreatorBlueprintOutput | null;
  audioOutput: CreatorAudioOutput | null;
}

export interface MusicAsset {
  id: string;
  description: string; // Corresponds to the prompt
  type: 'music' | 'sfx' | 'voiceover'; // Type of audio asset
  audioUrl: string; // URL to the audio file
  duration: number; // Duration in seconds
  isLoading?: boolean; // Optional: for UI state management
  error?: string | null; // Optional: for error handling
  // Potentially add waveform data, tags, etc. in the future
}
