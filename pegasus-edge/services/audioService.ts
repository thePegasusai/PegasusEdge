import { MusicAsset, SfxAsset } from '../types'; // Added SfxAsset

const MUSIC_BACKEND_URL = 'http://localhost:8000/generate_music/';
const SFX_BACKEND_URL = 'http://localhost:8000/generate_sfx/'; // New URL for SFX

/**
 * Generates a music snippet by calling the AudioCraft backend.
 *
 * @param prompt The text prompt to generate music from.
 * @param duration Optional duration of the music snippet in seconds.
 * @returns A Promise that resolves to a MusicAsset.
 * @throws Will throw an error if the API call fails or returns an unexpected response.
 */
export const generateMusicSnippet = async (
  prompt: string,
  duration?: number
): Promise<MusicAsset> => {
  console.log(`[audioService] Requesting music snippet for prompt: "${prompt}", duration: ${duration || 'default'}`);

  try {
    const requestBody: { prompt: string; duration?: number } = { prompt };
    if (duration !== undefined) {
      requestBody.duration = duration;
    }

    const response = await fetch(MUSIC_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Try to get more details from the error response
      console.error(
        `[audioService] API request failed with status ${response.status}: ${response.statusText}. Response body: ${errorBody}`
      );
      throw new Error(
        `Failed to generate music. Status: ${response.status}. ${errorBody || response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log('[audioService] Received response from backend:', responseData);

    if (!responseData.audio_url || !responseData.filename || responseData.prompt === undefined || responseData.duration === undefined) {
      console.error('[audioService] Invalid response structure from backend:', responseData);
      throw new Error('Invalid response structure from music generation API.');
    }
    
    const musicAsset: MusicAsset = {
      id: responseData.filename, // Using filename as ID
      description: responseData.prompt,
      type: 'music',
      audioUrl: responseData.audio_url,
      duration: responseData.duration,
      isLoading: false, // Assuming loading state is handled by the caller or UI
      error: null,
    };

    console.log('[audioService] Successfully generated music asset:', musicAsset);
    return musicAsset;

  } catch (error) {
    console.error('[audioService] Error during music generation:', error);
    // Depending on how the calling component handles errors,
    // you might want to re-throw the error or return an asset with the error field populated.
    // For now, re-throwing to make it clear to the caller that something went wrong.
    if (error instanceof Error) {
        // Return a MusicAsset with the error field populated
        return {
            id: `error-${Date.now()}`,
            description: prompt,
            type: 'music',
            audioUrl: '',
            duration: duration || 0,
            isLoading: false,
            error: error.message || 'An unknown error occurred during music generation.',
        };
    }
    // Fallback for non-Error objects
    return {
        id: `error-${Date.now()}`,
        description: prompt,
        type: 'music',
        audioUrl: '',
        duration: duration || 0,
        isLoading: false,
        error: 'An unknown error occurred during music generation.',
    };
  }
};

// Example of how it might be called (for testing purposes, not part of the service itself):
/*
async function testMusicGeneration() {
  try {
    const prompt = "Uplifting electronic music for a product launch";
    const asset = await generateMusicSnippet(prompt, 10);
    if (asset.error) {
      console.error("Test failed with error:", asset.error);
    } else {
      console.log("Test successful, asset:", asset);
    }
  } catch (e) {
    console.error("Test failed with exception:", e);
  }
}
// testMusicGeneration();
*/

/**
 * Generates a sound effect by calling the AudioCraft backend's SFX endpoint.
 *
 * @param prompt The text prompt to generate the sound effect from.
 * @param duration Optional duration of the SFX in seconds.
 * @returns A Promise that resolves to an SfxAsset.
 */
export const generateSoundEffect = async (
  prompt: string,
  duration?: number // Default duration is handled by the backend if not provided
): Promise<SfxAsset> => {
  console.log(`[audioService] Requesting SFX for prompt: "${prompt}", duration: ${duration || 'backend default'}`);

  try {
    const requestBody: { prompt: string; duration?: number } = { prompt };
    if (duration !== undefined) {
      requestBody.duration = duration;
    }

    const response = await fetch(SFX_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[audioService] SFX API request failed with status ${response.status}: ${response.statusText}. Response body: ${errorBody}`
      );
      throw new Error(
        `Failed to generate SFX. Status: ${response.status}. ${errorBody || response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log('[audioService] Received SFX response from backend:', responseData);

    if (!responseData.audio_url || !responseData.filename || responseData.prompt === undefined || responseData.duration === undefined) {
      console.error('[audioService] Invalid SFX response structure from backend:', responseData);
      throw new Error('Invalid response structure from SFX generation API.');
    }
    
    const sfxAsset: SfxAsset = {
      id: responseData.filename, // Using filename as ID
      description: responseData.prompt,
      type: 'sfx',
      audioUrl: responseData.audio_url,
      duration: responseData.duration,
      isLoading: false,
      error: null,
    };

    console.log('[audioService] Successfully generated SFX asset:', sfxAsset);
    return sfxAsset;

  } catch (error) {
    console.error('[audioService] Error during SFX generation:', error);
    // Return an SfxAsset with the error field populated
    const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred during SFX generation.';
    return {
      id: `error-${Date.now()}`,
      description: prompt,
      type: 'sfx',
      audioUrl: '',
      duration: duration || 0, // Use provided duration or 0
      isLoading: false,
      error: errorMessage,
    };
  }
};

// Example SFX generation call
/*
async function testSfxGeneration() {
  try {
    const prompt = "footsteps on gravel";
    const asset = await generateSoundEffect(prompt, 5);
    if (asset.error) {
      console.error("SFX Test failed with error:", asset.error);
    } else {
      console.log("SFX Test successful, asset:", asset);
    }
  } catch (e) {
    console.error("SFX Test failed with exception:", e);
  }
}
// testSfxGeneration();
*/
