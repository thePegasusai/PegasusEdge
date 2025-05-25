import React, { useState, useCallback } from 'react';
import { generateText, generateImage } from '../../services/geminiService'; // generateImage might be used for placeholder visuals
import LoadingSpinner from '../LoadingSpinner';
import { WandSparklesIcon, LightBulbIcon, PaletteIcon, ClipboardDocumentListIcon, PackageIcon, CREATOR_STEPS_DATA } from '../../constants';
import { Link } from 'react-router-dom';
// Fix: Imported CreatorStepId enum
import type { CreatorStepId, CreatorsEdgeState, CreatorVisionOutput, CreatorSignatureOutput, CreatorBlueprintOutput } from '../../types';
import { AiToolId, CreatorStepId as CreatorStepIdEnum } from '../../types';


const CreatorsEdgeStudioTool: React.FC = () => {
  const [currentStepId, setCurrentStepId] = useState<CreatorStepId>(CREATOR_STEPS_DATA[0].id);
  // Fix: Added missing audioOutput to initial state.
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

  const handleVisionGeneration = useCallback(async () => {
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

        Generate the following, keeping a modern, edgy, and engaging tone:
        1.  Video/Series Titles (3 options): Should be catchy and intriguing.
        2.  Unique Content Angles (2-3 options): Fresh perspectives or approaches.
        3.  Target Audience Persona (brief description): Who are they, what do they crave?

        Format as a JSON object:
        {
          "titles": ["Title 1", "Title 2", "Title 3"],
          "angles": ["Angle 1", "Angle 2"],
          "audiencePersona": "Description..."
        }
      `;
      const resultText = await generateText(prompt, "You are an AI co-producer for successful content creators, specializing in viral strategies and branding.");
      
      let parsedResult: CreatorVisionOutput;
      try {
        // Attempt to parse, removing potential markdown fences
        let jsonStr = resultText.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse Vision JSON:", parseError, "Raw text:", resultText);
        // Fallback: try to extract manually or show error
        parsedResult = { titles: ["AI couldn't format titles, please refine input."], angles: ["AI couldn't format angles."], audiencePersona: "AI response format error."};
      }

      setStudioState(prev => ({ ...prev, visionOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) {
      setError((err as Error).message || 'Failed to generate The Vision. Try refining your inputs.');
    } finally {
      setIsLoading(false);
    }
  }, [studioState.channelNiche, studioState.videoTopic, studioState.contentStyle]);

  const handleSignatureGeneration = useCallback(async () => {
    if (!studioState.visionOutput) {
      setError('Vision step must be completed first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const prompt = `
        Based on this creative vision:
        Titles: ${studioState.visionOutput.titles.join(', ')}
        Angles: ${studioState.visionOutput.angles.join(', ')}
        Audience: ${studioState.visionOutput.audiencePersona}
        Creator Niche: ${studioState.channelNiche}

        Suggest the following for a "modern playboy esque" yet sophisticated brand identity:
        1.  Color Palettes (2 options): Each with a name and 3-4 hex codes (e.g., {"name": "Midnight Gold", "colors": ["#0A0A1A", "#FFD700", "#C0C0C0"]}).
        2.  Font Pairings (2 options): For Heading and Body, with a suggested vibe (e.g., {"heading": "Playfair Display", "body": "Montserrat", "vibe": "Elegant & Modern"}).
        3.  Thumbnail Concepts (2 brief text descriptions): Describe the visual elements, style, and text placement.

        Format as a JSON object:
        {
          "colorPalettes": [{"name": "Palette Name", "colors": ["#hex1", "#hex2"]}, ...],
          "fontPairings": [{"heading": "Font1", "body": "Font2", "vibe": "VibeDesc"}, ...],
          "thumbnailConcepts": ["Concept 1 desc...", "Concept 2 desc..."]
        }
      `;
      const resultText = await generateText(prompt, "You are an AI branding expert with an eye for luxury and modern aesthetics.");
      let parsedResult: CreatorSignatureOutput;
      try {
        let jsonStr = resultText.trim().replace(/^```json\s*|\s*```$/g, '');
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
         console.error("Failed to parse Signature JSON:", parseError, "Raw text:", resultText);
         parsedResult = { colorPalettes: [{name:"Error Palette", colors:["#000000"]}], fontPairings: [{heading:"ErrorFont", body:"ErrorFont", vibe:"Error"}], thumbnailConcepts: ["AI response format error."]};
      }
      setStudioState(prev => ({ ...prev, signatureOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) {
      setError((err as Error).message || 'Failed to generate Visual Signature. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [studioState.visionOutput, studioState.channelNiche]);

  const handleBlueprintGeneration = useCallback(async () => {
     if (!studioState.visionOutput || !studioState.signatureOutput) {
      setError('Vision and Signature steps must be completed first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const prompt = `
        For a creator with this vision:
        Titles: ${studioState.visionOutput.titles.join(', ')}
        Topic: ${studioState.videoTopic || studioState.channelNiche}
        Style: ${studioState.contentStyle}
        Audience: ${studioState.visionOutput.audiencePersona}

        And this branding direction:
        Colors (example): ${studioState.signatureOutput.colorPalettes[0]?.name}
        Thumbnails (example concept): ${studioState.signatureOutput.thumbnailConcepts[0]}
        
        Generate a content blueprint. Keep it concise, actionable, and engaging:
        1.  Key Talking Points (3-5 bullet points): Core messages for a video.
        2.  Intro Hooks (2-3 options): To grab attention in the first 15 seconds.
        3.  Call-to-Action Phrases (2-3 options): For likes, subs, comments.
        4.  Interactive Ideas (1-2 options): Polls, Q&A, challenges.

        Format as a JSON object:
        {
          "talkingPoints": ["Point 1...", "Point 2..."],
          "introHooks": ["Hook 1...", "Hook 2..."],
          "ctaPhrases": ["CTA 1...", "CTA 2..."],
          "interactiveIdeas": ["Idea 1...", "Idea 2..."]
        }
      `;
      const resultText = await generateText(prompt, "You are an AI scriptwriter and engagement strategist for top-tier creators.");
      let parsedResult: CreatorBlueprintOutput;
      try {
        let jsonStr = resultText.trim().replace(/^```json\s*|\s*```$/g, '');
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
         console.error("Failed to parse Blueprint JSON:", parseError, "Raw text:", resultText);
         parsedResult = { talkingPoints: ["AI format error."], introHooks: ["AI format error."], ctaPhrases: ["AI format error."], interactiveIdeas: ["AI format error."]};
      }
      setStudioState(prev => ({ ...prev, blueprintOutput: parsedResult }));
      proceedToNextStep();
    } catch (err) {
      setError((err as Error).message || 'Failed to generate Content Blueprint. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [studioState.visionOutput, studioState.signatureOutput, studioState.videoTopic, studioState.channelNiche, studioState.contentStyle]);


  const renderStepContent = () => {
    switch (currentStepId) {
      case 'vision':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="channelNiche" className="block text-sm font-semibold text-purple-300 mb-1">Your Channel Niche (e.g., Gaming, Tech, Comedy)</label>
              <input type="text" id="channelNiche" value={studioState.channelNiche} onChange={e => handleInputChange('channelNiche', e.target.value)} className="input-premium" placeholder="e.g., Indie Game Reviews & First Looks"/>
            </div>
            <div>
              <label htmlFor="videoTopic" className="block text-sm font-semibold text-purple-300 mb-1">Specific Video Topic (Optional)</label>
              <input type="text" id="videoTopic" value={studioState.videoTopic} onChange={e => handleInputChange('videoTopic', e.target.value)} className="input-premium" placeholder="e.g., Hidden Gems of Steam Next Fest"/>
            </div>
            <div>
              <label htmlFor="contentStyle" className="block text-sm font-semibold text-purple-300 mb-1">Desired Content Style/Vibe</label>
              <input type="text" id="contentStyle" value={studioState.contentStyle} onChange={e => handleInputChange('contentStyle', e.target.value)} className="input-premium" placeholder="e.g., Witty & Informative, High-Energy & Humorous"/>
            </div>
            <button onClick={handleVisionGeneration} disabled={isLoading || !studioState.channelNiche.trim()} className="btn-premium w-full flex items-center justify-center">
              {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Generate Vision</span> <LightBulbIcon className="w-5 h-5 ml-2"/>
            </button>
          </div>
        );
      case 'signature':
        return (
            <div className="space-y-6">
                {!studioState.visionOutput && <p className="text-amber-400">Please complete 'The Vision' step first.</p>}
                {studioState.visionOutput && (
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <h4 className="font-semibold text-purple-300 mb-1">Recap from Vision:</h4>
                        <p className="text-xs text-slate-400"><strong>Titles:</strong> {studioState.visionOutput.titles.join(' / ')}</p>
                        <p className="text-xs text-slate-400"><strong>Audience:</strong> {studioState.visionOutput.audiencePersona}</p>
                    </div>
                )}
                <button onClick={handleSignatureGeneration} disabled={isLoading || !studioState.visionOutput} className="btn-premium w-full flex items-center justify-center">
                    {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Craft Visual Signature</span> <PaletteIcon className="w-5 h-5 ml-2"/>
                </button>
            </div>
        );
    case 'blueprint':
        return (
            <div className="space-y-6">
                {!studioState.signatureOutput && <p className="text-amber-400">Please complete 'Visual Signature' step first.</p>}
                 {studioState.signatureOutput && (
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <h4 className="font-semibold text-purple-300 mb-1">Recap from Signature:</h4>
                        <p className="text-xs text-slate-400"><strong>Palette Example:</strong> {studioState.signatureOutput.colorPalettes[0]?.name}</p>
                        <p className="text-xs text-slate-400"><strong>Thumbnail Concept Example:</strong> {studioState.signatureOutput.thumbnailConcepts[0]}</p>
                    </div>
                )}
                <button onClick={handleBlueprintGeneration} disabled={isLoading || !studioState.signatureOutput} className="btn-premium w-full flex items-center justify-center">
                    {isLoading && <LoadingSpinner size="sm" />} <span className={isLoading ? 'ml-2' : ''}>Develop Content Blueprint</span> <ClipboardDocumentListIcon className="w-5 h-5 ml-2"/>
                </button>
            </div>
        );
    case 'pack':
        return (
            <div className="space-y-6">
                <h3 className="font-display text-3xl text-amber-400 text-center">Your Creator's Edge Pack!</h3>
                {studioState.visionOutput && (
                    <div className="card-premium p-4">
                        <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><LightBulbIcon className="w-6 h-6 mr-2"/>The Vision</h4>
                        <p><strong>Titles:</strong> {studioState.visionOutput.titles.join(' | ')}</p>
                        <p><strong>Angles:</strong> {studioState.visionOutput.angles.join(' | ')}</p>
                        <p><strong>Audience Persona:</strong> {studioState.visionOutput.audiencePersona}</p>
                    </div>
                )}
                {studioState.signatureOutput && (
                    <div className="card-premium p-4">
                        <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><PaletteIcon className="w-6 h-6 mr-2"/>Visual Signature</h4>
                        {studioState.signatureOutput.colorPalettes.map(p => <p key={p.name}><strong>Palette: {p.name}</strong> ({p.colors.join(', ')})</p>)}
                        {studioState.signatureOutput.fontPairings.map((f,i) => <p key={i}><strong>Fonts {i+1}:</strong> {f.heading} & {f.body} ({f.vibe})</p>)}
                        <p><strong>Thumbnail Concepts:</strong> {studioState.signatureOutput.thumbnailConcepts.join(' | ')}</p>
                    </div>
                )}
                {studioState.blueprintOutput && (
                    <div className="card-premium p-4">
                        <h4 className="text-xl font-semibold text-purple-300 mb-2 flex items-center"><ClipboardDocumentListIcon className="w-6 h-6 mr-2"/>Content Blueprint</h4>
                        <p><strong>Talking Points:</strong> {studioState.blueprintOutput.talkingPoints.join(' | ')}</p>
                        <p><strong>Intro Hooks:</strong> {studioState.blueprintOutput.introHooks.join(' | ')}</p>
                        <p><strong>CTAs:</strong> {studioState.blueprintOutput.ctaPhrases.join(' | ')}</p>
                        <p><strong>Interactive Ideas:</strong> {studioState.blueprintOutput.interactiveIdeas.join(' | ')}</p>
                    </div>
                )}
                 <div className="text-center pt-4">
                     <p className="text-sm text-slate-400">
                        This Edge Pack gives you a launchpad. <Link to="/subscriptions" className="font-semibold text-amber-400 hover:text-hotpink">Go Pro</Link> for deeper insights, asset downloads, and more!
                    </p>
                    {/* FIX: Use CreatorStepIdEnum.VISION instead of 'vision' string literal */}
                    {/* Fix: Added missing audioOutput to reset state. */}
                    <button onClick={() => { setCurrentStepId(CreatorStepIdEnum.VISION); setStudioState({channelNiche: '', videoTopic: '', contentStyle: '', visionOutput: null, signatureOutput: null, blueprintOutput: null, audioOutput: null}); }} className="btn-secondary mt-6">Start New Edge Pack</button>
                </div>
            </div>
        );
      default: return <p>Unknown step.</p>;
    }
  };

  return (
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
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-1">
              {CREATOR_STEPS_DATA.map((step, index) => (
                  <span key={step.id} className={`text-xs font-medium ${index <= currentStepIndex ? 'text-amber-400' : 'text-slate-500'}`}>
                      {step.name}
                  </span>
              ))}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${((currentStepIndex + 1) / CREATOR_STEPS_DATA.length) * 100}%` }}>
            </div>
          </div>
        </div>

        {error && (
          <div className="my-4 p-3 bg-red-800/50 border border-red-600 rounded-md text-red-300">
            <p><strong>Hold Up:</strong> {error}</p>
          </div>
        )}

        <div className="min-h-[250px]">
          {renderStepContent()}
        </div>

        <div className="mt-10 flex justify-between items-center pt-6 border-t border-slate-700/50">
          <button 
            onClick={goToPrevStep} 
            disabled={currentStepIndex === 0 || isLoading} 
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &larr; Back
          </button>
          {/* Fix: Adjusted logic for this vestigial 'Next' button based on the TypeScript error (TSC2365/TSC2367 on line 348).
              The error implies that in the context of this specific (older) file, TS infers `currentStepId`'s type such that
              `currentStepId !== CreatorStepIdEnum.PACK` is always true, and thus
              `currentStepId === CreatorStepIdEnum.PACK` is always false.
              This button is already styled to be hidden and its onClick is a no-op placeholder.
              The change simplifies the conditions based on that TS premise for this file.
          */}
          {(currentStepId !== CreatorStepIdEnum.PACK && (() => {
            // This IIFE is just to scope the comment and potential logic if TS premise is true.
            // If TS is correct that currentStepId !== PACK is always true for this file, this outer condition is redundant.
            // If currentStepId === PACK is always false, the disabled check simplifies.
            // This button is vestigial as per prior comments ("action now in specific step buttons", "opacity-0 cursor-default").
            // We simplify its disabled state according to the implications of the TS error for this file.
            return (
                 <button 
                    onClick={() => { /* This button's action is handled by step-specific buttons now */ }} 
                    disabled={isLoading} // Simplified: if currentStepId can't be PACK, then currentStepId === PACK is false.
                    className="btn-premium opacity-0 cursor-default" // Effectively hide if not used
                 >
                    Next &rarr;
                 </button>
            );
          })()) || null}
        </div>
      </div>
    </div>
  );
};

export default CreatorsEdgeStudioTool;