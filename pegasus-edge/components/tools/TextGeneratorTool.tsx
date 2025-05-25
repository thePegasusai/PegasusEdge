import React, { useState, useCallback } from 'react';
import { generateText } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import { DocumentTextIcon } from '../../constants';

const TextGeneratorTool: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateText = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty, genius.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedText('');
    try {
      const result = await generateText(prompt, systemInstruction.trim() || undefined);
      setGeneratedText(result);
    } catch (err) {
      setError((err as Error).message || 'The AI muse is unavailable. Try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, systemInstruction]);

  return (
    <div className="card-premium p-6 sm:p-8">
      <div className="flex items-center mb-6">
        <DocumentTextIcon className="w-10 h-10 text-purple-400 mr-4" />
        <h2 className="font-display text-3xl font-bold text-slate-100">Rapid Text Crafter</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-semibold text-purple-300 mb-1">
            Your Core Idea / Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Script intro for a video about 'The Future of VR Gaming'..."
            rows={4}
            className="input-premium"
          />
        </div>
        <div>
          <label htmlFor="systemInstruction" className="block text-sm font-semibold text-purple-300 mb-1">
            AI Persona / System Instruction (Optional)
          </label>
          <input
            type="text"
            id="systemInstruction"
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            placeholder="e.g., Act as a witty tech reviewer."
            className="input-premium"
          />
        </div>
        <button
          onClick={handleGenerateText}
          disabled={isLoading}
          className="btn-premium w-full sm:w-auto flex items-center justify-center"
        >
          {isLoading && <LoadingSpinner size="sm" />}
          <span className={isLoading ? 'ml-2' : ''}>Craft Text</span>
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-800/50 border border-red-600 rounded-md text-red-300">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {generatedText && !isLoading && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-amber-400 mb-3">Your AI-Crafted Text:</h3>
          <div className="p-4 bg-slate-900/70 rounded-md whitespace-pre-wrap text-slate-200 border border-slate-700">
            {generatedText}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextGeneratorTool;