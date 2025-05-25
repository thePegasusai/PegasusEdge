
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
  // Existing text-based concepts (from Gemini text generation)
  musicStyleSuggestions: string[];
  jingleIdeas: string[]; // These could be text concepts for jingles
  sfxConcepts: string[];
  voiceOverTone: string[]; // Changed to string[] in previous step

  // New fields for structured, "generated" audio assets (from "FutureSound API")
  generatedMusic: MusicAsset[];
  generatedJingles: MusicAsset[]; // Jingles are a type of MusicAsset
  generatedSfx: SfxAsset[];
  generatedVoiceovers: VoiceoverAsset[];
}

// Base for all audio assets
export interface AudioAssetCore {
  id: string; // Unique identifier for the asset
  description: string; // Text prompt or AI-generated description of the audio
  type: 'music' | 'sfx' | 'jingle' | 'voiceover';
  audioUrl?: string; // URL to the playable audio file (will be mock/placeholder)
  isLoading?: boolean; // Optional: for UI to show loading state for this specific asset
  error?: string; // Optional: for UI to show error for this specific asset
}

export interface MusicAsset extends AudioAssetCore {
  type: 'music' | 'jingle'; // Jingles are a specialized form of music
  duration: number; // in seconds
  genre?: string;
  mood?: string;
  tempo?: string;
  instrumentation?: string[];
}

export interface SfxAsset extends AudioAssetCore {
  type: 'sfx';
  sfxCategory?: string; // e.g., 'ambience', 'impact', 'ui', 'character'
  character?: string[]; // e.g., 'sharp', 'booming', 'subtle', 'electronic'
}

export interface VoiceoverAsset extends AudioAssetCore {
  type: 'voiceover';
  text: string; // The text that was synthesized
  voiceUsed?: string; // Identifier for the voice model/style used
  emotion?: string;
  language?: string;
}

// Union type for convenience
export type AudioAsset = MusicAsset | SfxAsset | VoiceoverAsset;

export interface CreatorsEdgeState {
  channelNiche: string;
  videoTopic: string;
  contentStyle: string;
  visionOutput: CreatorVisionOutput | null;
  signatureOutput: CreatorSignatureOutput | null;
  blueprintOutput: CreatorBlueprintOutput | null;
  audioOutput: CreatorAudioOutput | null;
}
