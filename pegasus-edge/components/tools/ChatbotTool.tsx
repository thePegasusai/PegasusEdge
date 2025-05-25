import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat } from '@google/genai';
import { startChatSession, sendMessageToChatStream } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import type { ChatMessage, GroundingChunk } from '../../types';
import { ChatBubbleLeftRightIcon } from '../../constants';

const ChatbotTool: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [systemInstruction, setSystemInstruction] = useState<string>('You are a sharp, insightful AI Creative Consultant for content creators.');
  const [isEditingSystemInstruction, setIsEditingSystemInstruction] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const initializeChat = useCallback(() => {
    setError(null);
    try {
      const newChatSession = startChatSession(systemInstruction.trim() || undefined);
      setChatSession(newChatSession);
      setMessages([{id: 'init', sender:'ai', text: `AI Consultant ready. How can I sharpen your content strategy today? Current persona: "${systemInstruction}"`, timestamp: new Date()}]);
    } catch (err) {
      setError((err as Error).message || 'Failed to initialize AI Consultant.');
      console.error(err);
    }
  }, [systemInstruction]);
  
  useEffect(() => {
    initializeChat();
  }, []); 

  const handleSystemInstructionSave = () => {
    setIsEditingSystemInstruction(false);
    initializeChat(); 
  };

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || !chatSession) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    const aiMessageId = (Date.now() + 1).toString();
    const aiPlaceholderMessage: ChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      text: '', 
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiPlaceholderMessage]);

    try {
      await sendMessageToChatStream(chatSession, userInput, [], (chunkText, isFinal, sources) => {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === aiMessageId 
            ? { ...msg, text: msg.text + chunkText, sources: sources || msg.sources } 
            : msg
          )
        );
        if (isFinal) {
          setIsLoading(false);
        }
      });
    } catch (err) {
      const errorMsg = (err as Error).message || 'AI response stream failed.';
      setError(errorMsg);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === aiMessageId 
          ? { ...msg, text: `Error: ${errorMsg}` } 
          : msg
        )
      );
      setIsLoading(false);
      console.error(err);
    }
  }, [userInput, chatSession]);


  const renderGroundingSources = (sources?: GroundingChunk[]) => {
    if (!sources || sources.length === 0) return null;
  
    const validSources = sources.filter(source => 
      (source.web && source.web.uri && source.web.title) ||
      (source.retrievedContext && source.retrievedContext.uri && source.retrievedContext.title)
    );
  
    if (validSources.length === 0) return null;
  
    return (
      <div className="mt-2 text-xs">
        <p className="font-semibold text-slate-400">Sourced From:</p>
        <ul className="list-disc list-inside">
          {validSources.map((source, index) => {
            const uri = source.web?.uri || source.retrievedContext?.uri;
            const title = source.web?.title || source.retrievedContext?.title;
            return (
              <li key={index} className="text-purple-400 hover:text-pink-400">
                <a href={uri} target="_blank" rel="noopener noreferrer" title={uri}>
                  {title || uri}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="card-premium p-6 sm:p-8 flex flex-col h-[calc(100vh-220px)] max-h-[750px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ChatBubbleLeftRightIcon className="w-10 h-10 text-green-400 mr-4" />
          <h2 className="font-display text-3xl font-bold text-slate-100">AI Creative Consultant</h2>
        </div>
        <button 
          onClick={() => setIsEditingSystemInstruction(!isEditingSystemInstruction)}
          className="text-sm text-purple-400 hover:text-amber-400 font-semibold"
          aria-label={isEditingSystemInstruction ? 'Cancel Persona Edit' : 'Edit AI Persona'}
        >
          {isEditingSystemInstruction ? 'Cancel' : 'Edit Persona'}
        </button>
      </div>

      {isEditingSystemInstruction && (
        <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <label htmlFor="systemInstruction" className="block text-sm font-semibold text-green-300 mb-1">
            AI Consultant Persona (System Instruction)
          </label>
          <textarea
            id="systemInstruction"
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            placeholder="e.g., You are a cynical game reviewer known for dry wit."
            rows={2}
            className="input-premium bg-slate-800"
          />
          <button
            onClick={handleSystemInstructionSave}
            className="mt-3 btn-premium bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-sm py-2 px-4"
          >
            Save Persona & Restart
          </button>
        </div>
      )}

      <div className="flex-grow overflow-y-auto mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md lg:max-w-lg px-5 py-3 rounded-xl shadow-lg ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' 
                : 'bg-slate-700 text-slate-100'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text || (msg.sender === 'ai' && isLoading && messages[messages.length -1].id === msg.id ? 'Consulting the AI brain...' : '')}</p>
              <span className="text-xs opacity-60 block mt-1.5">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {msg.sender === 'ai' && renderGroundingSources(msg.sources)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
         {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'user' && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow bg-slate-700">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="my-2 p-3 bg-red-800/50 border border-red-600 rounded-md text-red-300">
          <p><strong>Consultation Error:</strong> {error}</p>
        </div>
      )}

      <div className="flex items-center mt-auto">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          placeholder="Ask your AI consultant..."
          className="input-premium flex-grow rounded-r-none focus:z-10"
          disabled={isLoading || !chatSession}
          aria-label="Chat input"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !userInput.trim() || !chatSession}
          className="btn-premium rounded-l-none bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 py-3 px-6 z-0"
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatbotTool;