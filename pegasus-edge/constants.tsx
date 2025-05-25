
import React from 'react';
import type { SubscriptionPlan, AiTool, CreatorStep } from './types';
import { AiToolId, CreatorStepId, PlanId } from './types';

export const MODEL_TEXT_GENERATION = 'gemini-2.5-flash-preview-04-17';
export const MODEL_IMAGE_GENERATION = 'imagen-3.0-generate-002';

export const API_KEY_CHECK_MESSAGE = "Gemini API Key (process.env.API_KEY) is not configured. Pegasus Edge requires it to unleash its full power.";
export const LOCAL_STORAGE_USER_PROFILE_KEY = 'pegasusEdgeUserProfile';

// --- Existing SVG Icons ---
export const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-.813 2.846a4.5 4.5 0 00-3.09 3.09zM18.25 7.5l-2.846-.813a4.5 4.5 0 00-3.09-3.09L9 1.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813L15.75 9l.813-2.846A4.5 4.5 0 0018.25 7.5z" />
  </svg>
);

export const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

export const ChatBubbleLeftRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.68-3.091a4.501 4.501 0 00-1.32.215A4.207 4.207 0 0112 15.75V13.5M4.5 18V7.5a3 3 0 013-3h7.5a3 3 0 013 3v4.5m-7.5-6H7.5a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h7.5a1.5 1.5 0 001.5-1.5v-2.034M16.5 9.75V6.75a1.5 1.5 0 00-1.5-1.5H7.5a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h2.034m5.966-7.5H13.5m0 0V4.5m0 3.75h3.75M13.5 13.5m0-3.75V4.5" />
  </svg>
);

export const MagnifyingGlassIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

export const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

export const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a.75.75 0 011.06 0l8.955 8.955M3 11.25V21h6V15H9v-1.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75V15h-3v6h6V11.25M21 12a1.5 1.5 0 00-1.5-1.5h-1.224l-7.36-7.361a2.25 2.25 0 00-3.182 0L2.474 10.5H1.5A1.5 1.5 0 000 12" />
  </svg>
);

export const AdjustmentsHorizontalIcon = (props: React.SVGProps<SVGSVGElement>) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

export const WandSparklesIcon = (props: React.SVGProps<SVGSVGElement>) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 4.532l2.426 2.427m-2.426-2.427a3.375 3.375 0 00-4.258 0l-2.427 2.427a3.375 3.375 0 000 4.258L12 12.412m2.47-2.47a3.375 3.375 0 014.258 0l.042.042a3.375 3.375 0 010 4.258l-2.427 2.427a3.375 3.375 0 01-4.258 0L9.02 13.48m5.022-7.948l-2.47 2.47m0 0L9.02 13.48m-3.492-3.492a3.375 3.375 0 010-4.258l2.427-2.427a3.375 3.375 0 014.258 0l2.427 2.427M3 21l3.242-3.242m0 0a4.5 4.5 0 006.364 0l2.828-2.829m-9.192 2.829a4.5 4.5 0 010-6.364L9.88 7.12M16.5 7.5l-2.846-.813a4.5 4.5 0 00-3.09-3.09L9 1.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813L15.75 9l.813-2.846A4.5 4.5 0 0018.25 7.5z" />
  </svg>
);

export const LightBulbIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a15.067 15.067 0 01-4.5 0M12 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zm0-14.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM4.523 7.612a.75.75 0 011.06.023l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 01-.023-1.06zm13.892 0a.75.75 0 01.023 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.037-.023z" />
  </svg>
);
export const PaletteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.5c2.062 0 3.75 1.688 3.75 3.75v1.5c0 .621-.504 1.125-1.125 1.125H18a1.125 1.125 0 01-1.125-1.125v-1.5c0-1.242-.431-2.356-1.172-3.223M16.5 4.5C15.258 4.5 14.144 5.069 13.277 6M9.75 3c.539 0 1.055.093 1.548.262M9.75 3A6.723 6.723 0 003 9.75c0 .488.048.964.139 1.429M9.75 3c-.382 0-.752.023-1.112.066m1.112-.066a9.016 9.016 0 014.12 0m0 0A9.01 9.01 0 0118 10.875m-9.75-7.875c2.062 0 3.75 1.688 3.75 3.75V9c0 .621-.504 1.125-1.125 1.125H9A1.125 1.125 0 017.875 9V6.75C7.875 5.508 7.444 4.394 6.703 3.527M3 12a9.016 9.016 0 01.066-1.112m-.066 1.112A9.01 9.01 0 0010.875 18m7.125-7.125a9.016 9.016 0 01-1.112.066m1.112-.066A9.01 9.01 0 0012 3M1.5 7.5A2.25 2.25 0 013.75 5.25h1.5A2.25 2.25 0 017.5 7.5v1.5A2.25 2.25 0 015.25 11.25h-1.5A2.25 2.25 0 011.5 9V7.5z" />
  </svg>
);
export const ClipboardDocumentListIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM10.5 16.5h3.75" />
  </svg>
);
export const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3M12 15V3.75m0 0L10.5 2.25M12 3.75L13.5 2.25m0 0L12 5.25m-1.5-3L12 5.25m0 9.75A2.25 2.25 0 019.75 12.75H6.375a2.25 2.25 0 01-2.25-2.25V7.5m9 5.25c0-1.242.744-2.328 1.875-2.738a2.25 2.25 0 012.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25H15a2.25 2.25 0 01-2.25-2.25V15z" />
  </svg>
);

