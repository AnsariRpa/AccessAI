/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityProfile, MobilityType } from '../types';

interface AccessibilityContextType {
  profile: AccessibilityProfile;
  setMobility: (mobility: MobilityType) => void;
  updateProfile: (updates: Partial<AccessibilityProfile>) => void;
  resetToDefaults: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  speechEnabled: boolean;
  toggleSpeech: () => void;
  speakText: (text: string) => void;
}

const DEFAULT_PROFILE: AccessibilityProfile = {
  mobility: 'wheelchair_manual',
  avoidStairs: true,
  preferElevators: true,
  minimizeWalking: true,
  avoidSteepSlopes: true,
  avoidDifficultCrossings: true,
  maxWalkingMinutes: 20,
  requireWideDoors: true,
  requireCurbCuts: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<AccessibilityProfile>(() => {
    try {
      const saved = localStorage.getItem('accessai_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved profile:', e);
    }
    return DEFAULT_PROFILE;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('accessai_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const [speechEnabled, setSpeechEnabled] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('accessai_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save profile:', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('accessai_high_contrast', highContrast ? 'true' : 'false');
      if (highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    } catch (e) {
      console.warn('Could not update contrast class:', e);
    }
  }, [highContrast]);

  const updateProfile = (updates: Partial<AccessibilityProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const setMobility = (mobility: MobilityType) => {
    const isWheelchair = mobility.startsWith('wheelchair');
    const isWalker = mobility === 'walker';
    setProfile(prev => ({
      ...prev,
      mobility,
      avoidStairs: isWheelchair || isWalker ? true : prev.avoidStairs,
      preferElevators: isWheelchair || isWalker ? true : prev.preferElevators,
      requireCurbCuts: isWheelchair ? true : prev.requireCurbCuts,
    }));
  };

  const resetToDefaults = () => {
    setProfile(DEFAULT_PROFILE);
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const toggleSpeech = () => {
    setSpeechEnabled(prev => !prev);
  };

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        profile,
        setMobility,
        updateProfile,
        resetToDefaults,
        highContrast,
        toggleHighContrast,
        speechEnabled,
        toggleSpeech,
        speakText,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
