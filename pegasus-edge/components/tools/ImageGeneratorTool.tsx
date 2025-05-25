import React, { useState, useCallback } from 'react';
import { generateImage } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import { PhotoIcon } from '../../constants';

const ImageGeneratorTool: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError('A prompt is your canvas. Paint something.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const imageUrl = await generateImage(prompt);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError((err as Error).message || 'The visual realm is elusive. Try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  return (
    <div className="card-premium p-6 sm:p-8">
      <div className="flex items-center mb-6">
        <PhotoIcon className="w-10 h-10 text-pink-400 mr-4" />
        <h2 className="font-display text-3xl font-bold text-slate-100">Visual Spark Generator</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="imagePrompt" className="block text-sm font-semibold text-pink-300 mb-1">
            Describe Your Vision
          </label>
          <textarea
            id="imagePrompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Concept art for a YouTube thumbnail: 'Cyberpunk detective in neon-lit alley'"
            rows={3}
            className="input-premium"
          />
        </div>
        <button
          onClick={handleGenerateImage}
          disabled={isLoading}
          className="btn-premium w-full sm:w-auto bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 flex items-center justify-center"
        >
          {isLoading && <LoadingSpinner size="sm" />}
          <span className={isLoading ? 'ml-2' : ''}>Ignite Visual</span>
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-800/50 border border-red-600 rounded-md text-red-300">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {isLoading && !generatedImage && (
        <div className="mt-8 text-center">
          <LoadingSpinner message="Conjuring your visual masterpiece..." />
           <div className="w-full h-64 bg-slate-700/50 rounded-lg animate-pulse mt-4 flex items-center justify-center">
            <PhotoIcon className="w-16 h-16 text-slate-500"/>
          </div>
        </div>
      )}

      {generatedImage && !isLoading && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-amber-400 mb-3">Your AI-Generated Visual:</h3>
          <div className="p-2 bg-slate-900/70 rounded-lg border border-slate-700 inline-block shadow-2xl">
            <img 
              src={generatedImage} 
              alt={prompt} 
              className="max-w-full h-auto md:max-w-lg rounded shadow-md" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorTool;