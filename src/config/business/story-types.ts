/**
 * Story Types Configuration
 * Centralized story type definitions and metadata
 */

export type StoryType = 'original' | 'chemdanhtu' | 'chemdongtu' | 'chemtinhtu' | 'custom';

export interface StoryTypeConfig {
  id: StoryType;
  label: string;
  description: string;
  defaultChemRatio: number;
  isChemingType: boolean;
}

export const STORY_TYPES: Record<StoryType, StoryTypeConfig> = {
  original: {
    id: 'original',
    label: 'Original Story',
    description: 'Standard story without chemical embedding',
    defaultChemRatio: 0,
    isChemingType: false
  },
  chemdanhtu: {
    id: 'chemdanhtu',
    label: 'Noun Embedding',
    description: 'Story with noun chemical embedding',
    defaultChemRatio: 0.3,
    isChemingType: true
  },
  chemdongtu: {
    id: 'chemdongtu',
    label: 'Verb Embedding',
    description: 'Story with verb chemical embedding',
    defaultChemRatio: 0.3,
    isChemingType: true
  },
  chemtinhtu: {
    id: 'chemtinhtu',
    label: 'Adjective Embedding',
    description: 'Story with adjective chemical embedding',
    defaultChemRatio: 0.3,
    isChemingType: true
  },
  custom: {
    id: 'custom',
    label: 'Custom Story',
    description: 'Custom story type with flexible configuration',
    defaultChemRatio: 0.2,
    isChemingType: false
  }
};

// Valid story types array for validation
export const VALID_STORY_TYPES: StoryType[] = Object.keys(STORY_TYPES) as StoryType[];

// Helper functions
export function getStoryTypeConfig(type: StoryType): StoryTypeConfig {
  return STORY_TYPES[type];
}

export function isValidStoryType(type: string): type is StoryType {
  return VALID_STORY_TYPES.includes(type as StoryType);
}

export function getChemingStoryTypes(): StoryType[] {
  return VALID_STORY_TYPES.filter(type => STORY_TYPES[type].isChemingType);
}

export function getDefaultChemRatio(type: StoryType): number {
  return STORY_TYPES[type].defaultChemRatio;
}
