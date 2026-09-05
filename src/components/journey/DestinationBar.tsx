/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Mic, MicOff, Navigation, Sparkles, AlertCircle } from 'lucide-react';

interface DestinationBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  currentDestination: string;
}

export const DestinationBar: React.FC<DestinationBarProps> = ({
  onSearch,
  isLoading,
  currentDestination,
}) => {
  const [query, setQuery] = useState(currentDestination || '');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    if (currentDestination) {
      setQuery(currentDestination);
    }
  }, [currentDestination]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);
    }
  }, []);

  const handleVoiceInput = () => {
    if (!speechSupported) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        onSearch(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setSpeechError(`Voice error: ${event.error || 'Could not capture speech'}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError('Voice recording failed to initialize.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const sampleQueries = [
    'I use a wheelchair. Take me to Chennai Central without stairs.',
    'Find an accessible restaurant near me with ramp access',
    'I have 20 minutes and need minimal walking distance',
    'Take me to City Medical Center West Clinic',
  ];

  return (
    <div id="destination-bar-container" className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="relative flex items-center shadow-sm">
        <div className="absolute left-4 text-stone-400 pointer-events-none flex items-center">
          <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </div>

        <input
          id="input-destination"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where do you want to go? (e.g., 'Chennai Central without stairs')"
          className="w-full pl-12 pr-28 py-3.5 text-base rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
          aria-label="Destination or natural language journey request"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {speechSupported && (
            <button
              id="btn-voice-input"
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading}
              aria-label={isListening ? 'Listening to voice...' : 'Speak destination using voice'}
              className={`p-2 rounded-lg transition-colors focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title="Voice Input (Speech-to-Text)"
            >
              {isListening ? (
                <Mic className="w-5 h-5" aria-hidden="true" />
              ) : (
                <MicOff className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          )}

          <button
            id="btn-submit-search"
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Navigate</span>
          </button>
        </div>
      </form>

      {/* Voice Error Notification */}
      {speechError && (
        <div className="flex items-center gap-2 p-2 text-xs rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Quick Prompt Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="font-semibold text-stone-500 dark:text-stone-400 shrink-0">
          Try asking:
        </span>
        {sampleQueries.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(sample);
              onSearch(sample);
            }}
            className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 border border-stone-200 dark:border-stone-700 transition-colors whitespace-nowrap"
          >
            "{sample}"
          </button>
        ))}
      </div>
    </div>
  );
};