export const MusicalNoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V7.5A2.25 2.25 0 0019.5 5.25S18 3 16.5 3 15 4.5 15 4.5s0 1.5-1.5 1.5S12 4.5 12 4.5s-1.5 1.5-1.5 1.5S9 7.5 9 7.5zm0 0A2.25 2.25 0 006.75 5.25v1.5" />
  </svg>
);

export const AI_TOOLS_DATA: AiTool[] = [
  { 
    id: AiToolId.CREATORS_EDGE_STUDIO, 
    name: "Creator's Edge Studio", 
    description: "Your AI co-producer. Generate a complete Content Kickstart Pack: from video ideas, visual branding, script outlines, to audio concepts. First run FREE, then $1/use or subscribe.", 
    icon: WandSparklesIcon, 
    isFlagship: true,
  },
  { id: AiToolId.TEXT_GENERATOR, name: 'Rapid Text Crafter', description: 'Generate sharp text. ($1/use or subscribe after free studio use)', icon: DocumentTextIcon },
  { id: AiToolId.IMAGE_GENERATOR, name: 'Visual Spark Generator', description: 'Ignite visual concepts. ($1/use or subscribe after free studio use)', icon: PhotoIcon },
  { id: AiToolId.CHATBOT, name: 'AI Creative Consultant', description: 'Brainstorm and refine. ($1/use or subscribe after free studio use)', icon: ChatBubbleLeftRightIcon },
  { id: AiToolId.SEARCH_GROUNDING, name: 'Trend Spotter', description: 'Get AI insights. ($1/use or subscribe after free studio use)', icon: MagnifyingGlassIcon },
];

export const CREATOR_STEPS_DATA: CreatorStep[] = [
    { id: CreatorStepId.VISION, name: 'The Vision', icon: LightBulbIcon },
    { id: CreatorStepId.SIGNATURE, name: 'Visual Signature', icon: PaletteIcon },
    { id: CreatorStepId.BLUEPRINT, name: 'Content Blueprint', icon: ClipboardDocumentListIcon },
    { id: CreatorStepId.AUDIO_ALCHEMY, name: 'Audio Alchemy', icon: MusicalNoteIcon },
    { id: CreatorStepId.PACK, name: 'Your Edge Pack', icon: PackageIcon },
];


export const SUBSCRIPTION_PLANS_DATA: SubscriptionPlan[] = [
  {
    id: PlanId.MONTHLY,
    name: 'Pegasus Pro Monthly',
    price: '20',
    priceFrequency: '/month',
    features: [
      'Unlimited access to Creator\'s Edge Studio', 
      'Unlimited access to all AI tools',
      'Priority AI model access', 
      'Advanced generation capabilities',
      'Priority support & community access',
      'Early access to new features',
    ],
    cta: 'Go Pro Monthly',
    highlight: true,
    themeGradient: 'from-purple-600 via-pink-600 to-red-500',
    stripePriceId: 'price_MONTHLY_STRIPE_ID_PLACEHOLDER', // Replace with actual Stripe Price ID
  },
  {
    id: PlanId.LIFETIME,
    name: 'Pegasus Edge Lifetime',
    price: '999',
    priceFrequency: 'one-time',
    features: [
      'Lifetime unlimited access to Creator\'s Edge Studio',
      'Lifetime unlimited access to all AI tools',
      'Top priority AI model access',
      'All current & future premium features',
      'Dedicated lifetime support',
      'Exclusive Pegasus Edge NFT (Conceptual)',
      'The Ultimate Edge, Forever.',
    ],
    cta: 'Secure Lifetime Access',
    themeGradient: 'from-amber-400 via-yellow-500 to-orange-600',
    stripePriceId: 'price_LIFETIME_STRIPE_ID_PLACEHOLDER', // Replace with actual Stripe Price ID
  },
];

// Placeholder for conceptual pay-per-use "plan"
export const PAY_PER_USE_PLAN_INFO: SubscriptionPlan = {
    id: PlanId.PAY_PER_USE,
    name: 'Single Use Pass',
    price: '1',
    priceFrequency: '/use',
    features: ['One full generation from the Creator\'s Edge Studio or any other single tool use.'],
    cta: 'Get Single Use Pass',
    stripePriceId: 'price_PAYPERUSE_STRIPE_ID_PLACEHOLDER', // Replace with actual Stripe Price ID for a $1 product
};


export const PEGASUS_APP_TITLE = "Pegasus Edge"; 
export const APP_TITLE = "Pegasus Edge Suite";
