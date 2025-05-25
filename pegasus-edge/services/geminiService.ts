


import { GoogleGenAI, GenerateContentResponse, Chat, Part } from "@google/genai";
import { MODEL_TEXT_GENERATION, MODEL_IMAGE_GENERATION } from '../constants';
import type { GroundingChunk } from "../types";

// This will use process.env.API_KEY which should be set by App.tsx or build process
// If process.env.API_KEY is undefined here, GoogleGenAI constructor might throw error or fail silently.
// The App.tsx component tries to prevent usage if API_KEY is not available.
let ai: GoogleGenAI;
try {
    // @ts-ignore
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (error) {
    console.error("Failed to initialize GoogleGenAI. API Key might be missing or invalid.", error);
    // The application should ideally not reach this point if App.tsx's check works.
    // If it does, service calls will fail.
}


export const generateText = async (prompt: string, systemInstruction?: string): Promise<string> => {
  if (!ai) throw new Error("Gemini AI Service not initialized. API Key missing?");
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_TEXT_GENERATION,
      contents: prompt,
      ...(systemInstruction && { config: { systemInstruction } }),
    });
    return response.text;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error; // Re-throw to be caught by UI
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  if (!ai) throw new Error("Gemini AI Service not initialized. API Key missing?");
  try {
    const response = await ai.models.generateImages({
        model: MODEL_IMAGE_GENERATION,
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error('No image generated or unexpected response format.');
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

export const startChatSession = (systemInstruction?: string): Chat => {
  if (!ai) throw new Error("Gemini AI Service not initialized. API Key missing?");
  return ai.chats.create({
    model: MODEL_TEXT_GENERATION,
    ...(systemInstruction && { config: { systemInstruction } }),
  });
};

export const sendMessageToChatStream = async (
  chat: Chat,
  message: string,
  imageParts: Part[] = [], // Allow sending images with messages
  streamCallback: (chunkText: string, isFinal: boolean, sources?: GroundingChunk[]) => void
): Promise<void> => {
  if (!ai) throw new Error("Gemini AI Service not initialized. API Key missing?");
  try {
    const contentParts: Part[] = [...imageParts];
    if (message.trim() !== "") {
        contentParts.push({ text: message });
    }

    if (contentParts.length === 0) {
        console.warn("Attempted to send an empty message to chat.");
        return;
    }

    // Fix: Corrected structure for sending parts with chat.sendMessageStream.
    // The 'message' property of SendMessageRequest can accept Part[].
    // The previous structure { contents: { parts: contentParts } } was incorrect.
    const responseStream = await chat.sendMessageStream({ message: contentParts });
    let accumulatedText = "";
    let finalSources: GroundingChunk[] | undefined = undefined;

    for await (const chunk of responseStream) {
      accumulatedText += chunk.text;
      if (chunk.candidates && chunk.candidates[0]?.groundingMetadata?.groundingChunks) {
        finalSources = chunk.candidates[0].groundingMetadata.groundingChunks as GroundingChunk[];
      }
      streamCallback(chunk.text, false, finalSources);
    }
    // After the loop, the full response is in accumulatedText.
    // The streamCallback has already sent all chunks.
    // We call it one last time to signify the end, though chunk.text is empty here.
    streamCallback("", true, finalSources); 

  } catch (error) {
    console.error('Error sending message to chat:', error);
    streamCallback(`Error: ${(error as Error).message}`, true); // Send error as a final message
    throw error;
  }
};


export const generateTextWithSearch = async (prompt: string): Promise<{ text: string; sources: GroundingChunk[] }> => {
  if (!ai) throw new Error("Gemini AI Service not initialized. API Key missing?");
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_TEXT_GENERATION, // Use text model that supports tools
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text;
    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
    return { text, sources };
  } catch (error) {
    console.error('Error generating text with search:', error);
    throw error;
  }
};