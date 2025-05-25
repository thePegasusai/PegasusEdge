
import React, { useState, useCallback } from 'react';
import { generateTextWithSearch } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import type { GroundingChunk } from '../../types';
import { MagnifyingGlassIcon } from '../../constants';

const SearchGroundingTool: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError('A query is required to spot trends.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await generateTextWithSearch(query);
      setResult(response);
// Fix: Added curly braces to the catch block and corrected error handling.
    } catch (err) {
      setError((err as Error).message || 'Trend spotting failed. The crystal ball is cloudy.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const renderSources = (sources: GroundingChunk[]) => {
    if (!sources || sources.length === 0) {
      return <p className="text-sm text-slate-500">No specific web sources cited for this insight.</p>;
    }
  
    const validSources = sources.filter(source => 
      (source.web && source.web.uri && source.web.title) ||
      (source.retrievedContext && source.retrievedContext.uri && source.retrievedContext.title)
    );

    if (validSources.length === 0) {
      return <p className="text-sm text-slate-500">No valid web sources found in the data stream.</p>;
    }

    return (
      <ul className="space-y-3">
        {validSources.map((source, index) => {
           const uri = source.web?.uri || source.retrievedContext?.uri;
           const title = source.web?.title || source.retrievedContext?.title;
           return (
            <li key={index} className="p-3 border border-slate-700 rounded-lg bg-slate-800/70 hover:bg-slate-700/90 transition-colors">
              <a 
                href={uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-pink-400 font-semibold hover:underline"
              >
                {title || 'Untitled Source'}
              </a>
              <p className="text-xs text-slate-400 break-all mt-1">{uri}</p>
            </li>
           );
        })}
      </ul>
    );
  };


  return (
    <div className="card-premium p-6 sm:p-8">
      <div className="flex items-center mb-6">
        <MagnifyingGlassIcon className="w-10 h-10 text-amber-400 mr-4" />
        <h2 className="font-display text-3xl font-bold text-slate-100">Trend Spotter</h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Uncover the latest buzz. Ask about current events, trending topics, or anything requiring up-to-the-minute info, grounded by Google Search.
      </p>

      <div className="space-y-6">
        <div>
          <label htmlFor="searchQuery" className="block text-sm font-semibold text-amber-300 mb-1">
            Your Trend Query
          </label>
          <textarea
            id="searchQuery"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., What are the latest viral challenges on TikTok? or New AI tools for video editing?"
            rows={3}
            className="input-premium"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="btn-premium w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 flex items-center justify-center"
        >
          {isLoading && <LoadingSpinner size="sm" />}
          <span className={isLoading ? 'ml-2' : ''}>Spot Trends</span>
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-800/50 border border-red-600 rounded-md text-red-300">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {isLoading && !result && (
         <div className="mt-8 text-center">
          <LoadingSpinner message="Scanning the digital horizon for trends..." />
           <div className="w-full h-40 bg-slate-700/50 rounded-lg animate-pulse mt-4 flex items-center justify-center">
            <MagnifyingGlassIcon className="w-12 h-12 text-slate-500"/>
          </div>
        </div>
      )}

      {result && !isLoading && (
        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-amber-400 mb-2">AI-Spotted Insight:</h3>
            <div className="p-4 bg-slate-900/70 rounded-md whitespace-pre-wrap text-slate-200 border border-slate-700">
              {result.text}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-amber-400 mb-2">Corroborating Sources:</h3>
            {renderSources(result.sources)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchGroundingTool;
