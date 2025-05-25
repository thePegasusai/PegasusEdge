// pegasus-edge/services/audioService.ts

import type { AudioAsset, MusicAsset, SfxAsset, VoiceoverAsset } from '../types'; // Assuming these types will be defined

// --- Configuration for Mock API ---
const MOCK_API_LATENCY_MS = 1500; // Simulate 1.5 seconds delay

// --- Helper for unique IDs ---
let mockIdCounter = 0;
const generateMockId = () => `mock_audio_${Date.now()}_${mockIdCounter++}`;

// --- Placeholder "FutureSound API" Functions ---

/**
 * Generates a short music snippet by calling the AudioCraft backend.
 */
export const generateMusicSnippet = async (
  prompt: string,
  duration: number = 8 // Default duration in seconds, matching backend's typical default
): Promise<MusicAsset> => {
  const backendUrl = 'http://localhost:8000';
  const endpoint = `${backendUrl}/generate_music/`;

  console.log(`[AudioService] Request to generate music from backend: "${prompt}", Duration: ${duration}s`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: duration,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Try to get more error details
      console.error(`[AudioService] Error from backend: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}. ${errorBody}`);
    }

    const responseData = await response.json();
    
    // Construct the full absolute URL for the audio file
    const fullAudioUrl = `${backendUrl}${responseData.audio_url}`;

    const generatedAsset: MusicAsset = {
      id: generateMockId(), // Still using client-side mock ID for now
      description: responseData.prompt_used,
      type: 'music',
      audioUrl: fullAudioUrl,
      duration: parseFloat(responseData.duration_generated_seconds),
      // Fields not provided by this specific backend endpoint are placeholders
      genre: "Generated", // Could use the prompt or parts of it if more context needed
      mood: "N/A",
      tempo: "N/A",
      instrumentation: ["N/A"], // Or parse from prompt if relevant
    };

    console.log('[AudioService] Music asset successfully retrieved from backend:', generatedAsset);
    return generatedAsset;

  } catch (error) {
    console.error('[AudioService] Network or unexpected error during music generation:', error);
    // Re-throw a generic error or a more specific one based on the caught error
    if (error instanceof Error) {
        throw new Error(`Failed to generate music snippet: ${error.message}`);
    }
    throw new Error('Failed to generate music snippet due to an unknown error.');
  }
};

/**
 * Simulates generating a sound effect.
 */
export const generateSoundEffect = async (
  prompt: string
): Promise<SfxAsset> => {
  console.log(`[AudioService] Request to generate SFX: "${prompt}"`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAsset: SfxAsset = {
        id: generateMockId(),
        description: prompt,
        type: 'sfx',
        audioUrl: `/audio/placeholder_sfx_${prompt.toLowerCase().split(' ')[0]}_${Math.floor(Math.random() * 100)}.mp3`,
        sfxCategory: 'Generated category (e.g., impact)', // Placeholder
        character: ['Generated character (e.g., sharp)'], // Placeholder
      };
      console.log('[AudioService] Mock SFX generated:', mockAsset);
      resolve(mockAsset);
    }, MOCK_API_LATENCY_MS);
  });
};

/**
 * Simulates generating a voiceover.
 */
export const generateVoiceoverSnippet = async (
  text: string,
  voiceStyle: string = 'neutral_male',
  emotion: string = 'neutral'
): Promise<VoiceoverAsset> => {
  console.log(`[AudioService] Request to generate voiceover: "${text}", Voice: ${voiceStyle}, Emotion: ${emotion}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAsset: VoiceoverAsset = {
        id: generateMockId(),
        description: `Voiceover for: "${text.substring(0, 50)}..."`,
        type: 'voiceover',
        audioUrl: `/audio/placeholder_voice_${voiceStyle}_${Math.floor(Math.random() * 100)}.mp3`,
        text,
        voiceUsed: voiceStyle,
        emotion,
        language: 'en-US', // Placeholder
      };
      console.log('[AudioService] Mock voiceover generated:', mockAsset);
      resolve(mockAsset);
    }, MOCK_API_LATENCY_MS);
  });
};

// Note: For a real application, actual API calls to an audio generation service would replace the setTimeout and mock data.
// Error handling, API key management, and more robust response parsing would also be necessary.
