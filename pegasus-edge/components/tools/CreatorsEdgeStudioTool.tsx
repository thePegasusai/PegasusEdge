
import React, { useState, useCallback } from 'react';
import { generateText } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import { WandSparklesIcon, LightBulbIcon, PaletteIcon, ClipboardDocumentListIcon, PackageIcon, MusicalNoteIcon, CREATOR_STEPS_DATA, PAY_PER_USE_PLAN_INFO } from '../../constants';
import { Link } from 'react-router-dom';
import type { CreatorStepId, CreatorsEdgeState, CreatorVisionOutput, CreatorSignatureOutput, CreatorBlueprintOutput, CreatorAudioOutput, SubscriptionPlan } from '../../types';
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
    audioOutput: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const handleAudioGenerationInternal = useCallback(async () => {
    if (!studioState.blueprintOutput) { setError('Blueprint needed for audio.'); return; }
    setIsLoading(true); setError(null);
    try {
      // Step 1: Generate textual audio concepts (jingles, SFX, voice tone)
      const textualConceptsPrompt = `Project (Niche: ${studioState.channelNiche}, Topic: ${studioState.videoTopic}, Style: ${studioState.contentStyle}, Points: ${studioState.blueprintOutput.talkingPoints.join('; ')}).
      Generate JSON for: jingle ideas (1-2 short concepts), SFX concepts (2-3 relevant sounds), voiceover tone (1 suggestion), and also music style suggestions (2 distinct styles, e.g., "Uplifting Electronic", "Chill Lo-fi Hip Hop").
      { "musicStyleSuggestions": [], "jingleIdeas": [], "sfxConcepts": [], "voiceOverTone": "" }`;
      
      const textualResultText = await generateText(textualConceptsPrompt, "AI audio director for digital content.");
      const parsedTextualResult = parseJsonResponse<CreatorAudioOutput>(textualResultText, {
        musicStyleSuggestions: ["AI Error: No styles suggested."], jingleIdeas: ["AI Error."], sfxConcepts: ["AI Error."], voiceOverTone: "AI Error."
      });

      // Initialize generatedMusic array
      const generatedMusicAssets: MusicAsset[] = [];
      if (parsedTextualResult.musicStyleSuggestions && parsedTextualResult.musicStyleSuggestions.length > 0) {
        for (const styleSuggestion of parsedTextualResult.musicStyleSuggestions) {
          if (styleSuggestion.toLowerCase().includes("ai error")) {
            generatedMusicAssets.push({
              id: `error-${Date.now()}-${generatedMusicAssets.length}`,
              description: styleSuggestion,
              type: 'music',
              audioUrl: '',
              duration: 0,
              error: 'Failed to get a valid style suggestion from AI.',
              isLoading: false,
            });
            continue;
          }
          // For each style, call the actual audio generation service
          // For simplicity, using a default duration of 8 seconds per snippet.
          // Update UI to show loading for this specific asset (more advanced state needed for per-asset loading)
          setStudioState(prev => ({ 
            ...prev, 
            audioOutput: { 
              ...(prev.audioOutput || parsedTextualResult), 
              musicStyleSuggestions: parsedTextualResult.musicStyleSuggestions, // keep suggestions
              jingleIdeas: parsedTextualResult.jingleIdeas,
              sfxConcepts: parsedTextualResult.sfxConcepts,
              voiceOverTone: parsedTextualResult.voiceOverTone,
              generatedMusic: [
                ...(prev.audioOutput?.generatedMusic || []), 
                { 
                  id: `loading-${Date.now()}-${generatedMusicAssets.length}`, 
                  description: `Generating: ${styleSuggestion}`, 
                  type: 'music', 
                  audioUrl: '', 
                  duration: 8, 
                  isLoading: true 
                }
              ]
            } 
          }));

          try {
            const musicAsset = await generateMusicSnippet(styleSuggestion, 8); // 8 seconds duration
            generatedMusicAssets.push(musicAsset);
          } catch (genError) {
            console.error(`Error generating music for prompt "${styleSuggestion}":`, genError);
            generatedMusicAssets.push({
              id: `error-${Date.now()}-${generatedMusicAssets.length}`,
              description: styleSuggestion,
              type: 'music',
              audioUrl: '',
              duration: 8,
              error: (genError instanceof Error) ? genError.message : 'Failed to generate audio snippet.',
              isLoading: false,
            });
          }
          // Update state after each generation (or batch update for better performance)
          setStudioState(prev => ({ 
            ...prev, 
            audioOutput: { 
              ...(prev.audioOutput || parsedTextualResult),
              musicStyleSuggestions: parsedTextualResult.musicStyleSuggestions,
              jingleIdeas: parsedTextualResult.jingleIdeas,
              sfxConcepts: parsedTextualResult.sfxConcepts,
              voiceOverTone: parsedTextualResult.voiceOverTone,
              // Replace loading asset with actual or error asset
              generatedMusic: (prev.audioOutput?.generatedMusic || []).filter(a => !a.isLoading).concat(generatedMusicAssets.filter(a => !generatedMusicAssets.find(prev_a => prev_a.id === a.id && prev_a.isLoading)))
            } 
          }));
        }
      }
      
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...parsedTextualResult, // Contains suggestions for jingles, sfx, voice tone
          generatedMusic: generatedMusicAssets, // Contains actual generated music
        },
      }));

      // Access check and proceed to next step
      if (isSubscribed()) {
        proceedToNextStep();
      } else if (canUseCreatorStudioFree()) {
        consumeCreatorStudioFreeUse();
        proceedToNextStep();
      } else {
        setShowPaymentModal(true);
        setPendingAction(() => async () => {
          proceedToNextStep();
        });
      }

    } catch (err) { 
      setError((err as Error).message); 
      // Ensure audioOutput.generatedMusic is cleared or handles errors if top-level try fails
      setStudioState(prev => ({
        ...prev,
        audioOutput: {
          ...(prev.audioOutput || { musicStyleSuggestions: [], jingleIdeas: [], sfxConcepts: [], voiceOverTone: '' }),
          generatedMusic: (prev.audioOutput?.generatedMusic || []).map(asset => asset.isLoading ? ({...asset, isLoading: false, error: "Overall generation failed." }) : asset)
        }
      }));
    } finally { 
      setIsLoading(false); 
    }
  }, [studioState.channelNiche, studioState.videoTopic, studioState.contentStyle, studioState.blueprintOutput, isSubscribed, canUseCreatorStudioFree, consumeCreatorStudioFreeUse]);


  // Wrappers that call executeGenerationWithAccessCheck
  const handleVisionGeneration = () => executeGenerationWithAccessCheck(handleVisionGenerationInternal);
  const handleSignatureGeneration = () => executeGenerationWithAccessCheck(handleSignatureGenerationInternal);
  const handleBlueprintGeneration = () => executeGenerationWithAccessCheck(handleBlueprintGenerationInternal);
  const handleAudioGeneration = () => executeGenerationWithAccessCheck(handleAudioGenerationInternal);


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
        // The button for Audio Alchemy will effectively be the "Generate Pack" button
        // in terms of access control, as it's the final generation step.
        return (
          <div className="space-y-6">
            {!studioState.blueprintOutput && <p className="text-amber-400">Complete 'Blueprint' first.</p>}
            {studioState.blueprintOutput && (
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-purple-300 mb-1">Recap - Blueprint:</h4>
                <p className="text-xs text-slate-400">Talking Point: {studioState.blueprintOutput.talkingPoints[0]} | Intro Hook: {studioState.blueprintOutput.introHooks[0]}</p>
              </div>
            )}
            <p className="text-sm text-slate-400">
              Final Step: Generate actual music snippets based on AI suggestions, along with other audio concepts, and compile your Edge Pack.
              {packAccessMessage}
            </p>
            <button 
              onClick={handleAudioGeneration} 
              disabled={isLoading || !studioState.blueprintOutput} 
              className="btn-premium w-full flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              <span className={isLoading ? 'ml-2' : ''}>Generate Audio Assets & Finalize Pack</span>
              <PackageIcon className="w-5 h-5 ml-2"/>
            </button>
            {/* Display generated audio concepts and loading/error states for music snippets */}
            {studioState.audioOutput && (
              <div className="mt-4 space-y-3">
                {studioState.audioOutput.musicStyleSuggestions && studioState.audioOutput.musicStyleSuggestions.length > 0 && (
                  <div>
                    <h5 className="text-md font-semibold text-purple-300 mb-1">Generated Music Snippets:</h5>
                    {studioState.audioOutput.generatedMusic && studioState.audioOutput.generatedMusic.map((asset) => (
                      <div key={asset.id} className="p-3 bg-slate-800/60 rounded-md my-2 border border-slate-700">
                        <p className="text-sm font-medium text-sky-300">{asset.description || 'Generated Music'}</p>
                        {asset.isLoading && <p className="text-xs text-amber-400 mt-1 flex items-center"><LoadingSpinner size="xs" /> <span className="ml-2">Generating audio... please wait.</span></p>}
                        {asset.error && <p className="text-xs text-red-400 mt-1">Error: {asset.error}</p>}
                        {asset.audioUrl && !asset.isLoading && !asset.error && (
                          <>
                            <p className="text-xs text-slate-400">Duration: {asset.duration}s</p>
                            <audio controls src={asset.audioUrl} className="w-full mt-2 h-10">
                              Your browser does not support the audio element.
                            </audio>
                          </>
                        )}
                      </div>
                    ))}
                    {(!studioState.audioOutput.generatedMusic || studioState.audioOutput.generatedMusic.length === 0) && !isLoading && (
                        <p className="text-xs text-slate-400">No music snippets generated yet, or generation is in progress for suggestions: {studioState.audioOutput.musicStyleSuggestions.join(', ')}.</p>
                    )}
                  </div>
                )}
                {/* Keep displaying other textual suggestions */}
                {studioState.audioOutput.jingleIdeas && studioState.audioOutput.jingleIdeas.length > 0 && <p className="text-xs text-slate-300"><strong>Jingle Ideas:</strong> {studioState.audioOutput.jingleIdeas.join(' | ')}</p>}
                {studioState.audioOutput.sfxConcepts && studioState.audioOutput.sfxConcepts.length > 0 && <p className="text-xs text-slate-300"><strong>SFX Concepts:</strong> {studioState.audioOutput.sfxConcepts.join(' | ')}</p>}
                {studioState.audioOutput.voiceOverTone && <p className="text-xs text-slate-300"><strong>Voice Tone:</strong> {studioState.audioOutput.voiceOverTone}</p>}
              </div>
            )}
          </div>
        );
      case CreatorStepIdEnum.PACK:
        return (
            <div className="space-y-6">
                <h3 className="font-display text-3xl text-amber-400 text-center">Your Creator's Edge Pack!</h3>
                {studioState.visionOutput && ( <div className="card-premium p-4"> <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><LightBulbIcon className="w-6 h-6 mr-2"/>The Vision</h4> <p><strong>Titles:</strong> {studioState.visionOutput.titles.join(' | ')}</p><p><strong>Angles:</strong> {studioState.visionOutput.angles.join(' | ')}</p><p><strong>Audience:</strong> {studioState.visionOutput.audiencePersona}</p> </div>)}
                {studioState.signatureOutput && ( <div className="card-premium p-4"> <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><PaletteIcon className="w-6 h-6 mr-2"/>Visual Signature</h4> {studioState.signatureOutput.colorPalettes.map(p => <p key={p.name}><strong>Palette {p.name}:</strong> ({p.colors.join(', ')})</p>)} {studioState.signatureOutput.fontPairings.map((f,i) => <p key={i}><strong>Fonts {i+1}:</strong> {f.heading} & {f.body} ({f.vibe})</p>)} <p><strong>Thumbnails:</strong> {studioState.signatureOutput.thumbnailConcepts.join(' | ')}</p> </div>)}
                {studioState.blueprintOutput && ( <div className="card-premium p-4"> <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><ClipboardDocumentListIcon className="w-6 h-6 mr-2"/>Content Blueprint</h4> <p><strong>Points:</strong> {studioState.blueprintOutput.talkingPoints.join(' | ')}</p><p><strong>Hooks:</strong> {studioState.blueprintOutput.introHooks.join(' | ')}</p><p><strong>CTAs:</strong> {studioState.blueprintOutput.ctaPhrases.join(' | ')}</p><p><strong>Interactive:</strong> {studioState.blueprintOutput.interactiveIdeas.join(' | ')}</p> </div>)}
                {studioState.audioOutput && (
                  <div className="card-premium p-4">
                    <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><MusicalNoteIcon className="w-6 h-6 mr-2"/>Audio Alchemy</h4>
                    {/* Display generated music snippets with audio players */}
                    {studioState.audioOutput.generatedMusic && studioState.audioOutput.generatedMusic.length > 0 && (
                      <div className="mt-2 space-y-3">
                        <h5 className="text-md font-semibold text-purple-300 mb-1">Generated Music:</h5>
                        {studioState.audioOutput.generatedMusic.map((asset) => (
                          <div key={asset.id} className="p-3 bg-slate-800/60 rounded-md my-2 border border-slate-700">
                            <p className="text-sm font-medium text-sky-300">{asset.description || 'Generated Music'}</p>
                            {asset.isLoading && <p className="text-xs text-amber-400 mt-1 flex items-center"><LoadingSpinner size="xs" /> <span className="ml-2">Loading...</span></p>}
                            {asset.error && <p className="text-xs text-red-400 mt-1">Error: {asset.error}</p>}
                            {asset.audioUrl && !asset.isLoading && !asset.error && (
                              <>
                                <p className="text-xs text-slate-400">Duration: {asset.duration}s</p>
                                <audio controls src={asset.audioUrl} className="w-full mt-2 h-10">
                                  Your browser does not support the audio element.
                                </audio>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Display other textual audio suggestions */}
                    {studioState.audioOutput.musicStyleSuggestions && studioState.audioOutput.musicStyleSuggestions.length > 0 && (!studioState.audioOutput.generatedMusic || studioState.audioOutput.generatedMusic.length === 0) && <p><strong>Suggested Music Styles:</strong> {studioState.audioOutput.musicStyleSuggestions.join(' | ')}</p>}
                    <p><strong>Jingles:</strong> {studioState.audioOutput.jingleIdeas.join(' | ')}</p>
                    <p><strong>SFX:</strong> {studioState.audioOutput.sfxConcepts.join(' | ')}</p>
                    {studioState.audioOutput.voiceOverTone && <p><strong>Voice Tone:</strong> {studioState.audioOutput.voiceOverTone}</p>}
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
