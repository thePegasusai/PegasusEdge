
import React, { useState, useCallback } from 'react';
import { generateText } from '../../services/geminiService';
import { generateMusicSnippet, generateSoundEffect, generateVoiceoverSnippet } from '../../services/audioService';
import LoadingSpinner from '../LoadingSpinner';
import { WandSparklesIcon, LightBulbIcon, PaletteIcon, ClipboardDocumentListIcon, PackageIcon, MusicalNoteIcon, CREATOR_STEPS_DATA, PAY_PER_USE_PLAN_INFO } from '../../constants';
import { Link } from 'react-router-dom';
import type { CreatorStepId, CreatorsEdgeState, CreatorVisionOutput, CreatorSignatureOutput, CreatorBlueprintOutput, CreatorAudioOutput, SubscriptionPlan, MusicAsset, SfxAsset, VoiceoverAsset, AudioAsset } from '../../types';
import { AiToolId, CreatorStepId as CreatorStepIdEnum, UserSubscriptionTier } from '../../types';
import { useSubscription } from '../../App'; // Adjust path

// Modal Component (Simplified)
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void; // Simulates payment confirmation
  plan: SubscriptionPlan; // For displaying $1 PPU info
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirmPayment, plan }) => {
  if (!isOpen) return null;

  const handlePayment = () => {
    alert(`(Demo) Initiating $1.00 payment for '${plan.name}' via Stripe...\nThis would redirect to Stripe Checkout.`);
    // Simulate successful payment after a delay
    setTimeout(() => {
      alert(`(Demo) Payment of $1.00 for '${plan.name}' successful! You can now generate your pack.`);
      onConfirmPayment();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="card-premium max-w-md w-full text-center p-8">
        <WandSparklesIcon className="w-16 h-16 text-amber-400 mx-auto mb-6" />
        <h2 className="font-display text-3xl text-slate-100 mb-3">Unlock This Generation</h2>
        <p className="text-slate-300 mb-2">You've used your free Creator's Edge Studio run.</p>
        <p className="text-slate-100 text-2xl font-bold mb-1">
            Get this Edge Pack for just <span className="text-amber-400">${plan.price}</span>!
        </p>
        <p className="text-xs text-slate-400 mb-6">({plan.features[0]})</p>
        
        <div className="space-y-4">
            <button 
                onClick={handlePayment}
                className="btn-premium w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
                Pay ${plan.price} Securely with Stripe (Demo)
            </button>
            <Link to="/subscriptions" className="block w-full btn-secondary">
                View Subscription Plans
            </Link>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm w-full py-2">
                Maybe Later
            </button>
        </div>
        <p className="text-xs text-slate-500 mt-4">
            Payments are handled securely by Stripe. (This is a frontend demonstration).
        </p>
      </div>
    </div>
  );
};


const CreatorsEdgeStudioTool: React.FC = () => {
  const { userProfile, isSubscribed, canUseCreatorStudioFree, consumeCreatorStudioFreeUse, updateUserProfile } = useSubscription();
  const [currentStepId, setCurrentStepId] = useState<CreatorStepId>(CREATOR_STEPS_DATA[0].id);
  const [studioState, setStudioState] = useState<CreatorsEdgeState>({
    channelNiche: '',
    videoTopic: '',
    contentStyle: '',
    visionOutput: null,
    signatureOutput: null,
    blueprintOutput: null,
    audioOutput: { // Initialize with empty arrays for all fields
      musicStyleSuggestions: [],
      jingleIdeas: [],
      sfxConcepts: [],
      voiceOverTone: [],
      generatedMusic: [],
      generatedJingles: [],
      generatedSfx: [],
      generatedVoiceovers: [],
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false); // For text ideas
  const [isGeneratingJingles, setIsGeneratingJingles] = useState<boolean>(false); // For text ideas
  const [isGeneratingSfx, setIsGeneratingSfx] = useState<boolean>(false); // For text ideas
  const [isGeneratingVoiceTone, setIsGeneratingVoiceTone] = useState<boolean>(false); // For text ideas
  
  const [isGeneratingActualMusic, setIsGeneratingActualMusic] = useState<boolean>(false);
  const [isGeneratingActualJingles, setIsGeneratingActualJingles] = useState<boolean>(false);
  const [isGeneratingActualSfx, setIsGeneratingActualSfx] = useState<boolean>(false);
  const [isGeneratingActualVoiceover, setIsGeneratingActualVoiceover] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);


  const handleInputChange = (field: keyof CreatorsEdgeState, value: string) => {
    setStudioState(prev => ({ ...prev, [field]: value }));
  };
  
  const currentStepIndex = CREATOR_STEPS_DATA.findIndex(s => s.id === currentStepId);
  const CurrentStepIcon = CREATOR_STEPS_DATA[currentStepIndex]?.icon || WandSparklesIcon;


  const proceedToNextStep = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < CREATOR_STEPS_DATA.length) {
      setCurrentStepId(CREATOR_STEPS_DATA[nextStepIndex].id);
    }
  };
  
  const goToPrevStep = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStepId(CREATOR_STEPS_DATA[prevStepIndex].id);
    }
  };

  const parseJsonResponse = <T,>(jsonString: string, fallback: T): T => {
    try {
        let str = jsonString.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = str.match(fenceRegex);
        if (match && match[2]) {
            str = match[2].trim();
        }
        return JSON.parse(str);
    } catch (parseError) {
        console.error("Failed to parse JSON:", parseError, "Raw text:", jsonString);
        return fallback;
    }
  };

  const executeGenerationWithAccessCheck = async (generationFn: () => Promise<void>) => {
    if (isSubscribed()) {
      await generationFn();
      return;
    }
    if (canUseCreatorStudioFree() && currentStepId === CreatorStepIdEnum.PACK) { // Free use consumed at pack generation
      await generationFn();
      consumeCreatorStudioFreeUse(); // Consume AFTER successful pack generation
      return;
    }
    if (currentStepId === CreatorStepIdEnum.PACK && userProfile.tier === UserSubscriptionTier.POST_FREE_STUDIO_USE) {
      setPendingAction(() => generationFn); // Store the function to call after payment
      setShowPaymentModal(true);
      return;
    }
    // For steps before PACK, allow generation even if not subscribed and free use available/consumed
    // The actual "consumption" or "charge" happens at the final PACK step.
    await generationFn();
  };

  const handleVisionGenerationInternal = useCallback(async () => {
    if (!studioState.channelNiche.trim()) {
      setError('Channel Niche is essential for a focused vision.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const prompt = `
        For a content creator with this profile:
        Niche: ${studioState.channelNiche}
        Video Topic Idea (optional): ${studioState.videoTopic || "General channel content"}
        Desired Content Style: ${studioState.contentStyle || "Versatile"}
        Generate JSON for: titles (3), unique content angles (2-3), target audience persona.
        { "titles": [], "angles": [], "audiencePersona": "" }
      `;
      const resultText = await generateText(prompt, "AI co-producer for viral strategies.");
      const parsedResult = parseJsonResponse<CreatorVisionOutput>(resultText, { 
        titles: ["AI Error: Title gen failed"], angles: ["AI Error: Angle gen failed"], audiencePersona: "AI Error: Persona gen failed"
      });
      setStudioState(prev => ({ ...prev, visionOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  }, [studioState.channelNiche, studioState.videoTopic, studioState.contentStyle]);

  const handleSignatureGenerationInternal = useCallback(async () => {
    if (!studioState.visionOutput) { setError('Vision step must be completed.'); return; }
    setIsLoading(true); setError(null);
    try {
      const prompt = `Based on vision (Titles: ${studioState.visionOutput.titles.join(', ')}, Audience: ${studioState.visionOutput.audiencePersona}), Niche: ${studioState.channelNiche}. 
      Suggest JSON for: color palettes (2 options, name & 3-4 hex), font pairings (2 options, heading/body/vibe), thumbnail concepts (2 text descriptions).
      { "colorPalettes": [], "fontPairings": [], "thumbnailConcepts": [] }`;
      const resultText = await generateText(prompt, "AI branding expert for luxury/modern aesthetics.");
      const parsedResult = parseJsonResponse<CreatorSignatureOutput>(resultText, {
        colorPalettes: [{name:"Error Palette", colors:["#000"]}], fontPairings: [{heading:"ErrorFont", body:"ErrorFont", vibe:"Error"}], thumbnailConcepts: ["AI error for thumbnails."]
      });
      setStudioState(prev => ({ ...prev, signatureOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  }, [studioState.visionOutput, studioState.channelNiche]);

  const handleBlueprintGenerationInternal = useCallback(async () => {
    if (!studioState.visionOutput || !studioState.signatureOutput) { setError('Vision & Signature needed.'); return; }
    setIsLoading(true); setError(null);
    try {
      const prompt = `Vision (Titles: ${studioState.visionOutput.titles.join(', ')}, Topic: ${studioState.videoTopic || studioState.channelNiche}), Branding (Palette: ${studioState.signatureOutput.colorPalettes[0]?.name}).
      Generate JSON for content blueprint: key talking points (3-5), intro hooks (2-3), CTA phrases (2-3), interactive ideas (1-2).
      { "talkingPoints": [], "introHooks": [], "ctaPhrases": [], "interactiveIdeas": [] }`;
      const resultText = await generateText(prompt, "AI scriptwriter & engagement strategist.");
      const parsedResult = parseJsonResponse<CreatorBlueprintOutput>(resultText, {
        talkingPoints: ["AI error."], introHooks: ["AI error."], ctaPhrases: ["AI error."], interactiveIdeas: ["AI error."]
      });
      setStudioState(prev => ({ ...prev, blueprintOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  }, [studioState.visionOutput, studioState.signatureOutput, studioState.videoTopic, studioState.channelNiche, studioState.contentStyle]);

  const handleMusicIdeasGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint step must be completed first.'); return; }
    setIsGeneratingMusic(true); setError(null);
    try {
      const prompt = `
        Based on the project (Niche: ${studioState.channelNiche}, Topic: ${studioState.videoTopic || 'general content'}, Style: ${studioState.contentStyle || 'versatile'}), provide 2-3 distinct background music style suggestions.
        For each suggestion, include: mood (e.g., upbeat, mysterious, calm), genre (e.g., Lo-fi, cinematic orchestral, acoustic folk), tempo (e.g., slow, medium, fast), key instrumentation (e.g., piano and strings, synth pads and drum machine, acoustic guitar), and a brief thematic description.
        Format as a JSON object: { "musicStyleSuggestions": [ { "mood": "...", "genre": "...", "tempo": "...", "instrumentation": "...", "description": "..." }, ... ] }
      `;
      const resultText = await generateText(prompt, "AI music supervisor for content creators.");
      const parsedResult = parseJsonResponse<{ musicStyleSuggestions: Array<{ mood: string; genre: string; tempo: string; instrumentation: string; description: string }> }>(resultText, { musicStyleSuggestions: [] });
      
      const formattedSuggestions = parsedResult.musicStyleSuggestions.map(s => 
        `Mood: ${s.mood}, Genre: ${s.genre}, Tempo: ${s.tempo}, Instruments: ${s.instrumentation}, Description: ${s.description}`
      );

      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { 
            musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
            generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: [] 
          }),
          musicStyleSuggestions: formattedSuggestions,
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingMusic(false); }
  }, [studioState.channelNiche, studioState.videoTopic, studioState.contentStyle, studioState.blueprintOutput]);

  const handleJingleIdeasGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint step must be completed first.'); return; }
    setIsGeneratingJingles(true); setError(null);
    try {
      const prompt = `
        For a creator with Niche: ${studioState.channelNiche} and Style: ${studioState.contentStyle || 'versatile'}, generate 1-2 short, catchy jingle concepts.
        For each concept, include: a brief conceptual description, suggested musical style, and a short lyrical snippet (if applicable, keep it under 10 words).
        Format as a JSON object: { "jingleIdeas": [ { "concept": "...", "style": "...", "lyric": "..." }, ... ] }
      `;
      const resultText = await generateText(prompt, "AI jingle writer for branding.");
      const parsedResult = parseJsonResponse<{ jingleIdeas: Array<{ concept: string; style: string; lyric: string }> }>(resultText, { jingleIdeas: [] });
      
      const formattedJingles = parsedResult.jingleIdeas.map(j => 
        `Concept: ${j.concept}, Style: ${j.style}, Lyric: ${j.lyric || 'Instrumental'}`
      );

      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { 
            musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
            generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: [] 
          }),
          jingleIdeas: formattedJingles,
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingJingles(false); }
  }, [studioState.channelNiche, studioState.contentStyle, studioState.blueprintOutput]);

  const handleSfxIdeasGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint step must be completed first.'); return; }
    setIsGeneratingSfx(true); setError(null);
    try {
      const prompt = `
        Considering the video topic "${studioState.videoTopic || studioState.channelNiche}" and content style "${studioState.contentStyle || 'versatile'}", suggest 2-3 relevant sound effect concepts.
        For each SFX, describe: the sound event, its character (e.g., sharp, whooshing, subtle), and a potential use case in a video.
        Format as a JSON object: { "sfxConcepts": [ { "event": "...", "character": "...", "use_case": "..." }, ... ] }
      `;
      const resultText = await generateText(prompt, "AI sound designer for video content.");
      const parsedResult = parseJsonResponse<{ sfxConcepts: Array<{ event: string; character: string; use_case: string }> }>(resultText, { sfxConcepts: [] });
      
      const formattedSfx = parsedResult.sfxConcepts.map(s => 
        `Event: ${s.event}, Character: ${s.character}, Use Case: ${s.use_case}`
      );

      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { 
            musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
            generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: [] 
          }),
          sfxConcepts: formattedSfx,
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingSfx(false); }
  }, [studioState.videoTopic, studioState.channelNiche, studioState.contentStyle, studioState.blueprintOutput]);

  const handleVoiceoverToneGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint step must be completed first.'); return; }
    setIsGeneratingVoiceTone(true); setError(null);
    try {
      const prompt = `
        For content with style "${studioState.contentStyle || 'versatile'}" and topic "${studioState.videoTopic || studioState.channelNiche}", suggest 1-2 distinct voiceover tone options.
        For each option, describe: the vocal quality (e.g., deep, friendly, energetic), delivery style (e.g., conversational, authoritative, sarcastic), and perceived emotion (e.g., enthusiastic, serious, humorous).
        Format as a JSON object: { "voiceOverTone": [ { "quality": "...", "delivery": "...", "emotion": "..." }, ... ] }
      `;
      const resultText = await generateText(prompt, "AI voice coach for narration.");
      // Ensure the type here matches the changed CreatorAudioOutput.voiceOverTone to string[]
      const parsedResult = parseJsonResponse<{ voiceOverTone: Array<{ quality: string; delivery: string; emotion: string }> }>(resultText, { voiceOverTone: [] });
      
      const formattedTones = parsedResult.voiceOverTone.map(t => 
        `Quality: ${t.quality}, Delivery: ${t.delivery}, Emotion: ${t.emotion}`
      );

      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { 
            musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
            generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: [] 
          }),
          voiceOverTone: formattedTones, // voiceOverTone is now string[]
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingVoiceTone(false); }
  }, [studioState.contentStyle, studioState.videoTopic, studioState.channelNiche, studioState.blueprintOutput]);
  
  const handleAudioGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) {
      setError('Blueprint step must be completed before finalizing audio.');
      return;
    }
    // Optional: Check if at least one audio category has been generated
    const { audioOutput } = studioState;
    if (!audioOutput || 
        (audioOutput.musicStyleSuggestions.length === 0 &&
         audioOutput.jingleIdeas.length === 0 &&
         audioOutput.sfxConcepts.length === 0 &&
         (audioOutput.voiceOverTone?.length || 0) === 0) && // check voiceOverTone length
        (audioOutput.generatedMusic.length === 0 && // Also check generated assets
         audioOutput.generatedJingles.length === 0 &&
         audioOutput.generatedSfx.length === 0 &&
         audioOutput.generatedVoiceovers.length === 0)
        ) {
      setError("Please generate at least one set of audio ideas or one actual audio asset before finalizing the pack.");
      return;
    }

    setIsLoading(true); // Use main isLoading for the finalize step
    setError(null);
    
    // No generation happens here anymore, just proceeding to pack after checks
    try {
      if (isSubscribed()) {
        proceedToNextStep(); // Directly go to PACK
      } else if (canUseCreatorStudioFree()) {
        consumeCreatorStudioFreeUse();
        proceedToNextStep(); // Go to PACK
      } else { // Needs to pay
        setShowPaymentModal(true);
        setPendingAction(() => async () => {
          proceedToNextStep();
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [studioState.blueprintOutput, studioState.audioOutput, isSubscribed, canUseCreatorStudioFree, consumeCreatorStudioFreeUse, proceedToNextStep]);


  // Wrappers for individual audio generation (no access check for these sub-steps)
  const handleGenerateMusicIdeas = () => handleMusicIdeasGenerationInternal();
  const handleGenerateJingleIdeas = () => handleJingleIdeasGenerationInternal();
  const handleGenerateSfxIdeas = () => handleSfxIdeasGenerationInternal();
  const handleGenerateVoiceTone = () => handleVoiceoverToneGenerationInternal();

  // --- New Handlers for Generating Actual Audio Assets ---
  const handleGenerateActualMusic = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed.'); return; }
    setIsGeneratingActualMusic(true); setError(null);
    try {
      const firstIdea = studioState.audioOutput?.musicStyleSuggestions?.[0] || "Upbeat cinematic background music";
      const newAsset = await generateMusicSnippet(firstIdea, studioState.contentStyle || undefined);
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...prev.audioOutput!,
          generatedMusic: [...(prev.audioOutput!.generatedMusic || []), newAsset],
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingActualMusic(false); }
  }, [studioState.blueprintOutput, studioState.audioOutput?.musicStyleSuggestions, studioState.contentStyle]);

  const handleGenerateActualJingle = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed.'); return; }
    setIsGeneratingActualJingles(true); setError(null);
    try {
      const firstIdea = studioState.audioOutput?.jingleIdeas?.[0] || "Short catchy jingle for channel intro";
      // Using generateMusicSnippet for jingles as per type definition
      const newAsset = await generateMusicSnippet(firstIdea, studioState.contentStyle || undefined, 10); // Shorter duration for jingles
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...prev.audioOutput!,
          // Assuming jingles are a type of MusicAsset and stored in generatedJingles
          generatedJingles: [...(prev.audioOutput!.generatedJingles || []), { ...newAsset, type: 'jingle' as const }],
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingActualJingles(false); }
  }, [studioState.blueprintOutput, studioState.audioOutput?.jingleIdeas, studioState.contentStyle]);

  const handleGenerateActualSfx = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed.'); return; }
    setIsGeneratingActualSfx(true); setError(null);
    try {
      const firstIdea = studioState.audioOutput?.sfxConcepts?.[0] || "Digital whoosh sound effect";
      const newAsset = await generateSoundEffect(firstIdea);
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...prev.audioOutput!,
          generatedSfx: [...(prev.audioOutput!.generatedSfx || []), newAsset],
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingActualSfx(false); }
  }, [studioState.blueprintOutput, studioState.audioOutput?.sfxConcepts]);

  const handleGenerateActualVoiceover = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed.'); return; }
    setIsGeneratingActualVoiceover(true); setError(null);
    try {
      const textForVoiceover = studioState.blueprintOutput?.introHooks?.[0] || "Welcome to the channel!";
      const voiceToneIdea = studioState.audioOutput?.voiceOverTone?.[0] || "Neutral and friendly"; // Could parse this for style/emotion
      const newAsset = await generateVoiceoverSnippet(textForVoiceover, voiceToneIdea); // Pass voiceToneIdea as style for now
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...prev.audioOutput!,
          generatedVoiceovers: [...(prev.audioOutput!.generatedVoiceovers || []), newAsset],
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingActualVoiceover(false); }
  }, [studioState.blueprintOutput?.introHooks, studioState.audioOutput?.voiceOverTone]);


  // Wrappers that call executeGenerationWithAccessCheck (for main step progression)
  const handleVisionGeneration = () => executeGenerationWithAccessCheck(handleVisionGenerationInternal);
  const handleSignatureGeneration = () => executeGenerationWithAccessCheck(handleSignatureGenerationInternal);
  const handleBlueprintGeneration = () => executeGenerationWithAccessCheck(handleBlueprintGenerationInternal);
  const handleAudioGeneration = () => executeGenerationWithAccessCheck(handleAudioGenerationInternal); // This is for "Finalize Pack & Proceed"


  const handleConfirmPayPerUse = async () => {
    setShowPaymentModal(false);
    if (pendingAction) {
        setIsLoading(true); // Show loading for the pending action
        await pendingAction();
        setPendingAction(null);
        setIsLoading(false);
    }
  };

  const startNewPack = () => {
    setCurrentStepId(CreatorStepIdEnum.VISION);
    setStudioState({
        channelNiche: '', videoTopic: '', contentStyle: '',
        visionOutput: null, signatureOutput: null, blueprintOutput: null, audioOutput: null,
    });
    // If user is NOT subscribed and had consumed their free use,
    // starting a "new pack" effectively resets them to needing to pay for the *next* one,
    // or if they somehow get here without consuming free use, it should remain available.
    // The consumption happens AT pack finalization.
    // This logic ensures if they start over, their free use isn't reset unless they are not truly "post free use"
    if (userProfile.tier === UserSubscriptionTier.POST_FREE_STUDIO_USE && !isSubscribed()) {
        // They remain in POST_FREE_STUDIO_USE, so next pack will cost $1
    } else if (!isSubscribed()) {
        // If they were somehow in FREE_STUDIO_USE_AVAILABLE and didn't finish a pack,
        // or if their status is NONE, reset to ensure free use is properly tracked for the new attempt.
         updateUserProfile({ 
            creatorsStudioFreeUseConsumed: false, // Ensure it's false if starting over before consumption
            tier: UserSubscriptionTier.FREE_STUDIO_USE_AVAILABLE 
        });
    }
  };

  const renderStepContent = () => {
    let packAccessMessage = "";
    if (!isSubscribed() && !canUseCreatorStudioFree()) {
        packAccessMessage = " (Requires $1 Pay-Per-Use or Subscription)";
    } else if (!isSubscribed() && canUseCreatorStudioFree()) {
        packAccessMessage = " (Your First Pack is FREE!)";
    }


    switch (currentStepId) {
      case CreatorStepIdEnum.VISION:
        return (
          <div className="space-y-6">
            <div><label htmlFor="channelNiche" className="block text-sm font-semibold text-purple-300 mb-1">Your Channel Niche</label><input type="text" id="channelNiche" value={studioState.channelNiche} onChange={e => handleInputChange('channelNiche', e.target.value)} className="input-premium" placeholder="e.g., Indie Game Reviews"/></div>
            <div><label htmlFor="videoTopic" className="block text-sm font-semibold text-purple-300 mb-1">Specific Video Topic (Optional)</label><input type="text" id="videoTopic" value={studioState.videoTopic} onChange={e => handleInputChange('videoTopic', e.target.value)} className="input-premium" placeholder="e.g., Hidden Gems of Steam Next Fest"/></div>
            <div><label htmlFor="contentStyle" className="block text-sm font-semibold text-purple-300 mb-1">Desired Content Style/Vibe</label><input type="text" id="contentStyle" value={studioState.contentStyle} onChange={e => handleInputChange('contentStyle', e.target.value)} className="input-premium" placeholder="e.g., Witty & Informative"/></div>
            <button onClick={handleVisionGeneration} disabled={isLoading || !studioState.channelNiche.trim()} className="btn-premium w-full flex items-center justify-center"> {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Generate Vision</span> <LightBulbIcon className="w-5 h-5 ml-2"/></button>
          </div>
        );
      case CreatorStepIdEnum.SIGNATURE:
        return ( <div className="space-y-6"> {!studioState.visionOutput && <p className="text-amber-400">Complete 'Vision' first.</p>} {studioState.visionOutput && (<div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"><h4 className="font-semibold text-purple-300 mb-1">Recap - Vision:</h4><p className="text-xs text-slate-400">Titles: {studioState.visionOutput.titles.join(' / ')} | Audience: {studioState.visionOutput.audiencePersona}</p></div>)} <button onClick={handleSignatureGeneration} disabled={isLoading || !studioState.visionOutput} className="btn-premium w-full flex items-center justify-center"> {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Craft Visual Signature</span> <PaletteIcon className="w-5 h-5 ml-2"/></button> </div> );
      case CreatorStepIdEnum.BLUEPRINT:
        return ( <div className="space-y-6"> {!studioState.signatureOutput && <p className="text-amber-400">Complete 'Signature' first.</p>} {studioState.signatureOutput && (<div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"><h4 className="font-semibold text-purple-300 mb-1">Recap - Signature:</h4><p className="text-xs text-slate-400">Palette: {studioState.signatureOutput.colorPalettes[0]?.name} | Thumbnail: {studioState.signatureOutput.thumbnailConcepts[0]}</p></div>)} <button onClick={handleBlueprintGeneration} disabled={isLoading || !studioState.signatureOutput} className="btn-premium w-full flex items-center justify-center"> {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Develop Content Blueprint</span> <ClipboardDocumentListIcon className="w-5 h-5 ml-2"/></button> </div> );
      case CreatorStepIdEnum.AUDIO_ALCHEMY:
// Simple PlayIcon SVG definition
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.279 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const CreatorsEdgeStudioTool: React.FC = () => {
  const { userProfile, isSubscribed, canUseCreatorStudioFree, consumeCreatorStudioFreeUse, updateUserProfile } = useSubscription();
  const [currentStepId, setCurrentStepId] = useState<CreatorStepId>(CREATOR_STEPS_DATA[0].id);
  const [studioState, setStudioState] = useState<CreatorsEdgeState>({
    channelNiche: '',
    videoTopic: '',
    contentStyle: '',
    visionOutput: null,
    signatureOutput: null,
    blueprintOutput: null,
    audioOutput: { 
      musicStyleSuggestions: [],
      jingleIdeas: [],
      sfxConcepts: [],
      voiceOverTone: [],
      generatedMusic: [],
      generatedJingles: [],
      generatedSfx: [],
      generatedVoiceovers: [],
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false); // For main "Finalize Pack"
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false); // For text ideas
  const [isGeneratingJingles, setIsGeneratingJingles] = useState<boolean>(false); // For text ideas
  const [isGeneratingSfx, setIsGeneratingSfx] = useState<boolean>(false); // For text ideas
  const [isGeneratingVoiceTone, setIsGeneratingVoiceTone] = useState<boolean>(false); // For text ideas
  
  const [isGeneratingActualMusic, setIsGeneratingActualMusic] = useState<boolean>(false);
  const [isGeneratingActualJingles, setIsGeneratingActualJingles] = useState<boolean>(false);
  const [isGeneratingActualSfx, setIsGeneratingActualSfx] = useState<boolean>(false);
  const [isGeneratingActualVoiceover, setIsGeneratingActualVoiceover] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);


  const handleInputChange = (field: keyof CreatorsEdgeState, value: string) => {
    setStudioState(prev => ({ ...prev, [field]: value }));
  };
  
  const currentStepIndex = CREATOR_STEPS_DATA.findIndex(s => s.id === currentStepId);
  const CurrentStepIcon = CREATOR_STEPS_DATA[currentStepIndex]?.icon || WandSparklesIcon;


  const proceedToNextStep = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < CREATOR_STEPS_DATA.length) {
      setCurrentStepId(CREATOR_STEPS_DATA[nextStepIndex].id);
    }
  };
  
  const goToPrevStep = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStepId(CREATOR_STEPS_DATA[prevStepIndex].id);
    }
  };

  const parseJsonResponse = <T,>(jsonString: string, fallback: T): T => {
    try {
        let str = jsonString.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = str.match(fenceRegex);
        if (match && match[2]) {
            str = match[2].trim();
        }
        return JSON.parse(str);
    } catch (parseError) {
        console.error("Failed to parse JSON:", parseError, "Raw text:", jsonString);
        return fallback;
    }
  };

  const executeGenerationWithAccessCheck = async (generationFn: () => Promise<void>) => {
    if (isSubscribed()) {
      await generationFn();
      return;
    }
    if (canUseCreatorStudioFree() && currentStepId === CreatorStepIdEnum.PACK) { // Free use consumed at pack generation
      await generationFn();
      consumeCreatorStudioFreeUse(); // Consume AFTER successful pack generation
      return;
    }
    if (currentStepId === CreatorStepIdEnum.PACK && userProfile.tier === UserSubscriptionTier.POST_FREE_STUDIO_USE) {
      setPendingAction(() => generationFn); // Store the function to call after payment
      setShowPaymentModal(true);
      return;
    }
    // For steps before PACK, allow generation even if not subscribed and free use available/consumed
    // The actual "consumption" or "charge" happens at the final PACK step.
    await generationFn();
  };

  const handleVisionGenerationInternal = useCallback(async () => {
    if (!studioState.channelNiche.trim()) {
      setError('Channel Niche is essential for a focused vision.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const prompt = `
        For a content creator with this profile:
        Niche: ${studioState.channelNiche}
        Video Topic Idea (optional): ${studioState.videoTopic || "General channel content"}
        Desired Content Style: ${studioState.contentStyle || "Versatile"}
        Generate JSON for: titles (3), unique content angles (2-3), target audience persona.
        { "titles": [], "angles": [], "audiencePersona": "" }
      `;
      const resultText = await generateText(prompt, "AI co-producer for viral strategies.");
      const parsedResult = parseJsonResponse<CreatorVisionOutput>(resultText, { 
        titles: ["AI Error: Title gen failed"], angles: ["AI Error: Angle gen failed"], audiencePersona: "AI Error: Persona gen failed"
      });
      setStudioState(prev => ({ ...prev, visionOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  }, [studioState.channelNiche, studioState.videoTopic, studioState.contentStyle]);

  const handleSignatureGenerationInternal = useCallback(async () => {
    if (!studioState.visionOutput) { setError('Vision step must be completed.'); return; }
    setIsLoading(true); setError(null);
    try {
      const prompt = `Based on vision (Titles: ${studioState.visionOutput.titles.join(', ')}, Audience: ${studioState.visionOutput.audiencePersona}), Niche: ${studioState.channelNiche}. 
      Suggest JSON for: color palettes (2 options, name & 3-4 hex), font pairings (2 options, heading/body/vibe), thumbnail concepts (2 text descriptions).
      { "colorPalettes": [], "fontPairings": [], "thumbnailConcepts": [] }`;
      const resultText = await generateText(prompt, "AI branding expert for luxury/modern aesthetics.");
      const parsedResult = parseJsonResponse<CreatorSignatureOutput>(resultText, {
        colorPalettes: [{name:"Error Palette", colors:["#000"]}], fontPairings: [{heading:"ErrorFont", body:"ErrorFont", vibe:"Error"}], thumbnailConcepts: ["AI error for thumbnails."]
      });
      setStudioState(prev => ({ ...prev, signatureOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  }, [studioState.visionOutput, studioState.channelNiche]);

  const handleBlueprintGenerationInternal = useCallback(async () => {
    if (!studioState.visionOutput || !studioState.signatureOutput) { setError('Vision & Signature needed.'); return; }
    setIsLoading(true); setError(null);
    try {
      const prompt = `Vision (Titles: ${studioState.visionOutput.titles.join(', ')}, Topic: ${studioState.videoTopic || studioState.channelNiche}), Branding (Palette: ${studioState.signatureOutput.colorPalettes[0]?.name}).
      Generate JSON for content blueprint: key talking points (3-5), intro hooks (2-3), CTA phrases (2-3), interactive ideas (1-2).
      { "talkingPoints": [], "introHooks": [], "ctaPhrases": [], "interactiveIdeas": [] }`;
      const resultText = await generateText(prompt, "AI scriptwriter & engagement strategist.");
      const parsedResult = parseJsonResponse<CreatorBlueprintOutput>(resultText, {
        talkingPoints: ["AI error."], introHooks: ["AI error."], ctaPhrases: ["AI error."], interactiveIdeas: ["AI error."]
      });
      setStudioState(prev => ({ ...prev, blueprintOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  }, [studioState.visionOutput, studioState.signatureOutput, studioState.videoTopic, studioState.channelNiche, studioState.contentStyle]);

  const handleMusicIdeasGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint step must be completed first.'); return; }
    setIsGeneratingMusic(true); setError(null);
    try {
      const prompt = `
        Based on the project (Niche: ${studioState.channelNiche}, Topic: ${studioState.videoTopic || 'general content'}, Style: ${studioState.contentStyle || 'versatile'}), provide 2-3 distinct background music style suggestions.
        For each suggestion, include: mood (e.g., upbeat, mysterious, calm), genre (e.g., Lo-fi, cinematic orchestral, acoustic folk), tempo (e.g., slow, medium, fast), key instrumentation (e.g., piano and strings, synth pads and drum machine, acoustic guitar), and a brief thematic description.
        Format as a JSON object: { "musicStyleSuggestions": [ { "mood": "...", "genre": "...", "tempo": "...", "instrumentation": "...", "description": "..." }, ... ] }
      `;
      const resultText = await generateText(prompt, "AI music supervisor for content creators.");
      const parsedResult = parseJsonResponse<{ musicStyleSuggestions: Array<{ mood: string; genre: string; tempo: string; instrumentation: string; description: string }> }>(resultText, { musicStyleSuggestions: [] });
      
      const formattedSuggestions = parsedResult.musicStyleSuggestions.map(s => 
        `Mood: ${s.mood}, Genre: ${s.genre}, Tempo: ${s.tempo}, Instruments: ${s.instrumentation}, Description: ${s.description}`
      );

      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { 
            musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
            generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: [] 
          }),
          musicStyleSuggestions: formattedSuggestions,
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingMusic(false); }
  }, [studioState.channelNiche, studioState.videoTopic, studioState.contentStyle, studioState.blueprintOutput]);

  const handleJingleIdeasGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint step must be completed first.'); return; }
    setIsGeneratingJingles(true); setError(null);
    try {
      const prompt = `
        For a creator with Niche: ${studioState.channelNiche} and Style: ${studioState.contentStyle || 'versatile'}, generate 1-2 short, catchy jingle concepts.
        For each concept, include: a brief conceptual description, suggested musical style, and a short lyrical snippet (if applicable, keep it under 10 words).
        Format as a JSON object: { "jingleIdeas": [ { "concept": "...", "style": "...", "lyric": "..." }, ... ] }
      `;
      const resultText = await generateText(prompt, "AI jingle writer for branding.");
      const parsedResult = parseJsonResponse<{ jingleIdeas: Array<{ concept: string; style: string; lyric: string }> }>(resultText, { jingleIdeas: [] });
      
      const formattedJingles = parsedResult.jingleIdeas.map(j => 
        `Concept: ${j.concept}, Style: ${j.style}, Lyric: ${j.lyric || 'Instrumental'}`
      );

      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { 
            musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
            generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: [] 
          }),
          jingleIdeas: formattedJingles,
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingJingles(false); }
  }, [studioState.channelNiche, studioState.contentStyle, studioState.blueprintOutput]);

  const handleSfxIdeasGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint step must be completed first.'); return; }
    setIsGeneratingSfx(true); setError(null);
    try {
      const prompt = `
        Considering the video topic "${studioState.videoTopic || studioState.channelNiche}" and content style "${studioState.contentStyle || 'versatile'}", suggest 2-3 relevant sound effect concepts.
        For each SFX, describe: the sound event, its character (e.g., sharp, whooshing, subtle), and a potential use case in a video.
        Format as a JSON object: { "sfxConcepts": [ { "event": "...", "character": "...", "use_case": "..." }, ... ] }
      `;
      const resultText = await generateText(prompt, "AI sound designer for video content.");
      const parsedResult = parseJsonResponse<{ sfxConcepts: Array<{ event: string; character: string; use_case: string }> }>(resultText, { sfxConcepts: [] });
      
      const formattedSfx = parsedResult.sfxConcepts.map(s => 
        `Event: ${s.event}, Character: ${s.character}, Use Case: ${s.use_case}`
      );

      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { 
            musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
            generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: [] 
          }),
          sfxConcepts: formattedSfx,
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingSfx(false); }
  }, [studioState.videoTopic, studioState.channelNiche, studioState.contentStyle, studioState.blueprintOutput]);

  const handleVoiceoverToneGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint step must be completed first.'); return; }
    setIsGeneratingVoiceTone(true); setError(null);
    try {
      const prompt = `
        For content with style "${studioState.contentStyle || 'versatile'}" and topic "${studioState.videoTopic || studioState.channelNiche}", suggest 1-2 distinct voiceover tone options.
        For each option, describe: the vocal quality (e.g., deep, friendly, energetic), delivery style (e.g., conversational, authoritative, sarcastic), and perceived emotion (e.g., enthusiastic, serious, humorous).
        Format as a JSON object: { "voiceOverTone": [ { "quality": "...", "delivery": "...", "emotion": "..." }, ... ] }
      `;
      const resultText = await generateText(prompt, "AI voice coach for narration.");
      // Ensure the type here matches the changed CreatorAudioOutput.voiceOverTone to string[]
      const parsedResult = parseJsonResponse<{ voiceOverTone: Array<{ quality: string; delivery: string; emotion: string }> }>(resultText, { voiceOverTone: [] });
      
      const formattedTones = parsedResult.voiceOverTone.map(t => 
        `Quality: ${t.quality}, Delivery: ${t.delivery}, Emotion: ${t.emotion}`
      );

      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { 
            musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
            generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: [] 
          }),
          voiceOverTone: formattedTones, // voiceOverTone is now string[]
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingVoiceTone(false); }
  }, [studioState.contentStyle, studioState.videoTopic, studioState.channelNiche, studioState.blueprintOutput]);
  
  const handleAudioGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) {
      setError('Blueprint step must be completed before finalizing audio.');
      return;
    }
    // Optional: Check if at least one audio category has been generated
    const { audioOutput } = studioState;
    if (!audioOutput || 
        (audioOutput.musicStyleSuggestions.length === 0 &&
         audioOutput.jingleIdeas.length === 0 &&
         audioOutput.sfxConcepts.length === 0 &&
         (audioOutput.voiceOverTone?.length || 0) === 0) && // check voiceOverTone length
        (audioOutput.generatedMusic.length === 0 && // Also check generated assets
         audioOutput.generatedJingles.length === 0 &&
         audioOutput.generatedSfx.length === 0 &&
         audioOutput.generatedVoiceovers.length === 0)
        ) {
      setError("Please generate at least one set of audio ideas or one actual audio asset before finalizing the pack.");
      return;
    }

    setIsLoading(true); // Use main isLoading for the finalize step
    setError(null);
    
    // No generation happens here anymore, just proceeding to pack after checks
    try {
      if (isSubscribed()) {
        proceedToNextStep(); // Directly go to PACK
      } else if (canUseCreatorStudioFree()) {
        consumeCreatorStudioFreeUse();
        proceedToNextStep(); // Go to PACK
      } else { // Needs to pay
        setShowPaymentModal(true);
        setPendingAction(() => async () => {
          proceedToNextStep();
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [studioState.blueprintOutput, studioState.audioOutput, isSubscribed, canUseCreatorStudioFree, consumeCreatorStudioFreeUse, proceedToNextStep]);


  // Wrappers for individual audio generation (no access check for these sub-steps)
  const handleGenerateMusicIdeas = () => handleMusicIdeasGenerationInternal();
  const handleGenerateJingleIdeas = () => handleJingleIdeasGenerationInternal();
  const handleGenerateSfxIdeas = () => handleSfxIdeasGenerationInternal();
  const handleGenerateVoiceTone = () => handleVoiceoverToneGenerationInternal();

  // --- New Handlers for Generating Actual Audio Assets ---
  const handleGenerateActualMusic = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed.'); return; }
    setIsGeneratingActualMusic(true); setError(null);
    try {
      const firstIdea = studioState.audioOutput?.musicStyleSuggestions?.[0] || "Upbeat cinematic background music";
      const newAsset = await generateMusicSnippet(firstIdea, studioState.contentStyle || undefined);
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...prev.audioOutput!,
          generatedMusic: [...(prev.audioOutput!.generatedMusic || []), newAsset],
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingActualMusic(false); }
  }, [studioState.blueprintOutput, studioState.audioOutput?.musicStyleSuggestions, studioState.contentStyle]);

  const handleGenerateActualJingle = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed.'); return; }
    setIsGeneratingActualJingles(true); setError(null);
    try {
      const firstIdea = studioState.audioOutput?.jingleIdeas?.[0] || "Short catchy jingle for channel intro";
      // Using generateMusicSnippet for jingles as per type definition
      const newAsset = await generateMusicSnippet(firstIdea, studioState.contentStyle || undefined, 10); // Shorter duration for jingles
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...prev.audioOutput!,
          // Assuming jingles are a type of MusicAsset and stored in generatedJingles
          generatedJingles: [...(prev.audioOutput!.generatedJingles || []), { ...newAsset, type: 'jingle' as const }],
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingActualJingles(false); }
  }, [studioState.blueprintOutput, studioState.audioOutput?.jingleIdeas, studioState.contentStyle]);

  const handleGenerateActualSfx = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed.'); return; }
    setIsGeneratingActualSfx(true); setError(null);
    try {
      const firstIdea = studioState.audioOutput?.sfxConcepts?.[0] || "Digital whoosh sound effect";
      const newAsset = await generateSoundEffect(firstIdea);
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...prev.audioOutput!,
          generatedSfx: [...(prev.audioOutput!.generatedSfx || []), newAsset],
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingActualSfx(false); }
  }, [studioState.blueprintOutput, studioState.audioOutput?.sfxConcepts]);

  const handleGenerateActualVoiceover = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed.'); return; }
    setIsGeneratingActualVoiceover(true); setError(null);
    try {
      const textForVoiceover = studioState.blueprintOutput?.introHooks?.[0] || "Welcome to the channel!";
      const voiceToneIdea = studioState.audioOutput?.voiceOverTone?.[0] || "Neutral and friendly"; // Could parse this for style/emotion
      const newAsset = await generateVoiceoverSnippet(textForVoiceover, voiceToneIdea); // Pass voiceToneIdea as style for now
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...prev.audioOutput!,
          generatedVoiceovers: [...(prev.audioOutput!.generatedVoiceovers || []), newAsset],
        },
      }));
    } catch (err) { setError((err as Error).message); } finally { setIsGeneratingActualVoiceover(false); }
  }, [studioState.blueprintOutput?.introHooks, studioState.audioOutput?.voiceOverTone]);


  // Wrappers that call executeGenerationWithAccessCheck (for main step progression)
  const handleVisionGeneration = () => executeGenerationWithAccessCheck(handleVisionGenerationInternal);
  const handleSignatureGeneration = () => executeGenerationWithAccessCheck(handleSignatureGenerationInternal);
  const handleBlueprintGeneration = () => executeGenerationWithAccessCheck(handleBlueprintGenerationInternal);
  const handleAudioGeneration = () => executeGenerationWithAccessCheck(handleAudioGenerationInternal); // This is for "Finalize Pack & Proceed"


  const handleConfirmPayPerUse = async () => {
    setShowPaymentModal(false);
    if (pendingAction) {
        setIsLoading(true); // Show loading for the pending action
        await pendingAction();
        setPendingAction(null);
        setIsLoading(false);
    }
  };

  const startNewPack = () => {
    setCurrentStepId(CreatorStepIdEnum.VISION);
    setStudioState({
        channelNiche: '', videoTopic: '', contentStyle: '',
        visionOutput: null, signatureOutput: null, blueprintOutput: null, 
        audioOutput: { // Reset audioOutput to its initial state including generated asset arrays
          musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: [],
          generatedMusic: [], generatedJingles: [], generatedSfx: [], generatedVoiceovers: []
        },
    });
    // If user is NOT subscribed and had consumed their free use,
    // starting a "new pack" effectively resets them to needing to pay for the *next* one,
    // or if they somehow get here without consuming free use, it should remain available.
    // The consumption happens AT pack finalization.
    // This logic ensures if they start over, their free use isn't reset unless they are not truly "post free use"
    if (userProfile.tier === UserSubscriptionTier.POST_FREE_STUDIO_USE && !isSubscribed()) {
        // They remain in POST_FREE_STUDIO_USE, so next pack will cost $1
    } else if (!isSubscribed()) {
        // If they were somehow in FREE_STUDIO_USE_AVAILABLE and didn't finish a pack,
        // or if their status is NONE, reset to ensure free use is properly tracked for the new attempt.
         updateUserProfile({ 
            creatorsStudioFreeUseConsumed: false, // Ensure it's false if starting over before consumption
            tier: UserSubscriptionTier.FREE_STUDIO_USE_AVAILABLE 
        });
    }
  };

  const renderStepContent = () => {
    let packAccessMessage = "";
    if (!isSubscribed() && !canUseCreatorStudioFree()) {
        packAccessMessage = " (Requires $1 Pay-Per-Use or Subscription)";
    } else if (!isSubscribed() && canUseCreatorStudioFree()) {
        packAccessMessage = " (Your First Pack is FREE!)";
    }


    switch (currentStepId) {
      case CreatorStepIdEnum.VISION:
        return (
          <div className="space-y-6">
            <div><label htmlFor="channelNiche" className="block text-sm font-semibold text-purple-300 mb-1">Your Channel Niche</label><input type="text" id="channelNiche" value={studioState.channelNiche} onChange={e => handleInputChange('channelNiche', e.target.value)} className="input-premium" placeholder="e.g., Indie Game Reviews"/></div>
            <div><label htmlFor="videoTopic" className="block text-sm font-semibold text-purple-300 mb-1">Specific Video Topic (Optional)</label><input type="text" id="videoTopic" value={studioState.videoTopic} onChange={e => handleInputChange('videoTopic', e.target.value)} className="input-premium" placeholder="e.g., Hidden Gems of Steam Next Fest"/></div>
            <div><label htmlFor="contentStyle" className="block text-sm font-semibold text-purple-300 mb-1">Desired Content Style/Vibe</label><input type="text" id="contentStyle" value={studioState.contentStyle} onChange={e => handleInputChange('contentStyle', e.target.value)} className="input-premium" placeholder="e.g., Witty & Informative"/></div>
            <button onClick={handleVisionGeneration} disabled={isLoading || !studioState.channelNiche.trim()} className="btn-premium w-full flex items-center justify-center"> {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Generate Vision</span> <LightBulbIcon className="w-5 h-5 ml-2"/></button>
          </div>
        );
      case CreatorStepIdEnum.SIGNATURE:
        return ( <div className="space-y-6"> {!studioState.visionOutput && <p className="text-amber-400">Complete 'Vision' first.</p>} {studioState.visionOutput && (<div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"><h4 className="font-semibold text-purple-300 mb-1">Recap - Vision:</h4><p className="text-xs text-slate-400">Titles: {studioState.visionOutput.titles.join(' / ')} | Audience: {studioState.visionOutput.audiencePersona}</p></div>)} <button onClick={handleSignatureGeneration} disabled={isLoading || !studioState.visionOutput} className="btn-premium w-full flex items-center justify-center"> {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Craft Visual Signature</span> <PaletteIcon className="w-5 h-5 ml-2"/></button> </div> );
      case CreatorStepIdEnum.BLUEPRINT:
        return ( <div className="space-y-6"> {!studioState.signatureOutput && <p className="text-amber-400">Complete 'Signature' first.</p>} {studioState.signatureOutput && (<div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"><h4 className="font-semibold text-purple-300 mb-1">Recap - Signature:</h4><p className="text-xs text-slate-400">Palette: {studioState.signatureOutput.colorPalettes[0]?.name} | Thumbnail: {studioState.signatureOutput.thumbnailConcepts[0]}</p></div>)} <button onClick={handleBlueprintGeneration} disabled={isLoading || !studioState.signatureOutput} className="btn-premium w-full flex items-center justify-center"> {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Develop Content Blueprint</span> <ClipboardDocumentListIcon className="w-5 h-5 ml-2"/></button> </div> );
      case CreatorStepIdEnum.AUDIO_ALCHEMY:
        return (
          <div className="space-y-6">
            {!studioState.blueprintOutput && <p className="text-amber-400">Complete 'Blueprint' first.</p>}
            {studioState.blueprintOutput && (
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-purple-300 mb-1">Recap - Blueprint:</h4>
                <p className="text-xs text-slate-400">Talking Point: {studioState.blueprintOutput.talkingPoints[0]} | Intro Hook: {studioState.blueprintOutput.introHooks[0]}</p>
              </div>
            )}

            {studioState.blueprintOutput && (
              <div className="space-y-6">
                {/* Background Music Ideas */}
                <div className="card-neutral p-4 space-y-3">
                  <h5 className="text-xl font-semibold text-pink-400 mb-2">Background Music Ideas</h5>
                  <button onClick={handleGenerateMusicIdeas} disabled={isGeneratingMusic || isLoading} className="btn-secondary w-full mb-3 flex items-center justify-center">
                    {isGeneratingMusic && <LoadingSpinner size="sm" />}
                    <span className={isGeneratingMusic ? 'ml-2' : ''}>Generate Music Ideas</span>
                  </button>
                  <div className="text-slate-300 text-sm p-3 bg-slate-800/70 rounded-md min-h-[50px]">
                    {studioState.audioOutput?.musicStyleSuggestions && studioState.audioOutput.musicStyleSuggestions.length > 0
                      ? studioState.audioOutput.musicStyleSuggestions.map((s, i) => <p key={i} className="mb-1">{s}</p>)
                      : 'Music ideas will appear here...'}
                  </div>
                  <button onClick={handleGenerateActualMusic} disabled={isGeneratingActualMusic || isLoading || isGeneratingMusic} className="btn-action w-full mt-3 flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    {isGeneratingActualMusic && <LoadingSpinner size="sm" />}
                    <span className={isGeneratingActualMusic ? 'ml-2' : ''}>Generate Music Snippet</span>
                  </button>
                  <div className="mt-4 space-y-2">
                    {studioState.audioOutput?.generatedMusic?.map(asset => (
                      <div key={asset.id} className="bg-slate-700/70 p-3 rounded-md flex justify-between items-center">
                        <span className="text-sm text-slate-200 truncate pr-2" title={asset.description}>
                          {asset.description.length > 40 ? asset.description.substring(0, 37) + "..." : asset.description}
                          {` (${asset.duration}s, ${asset.genre})`}
                        </span>
                        <button onClick={() => console.log('Mock play audio:', asset.audioUrl)} className="btn-icon p-1 rounded-full hover:bg-slate-600 transition-colors" title={`Play (mock) ${asset.audioUrl}`}>
                          <PlayIcon className="w-5 h-5 text-teal-400" />
                        </button>
                      </div>
                    ))}
                    {(studioState.audioOutput?.generatedMusic?.length || 0) === 0 && !isGeneratingActualMusic && <p className="text-xs text-slate-500 text-center py-1">No music snippets generated yet.</p>}
                  </div>
                </div>

                {/* Jingle Concepts */}
                <div className="card-neutral p-4 space-y-3">
                  <h5 className="text-xl font-semibold text-pink-400 mb-2">Jingle Concepts</h5>
                  <button onClick={handleGenerateJingleIdeas} disabled={isGeneratingJingles || isLoading} className="btn-secondary w-full mb-3 flex items-center justify-center">
                    {isGeneratingJingles && <LoadingSpinner size="sm" />}
                    <span className={isGeneratingJingles ? 'ml-2' : ''}>Generate Jingle Concepts</span>
                  </button>
                  <div className="text-slate-300 text-sm p-3 bg-slate-800/70 rounded-md min-h-[50px]">
                    {studioState.audioOutput?.jingleIdeas && studioState.audioOutput.jingleIdeas.length > 0
                      ? studioState.audioOutput.jingleIdeas.map((s, i) => <p key={i} className="mb-1">{s}</p>)
                      : 'Jingle concepts will appear here...'}
                  </div>
                  <button onClick={handleGenerateActualJingle} disabled={isGeneratingActualJingles || isLoading || isGeneratingJingles} className="btn-action w-full mt-3 flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    {isGeneratingActualJingles && <LoadingSpinner size="sm" />}
                    <span className={isGeneratingActualJingles ? 'ml-2' : ''}>Generate Jingle Snippet</span>
                  </button>
                   <div className="mt-4 space-y-2">
                    {studioState.audioOutput?.generatedJingles?.map(asset => (
                      <div key={asset.id} className="bg-slate-700/70 p-3 rounded-md flex justify-between items-center">
                        <span className="text-sm text-slate-200 truncate pr-2" title={asset.description}>
                          {asset.description.length > 40 ? asset.description.substring(0, 37) + "..." : asset.description}
                           {` (${asset.duration}s, ${asset.genre})`}
                        </span>
                        <button onClick={() => console.log('Mock play audio:', asset.audioUrl)} className="btn-icon p-1 rounded-full hover:bg-slate-600 transition-colors" title={`Play (mock) ${asset.audioUrl}`}>
                          <PlayIcon className="w-5 h-5 text-teal-400" />
                        </button>
                      </div>
                    ))}
                    {(studioState.audioOutput?.generatedJingles?.length || 0) === 0 && !isGeneratingActualJingles && <p className="text-xs text-slate-500 text-center py-1">No jingle snippets generated yet.</p>}
                  </div>
                </div>

                {/* Sound Effect Ideas */}
                <div className="card-neutral p-4 space-y-3">
                  <h5 className="text-xl font-semibold text-pink-400 mb-2">Sound Effect Ideas</h5>
                  <button onClick={handleGenerateSfxIdeas} disabled={isGeneratingSfx || isLoading} className="btn-secondary w-full mb-3 flex items-center justify-center">
                    {isGeneratingSfx && <LoadingSpinner size="sm" />}
                    <span className={isGeneratingSfx ? 'ml-2' : ''}>Generate SFX Ideas</span>
                  </button>
                  <div className="text-slate-300 text-sm p-3 bg-slate-800/70 rounded-md min-h-[50px]">
                    {studioState.audioOutput?.sfxConcepts && studioState.audioOutput.sfxConcepts.length > 0
                      ? studioState.audioOutput.sfxConcepts.map((s, i) => <p key={i} className="mb-1">{s}</p>)
                      : 'Sound effect ideas will appear here...'}
                  </div>
                  <button onClick={handleGenerateActualSfx} disabled={isGeneratingActualSfx || isLoading || isGeneratingSfx} className="btn-action w-full mt-3 flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    {isGeneratingActualSfx && <LoadingSpinner size="sm" />}
                    <span className={isGeneratingActualSfx ? 'ml-2' : ''}>Generate SFX</span>
                  </button>
                  <div className="mt-4 space-y-2">
                    {studioState.audioOutput?.generatedSfx?.map(asset => (
                      <div key={asset.id} className="bg-slate-700/70 p-3 rounded-md flex justify-between items-center">
                        <span className="text-sm text-slate-200 truncate pr-2" title={asset.description}>
                          {asset.description.length > 40 ? asset.description.substring(0, 37) + "..." : asset.description}
                          {asset.sfxCategory && ` (${asset.sfxCategory})`}
                        </span>
                        <button onClick={() => console.log('Mock play audio:', asset.audioUrl)} className="btn-icon p-1 rounded-full hover:bg-slate-600 transition-colors" title={`Play (mock) ${asset.audioUrl}`}>
                          <PlayIcon className="w-5 h-5 text-teal-400" />
                        </button>
                      </div>
                    ))}
                    {(studioState.audioOutput?.generatedSfx?.length || 0) === 0 && !isGeneratingActualSfx && <p className="text-xs text-slate-500 text-center py-1">No SFX generated yet.</p>}
                  </div>
                </div>

                {/* Voiceover Tone Suggestions */}
                <div className="card-neutral p-4 space-y-3">
                  <h5 className="text-xl font-semibold text-pink-400 mb-2">Voiceover Tone Suggestions</h5>
                  <button onClick={handleGenerateVoiceTone} disabled={isGeneratingVoiceTone || isLoading} className="btn-secondary w-full mb-3 flex items-center justify-center">
                    {isGeneratingVoiceTone && <LoadingSpinner size="sm" />}
                    <span className={isGeneratingVoiceTone ? 'ml-2' : ''}>Generate Voiceover Tone</span>
                  </button>
                  <div className="text-slate-300 text-sm p-3 bg-slate-800/70 rounded-md min-h-[50px]">
                    {studioState.audioOutput?.voiceOverTone && studioState.audioOutput.voiceOverTone.length > 0
                      ? studioState.audioOutput.voiceOverTone.map((s, i) => <p key={i} className="mb-1">{s}</p>)
                      : 'Voiceover tone suggestions will appear here...'}
                  </div>
                  <button onClick={handleGenerateActualVoiceover} disabled={isGeneratingActualVoiceover || isLoading || isGeneratingVoiceTone || !studioState.blueprintOutput?.introHooks?.[0]} className="btn-action w-full mt-3 flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    {isGeneratingActualVoiceover && <LoadingSpinner size="sm" />}
                    <span className={isGeneratingActualVoiceover ? 'ml-2' : ''}>Generate Voiceover Snippet</span>
                  </button>
                   <div className="mt-4 space-y-2">
                    {studioState.audioOutput?.generatedVoiceovers?.map(asset => (
                      <div key={asset.id} className="bg-slate-700/70 p-3 rounded-md flex justify-between items-center">
                        <span className="text-sm text-slate-200 truncate pr-2" title={asset.text}>
                          VO: "{asset.text.length > 30 ? asset.text.substring(0, 27) + "..." : asset.text}"
                          {asset.voiceUsed && ` (${asset.voiceUsed})`}
                        </span>
                        <button onClick={() => console.log('Mock play audio:', asset.audioUrl)} className="btn-icon p-1 rounded-full hover:bg-slate-600 transition-colors" title={`Play (mock) ${asset.audioUrl}`}>
                          <PlayIcon className="w-5 h-5 text-teal-400" />
                        </button>
                      </div>
                    ))}
                    {(studioState.audioOutput?.generatedVoiceovers?.length || 0) === 0 && !isGeneratingActualVoiceover && <p className="text-xs text-slate-500 text-center py-1">No voiceover snippets generated yet.</p>}
                  </div>
                </div>

                {/* Future Vision Section */}
                <div className="mt-10 pt-6 border-t border-slate-700/30">
                  <h4 className="text-2xl font-semibold text-amber-300 mb-4 text-center">
                    <WandSparklesIcon className="w-6 h-6 inline mr-2 text-amber-300" />
                    Future Vision: Enhanced Audio Crafting
                    <WandSparklesIcon className="w-6 h-6 inline ml-2 text-amber-300" />
                  </h4>
                  <p className="text-sm text-slate-400 mb-3 leading-relaxed text-center">
                    The audio snippets you've generated above are conceptual placeholders from our mock "FutureSound API".
                    Imagine taking this to the next level:
                  </p>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                    <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside pl-2">
                      <li>
                        <strong>Real Audio Playback & Management:</strong>
                        <span className="text-slate-400 block pl-4">Imagine directly previewing and managing your generated audio! Future versions would allow you to play, pause, and adjust the volume of each music snippet, SFX, and voiceover. You could favorite your top choices, see waveforms, and easily manage lists of generated sounds.</span>
                      </li>
                      <li>
                        <strong>Interactive Generation & Tweaking:</strong>
                        <span className="text-slate-400 block pl-4">Go beyond fixed prompts! The next level of audio crafting would involve interactive controls. Imagine tweaking the tempo or mood of generated music, changing voice characteristics for voiceovers, or refining SFX with simple commands – all powered by more advanced AI models.</span>
                      </li>
                      <li>
                        <strong>AI-Powered Content-Aware Suggestions:</strong>
                        <span className="text-slate-400 block pl-4">Your AI Co-Producer could be even smarter. Future enhancements could include AI suggestions for sound effects based on keywords from your Content Blueprint, or music mood recommendations that perfectly match your video's style defined in 'The Vision' step.</span>
                      </li>
                      <li>
                        <strong>Advanced Voice Synthesis (Ethical Considerations):</strong>
                        <span className="text-slate-400 block pl-4">For voiceovers, picture advanced text-to-speech with a wide range of natural voices. With ethical considerations and user consent, future possibilities might even include options for voice cloning or custom voice styles for truly unique branding.</span>
                      </li>
                      <li>
                        <strong>AI-Assisted Soundscaping & Export:</strong>
                        <span className="text-slate-400 block pl-4">Ultimately, you could layer these generated elements – music, SFX, voiceovers – into a simple soundscape right here. Then, export your audio pack for easy use in your editing software.</span>
                      </li>
                    </ul>
                     <p className="text-xs text-slate-500 mt-4 text-center">
                        The current audio snippets are conceptual placeholders. A fully realized version would integrate powerful, real-time AI audio generation APIs (our 'FutureSound API') to bring these features to life. This is the cutting-edge experience Pegasus Edge aims to deliver!
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 text-center pt-8">Final Step: Review your generated audio concepts and assets above. When ready, finalize your pack.{packAccessMessage}</p>
                <button 
                  onClick={handleAudioGeneration} 
                  disabled={isLoading || isGeneratingMusic || isGeneratingJingles || isGeneratingSfx || isGeneratingVoiceTone || isGeneratingActualMusic || isGeneratingActualJingles || isGeneratingActualSfx || isGeneratingActualVoiceover || !studioState.blueprintOutput} 
                  className="btn-premium w-full flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 mt-6"
                >
                  {(isLoading && !(isGeneratingMusic || isGeneratingJingles || isGeneratingSfx || isGeneratingVoiceTone || isGeneratingActualMusic || isGeneratingActualJingles || isGeneratingActualSfx || isGeneratingActualVoiceover)) && <LoadingSpinner size="sm" />} 
                  <span className={(isLoading && !(isGeneratingMusic || isGeneratingJingles || isGeneratingSfx || isGeneratingVoiceTone || isGeneratingActualMusic || isGeneratingActualJingles || isGeneratingActualSfx || isGeneratingActualVoiceover)) ? 'ml-2' : ''}>Finalize Pack & Proceed</span>
                  <PackageIcon className="w-5 h-5 ml-2"/>
                </button>
              </div>
            )}
          </div>
        );
      case CreatorStepIdEnum.PACK:
        // Prepare to display generated assets in the PACK view
        const { generatedMusic = [], generatedJingles = [], generatedSfx = [], generatedVoiceovers = [] } = studioState.audioOutput || {};
        const allGeneratedAssets = [
            ...generatedMusic.map(a => ({ ...a, label: "Music Snippet" })), 
            ...generatedJingles.map(a => ({ ...a, label: "Jingle Snippet" })), 
            ...generatedSfx.map(a => ({ ...a, label: "SFX" })), 
            ...generatedVoiceovers.map(a => ({ ...a, label: "Voiceover" }))
        ];

        return (
            <div className="space-y-6">
                <h3 className="font-display text-3xl text-amber-400 text-center">Your Creator's Edge Pack!</h3>
                {studioState.visionOutput && ( <div className="card-premium p-4"> <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><LightBulbIcon className="w-6 h-6 mr-2"/>The Vision</h4> <p><strong>Titles:</strong> {studioState.visionOutput.titles.join(' | ')}</p><p><strong>Angles:</strong> {studioState.visionOutput.angles.join(' | ')}</p><p><strong>Audience:</strong> {studioState.visionOutput.audiencePersona}</p> </div>)}
                {studioState.signatureOutput && ( <div className="card-premium p-4"> <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><PaletteIcon className="w-6 h-6 mr-2"/>Visual Signature</h4> {studioState.signatureOutput.colorPalettes.map(p => <p key={p.name}><strong>Palette {p.name}:</strong> ({p.colors.join(', ')})</p>)} {studioState.signatureOutput.fontPairings.map((f,i) => <p key={i}><strong>Fonts {i+1}:</strong> {f.heading} & {f.body} ({f.vibe})</p>)} <p><strong>Thumbnails:</strong> {studioState.signatureOutput.thumbnailConcepts.join(' | ')}</p> </div>)}
                {studioState.blueprintOutput && ( <div className="card-premium p-4"> <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><ClipboardDocumentListIcon className="w-6 h-6 mr-2"/>Content Blueprint</h4> <p><strong>Points:</strong> {studioState.blueprintOutput.talkingPoints.join(' | ')}</p><p><strong>Hooks:</strong> {studioState.blueprintOutput.introHooks.join(' | ')}</p><p><strong>CTAs:</strong> {studioState.blueprintOutput.ctaPhrases.join(' | ')}</p><p><strong>Interactive:</strong> {studioState.blueprintOutput.interactiveIdeas.join(' | ')}</p> </div>)}
                
                {/* Display Text-Based Audio Ideas */}
                {studioState.audioOutput && (studioState.audioOutput.musicStyleSuggestions.length > 0 || studioState.audioOutput.jingleIdeas.length > 0 || studioState.audioOutput.sfxConcepts.length > 0 || (studioState.audioOutput.voiceOverTone?.length || 0) > 0) && (
                  <div className="card-premium p-4">
                    <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><MusicalNoteIcon className="w-6 h-6 mr-2"/>Audio Ideas & Concepts</h4>
                    {studioState.audioOutput.musicStyleSuggestions.length > 0 && <p><strong>Music Ideas:</strong> {studioState.audioOutput.musicStyleSuggestions.join(' | ')}</p>}
                    {studioState.audioOutput.jingleIdeas.length > 0 && <p><strong>Jingle Concepts:</strong> {studioState.audioOutput.jingleIdeas.join(' | ')}</p>}
                    {studioState.audioOutput.sfxConcepts.length > 0 && <p><strong>SFX Concepts:</strong> {studioState.audioOutput.sfxConcepts.join(' | ')}</p>}
                    {(studioState.audioOutput.voiceOverTone?.length || 0) > 0 && <p><strong>Voice Tone Ideas:</strong> {studioState.audioOutput.voiceOverTone?.join(' | ')}</p>}
                  </div>
                )}

                {/* Display Generated Audio Assets */}
                {allGeneratedAssets.length > 0 && (
                    <div className="card-premium p-4">
                        <h4 className="text-xl font-semibold text-purple-300 mb-3 flex items-center"><PlayIcon className="w-6 h-6 mr-2 text-teal-400"/>Generated Audio Assets</h4>
                        <div className="space-y-3">
                            {allGeneratedAssets.map(asset => (
                                <div key={asset.id} className="bg-slate-800/60 p-3 rounded-lg flex justify-between items-center shadow">
                                    <div>
                                        <p className="text-base font-medium text-slate-100">{asset.label}: <span className="font-normal text-slate-300">{asset.description.length > 60 ? asset.description.substring(0,57) + "..." : asset.description}</span></p>
                                        {asset.type === 'music' || asset.type === 'jingle' ? <p className="text-xs text-slate-400">Duration: {asset.duration}s, Genre: {asset.genre}, Mood: {asset.mood}</p> : null}
                                        {asset.type === 'sfx' ? <p className="text-xs text-slate-400">Category: {asset.sfxCategory}, Character: {asset.character?.join(', ')}</p> : null}
                                        {asset.type === 'voiceover' ? <p className="text-xs text-slate-400">Voice: {asset.voiceUsed}, Emotion: {asset.emotion}, Text: "{asset.text.substring(0,40)}..."</p> : null}
                                    </div>
                                    <button 
                                        onClick={() => console.log('Mock play audio:', asset.audioUrl)} 
                                        className="btn-icon p-2 rounded-full hover:bg-teal-600/20 transition-colors"
                                        title={`Play (mock) ${asset.audioUrl}`}
                                    >
                                        <PlayIcon className="w-6 h-6 text-teal-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                 <div className="text-center pt-4"> <p className="text-sm text-slate-400">This Edge Pack is your launchpad. <Link to="/subscriptions" className="font-semibold text-amber-400 hover:text-hotpink">Go Pro</Link> for more!</p>
                    <button onClick={startNewPack} className="btn-secondary mt-6">Start New Edge Pack</button>
                </div>
            </div>
        );
      default: return <p>Unknown step.</p>;
    }
  };

  return (
    <>
    <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPendingAction(null); }}
        onConfirmPayment={handleConfirmPayPerUse}
        plan={PAY_PER_USE_PLAN_INFO}
    />
    <div className="card-premium p-6 sm:p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-20 -right-10 w-80 h-80 bg-amber-500/10 rounded-full filter blur-3xl opacity-50 animate-pulse delay-1000"></div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-center mb-8 pb-6 border-b border-slate-700/50">
          <CurrentStepIcon className="w-12 h-12 md:w-16 md:h-16 text-amber-400 mr-4 mb-4 sm:mb-0 flex-shrink-0" />
          <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-100">
                {CREATOR_STEPS_DATA[currentStepIndex].name}
              </h2>
              <p className="text-purple-300 text-sm">Step {currentStepIndex + 1} of {CREATOR_STEPS_DATA.length}: Crafting your unique edge.</p>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between mb-1">
              {CREATOR_STEPS_DATA.map((step, index) => (
                  <span key={step.id} className={`text-xs font-medium ${index <= currentStepIndex ? 'text-amber-400' : 'text-slate-500'}`}>
                      {step.name}
                  </span>
              ))}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5"> <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${((currentStepIndex + 1) / CREATOR_STEPS_DATA.length) * 100}%` }}></div> </div>
        </div>

        {error && ( <div className="my-4 p-3 bg-red-800/50 border border-red-600 rounded-md text-red-300"> <p><strong>Hold Up:</strong> {error}</p> </div>)}
        <div className="min-h-[250px]"> {renderStepContent()} </div>
        <div className="mt-10 flex justify-between items-center pt-6 border-t border-slate-700/50">
          <button onClick={goToPrevStep} disabled={currentStepIndex === 0 || isLoading} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"> &larr; Back </button>
          {/* Generic "Next" button is hidden as progression is handled by step-specific action buttons */}
        </div>
      </div>
    </div>
    </>
  );
};

export default CreatorsEdgeStudioTool;
