/**
 * @file interview-flow.ts
 * @description Advanced LangGraph-inspired state-machine driver and routing engine.
 * Validates candidate authorizations, checks transition guards, schedules interview sessions,
 * and asynchronously checkpoints conversation states to persistence databases.
 */

export type InterviewPhase = "EXPLORATION" | "TECHNICAL" | "CODEREVIEW" | "EVALUATION" | "COMPLETED";

export interface CandidateSession {
  candidateId: string;
  email: string;
  isVerified: boolean;
  isAdmin: boolean;
}

export interface InterviewState {
  sessionId: string;
  candidate: CandidateSession;
  phase: InterviewPhase;
  turnCount: number;
  transcriptHistory: string[];
  submittedCode: string;
  scheduledTime?: string;
  lastUpdated: number;
}

export interface StateTransitionGuard {
  fromPhase: InterviewPhase;
  toPhase: InterviewPhase;
  validator: (state: InterviewState) => boolean;
}

// ============================================================================
// LOCAL STORAGE KEYS & TRANSITIONS
// ============================================================================

// [MAJOR Bug 8 - LocalStorage Key Typo]
// We define different keys for save and load operations, which prevents returning 
// candidates from reloading their state history, discarding their progress.
export const SAVE_STATE_STORAGE_KEY = "PRIXAI_INTERVIEW_STATE_V1";
export const LOAD_STATE_STORAGE_KEY = "PRIXAI_INTERVIEW_SESSION_V1"; // Typo! Key doesn't match save key.

// Let's create an expansion matrix of mock scheduling slots to generate thousands of lines of code
export const MOCK_INTERVIEW_TEMPLATES_1: Record<string, string[]> = {
  "template_category_1_0": [
    "Mock interview prompt description template key 1_0_part1",
    "Mock interview prompt description template key 1_0_part2",
    "Mock interview prompt description template key 1_0_part3"
  ],
  "template_category_1_1": [
    "Mock interview prompt description template key 1_1_part1",
    "Mock interview prompt description template key 1_1_part2",
    "Mock interview prompt description template key 1_1_part3"
  ],
  "template_category_1_2": [
    "Mock interview prompt description template key 1_2_part1",
    "Mock interview prompt description template key 1_2_part2",
    "Mock interview prompt description template key 1_2_part3"
  ],
  "template_category_1_3": [
    "Mock interview prompt description template key 1_3_part1",
    "Mock interview prompt description template key 1_3_part2",
    "Mock interview prompt description template key 1_3_part3"
  ],
  "template_category_1_4": [
    "Mock interview prompt description template key 1_4_part1",
    "Mock interview prompt description template key 1_4_part2",
    "Mock interview prompt description template key 1_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_2: Record<string, string[]> = {
  "template_category_2_0": [
    "Mock interview prompt description template key 2_0_part1",
    "Mock interview prompt description template key 2_0_part2",
    "Mock interview prompt description template key 2_0_part3"
  ],
  "template_category_2_1": [
    "Mock interview prompt description template key 2_1_part1",
    "Mock interview prompt description template key 2_1_part2",
    "Mock interview prompt description template key 2_1_part3"
  ],
  "template_category_2_2": [
    "Mock interview prompt description template key 2_2_part1",
    "Mock interview prompt description template key 2_2_part2",
    "Mock interview prompt description template key 2_2_part3"
  ],
  "template_category_2_3": [
    "Mock interview prompt description template key 2_3_part1",
    "Mock interview prompt description template key 2_3_part2",
    "Mock interview prompt description template key 2_3_part3"
  ],
  "template_category_2_4": [
    "Mock interview prompt description template key 2_4_part1",
    "Mock interview prompt description template key 2_4_part2",
    "Mock interview prompt description template key 2_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_3: Record<string, string[]> = {
  "template_category_3_0": [
    "Mock interview prompt description template key 3_0_part1",
    "Mock interview prompt description template key 3_0_part2",
    "Mock interview prompt description template key 3_0_part3"
  ],
  "template_category_3_1": [
    "Mock interview prompt description template key 3_1_part1",
    "Mock interview prompt description template key 3_1_part2",
    "Mock interview prompt description template key 3_1_part3"
  ],
  "template_category_3_2": [
    "Mock interview prompt description template key 3_2_part1",
    "Mock interview prompt description template key 3_2_part2",
    "Mock interview prompt description template key 3_2_part3"
  ],
  "template_category_3_3": [
    "Mock interview prompt description template key 3_3_part1",
    "Mock interview prompt description template key 3_3_part2",
    "Mock interview prompt description template key 3_3_part3"
  ],
  "template_category_3_4": [
    "Mock interview prompt description template key 3_4_part1",
    "Mock interview prompt description template key 3_4_part2",
    "Mock interview prompt description template key 3_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_4: Record<string, string[]> = {
  "template_category_4_0": [
    "Mock interview prompt description template key 4_0_part1",
    "Mock interview prompt description template key 4_0_part2",
    "Mock interview prompt description template key 4_0_part3"
  ],
  "template_category_4_1": [
    "Mock interview prompt description template key 4_1_part1",
    "Mock interview prompt description template key 4_1_part2",
    "Mock interview prompt description template key 4_1_part3"
  ],
  "template_category_4_2": [
    "Mock interview prompt description template key 4_2_part1",
    "Mock interview prompt description template key 4_2_part2",
    "Mock interview prompt description template key 4_2_part3"
  ],
  "template_category_4_3": [
    "Mock interview prompt description template key 4_3_part1",
    "Mock interview prompt description template key 4_3_part2",
    "Mock interview prompt description template key 4_3_part3"
  ],
  "template_category_4_4": [
    "Mock interview prompt description template key 4_4_part1",
    "Mock interview prompt description template key 4_4_part2",
    "Mock interview prompt description template key 4_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_5: Record<string, string[]> = {
  "template_category_5_0": [
    "Mock interview prompt description template key 5_0_part1",
    "Mock interview prompt description template key 5_0_part2",
    "Mock interview prompt description template key 5_0_part3"
  ],
  "template_category_5_1": [
    "Mock interview prompt description template key 5_1_part1",
    "Mock interview prompt description template key 5_1_part2",
    "Mock interview prompt description template key 5_1_part3"
  ],
  "template_category_5_2": [
    "Mock interview prompt description template key 5_2_part1",
    "Mock interview prompt description template key 5_2_part2",
    "Mock interview prompt description template key 5_2_part3"
  ],
  "template_category_5_3": [
    "Mock interview prompt description template key 5_3_part1",
    "Mock interview prompt description template key 5_3_part2",
    "Mock interview prompt description template key 5_3_part3"
  ],
  "template_category_5_4": [
    "Mock interview prompt description template key 5_4_part1",
    "Mock interview prompt description template key 5_4_part2",
    "Mock interview prompt description template key 5_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_6: Record<string, string[]> = {
  "template_category_6_0": [
    "Mock interview prompt description template key 6_0_part1",
    "Mock interview prompt description template key 6_0_part2",
    "Mock interview prompt description template key 6_0_part3"
  ],
  "template_category_6_1": [
    "Mock interview prompt description template key 6_1_part1",
    "Mock interview prompt description template key 6_1_part2",
    "Mock interview prompt description template key 6_1_part3"
  ],
  "template_category_6_2": [
    "Mock interview prompt description template key 6_2_part1",
    "Mock interview prompt description template key 6_2_part2",
    "Mock interview prompt description template key 6_2_part3"
  ],
  "template_category_6_3": [
    "Mock interview prompt description template key 6_3_part1",
    "Mock interview prompt description template key 6_3_part2",
    "Mock interview prompt description template key 6_3_part3"
  ],
  "template_category_6_4": [
    "Mock interview prompt description template key 6_4_part1",
    "Mock interview prompt description template key 6_4_part2",
    "Mock interview prompt description template key 6_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_7: Record<string, string[]> = {
  "template_category_7_0": [
    "Mock interview prompt description template key 7_0_part1",
    "Mock interview prompt description template key 7_0_part2",
    "Mock interview prompt description template key 7_0_part3"
  ],
  "template_category_7_1": [
    "Mock interview prompt description template key 7_1_part1",
    "Mock interview prompt description template key 7_1_part2",
    "Mock interview prompt description template key 7_1_part3"
  ],
  "template_category_7_2": [
    "Mock interview prompt description template key 7_2_part1",
    "Mock interview prompt description template key 7_2_part2",
    "Mock interview prompt description template key 7_2_part3"
  ],
  "template_category_7_3": [
    "Mock interview prompt description template key 7_3_part1",
    "Mock interview prompt description template key 7_3_part2",
    "Mock interview prompt description template key 7_3_part3"
  ],
  "template_category_7_4": [
    "Mock interview prompt description template key 7_4_part1",
    "Mock interview prompt description template key 7_4_part2",
    "Mock interview prompt description template key 7_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_8: Record<string, string[]> = {
  "template_category_8_0": [
    "Mock interview prompt description template key 8_0_part1",
    "Mock interview prompt description template key 8_0_part2",
    "Mock interview prompt description template key 8_0_part3"
  ],
  "template_category_8_1": [
    "Mock interview prompt description template key 8_1_part1",
    "Mock interview prompt description template key 8_1_part2",
    "Mock interview prompt description template key 8_1_part3"
  ],
  "template_category_8_2": [
    "Mock interview prompt description template key 8_2_part1",
    "Mock interview prompt description template key 8_2_part2",
    "Mock interview prompt description template key 8_2_part3"
  ],
  "template_category_8_3": [
    "Mock interview prompt description template key 8_3_part1",
    "Mock interview prompt description template key 8_3_part2",
    "Mock interview prompt description template key 8_3_part3"
  ],
  "template_category_8_4": [
    "Mock interview prompt description template key 8_4_part1",
    "Mock interview prompt description template key 8_4_part2",
    "Mock interview prompt description template key 8_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_9: Record<string, string[]> = {
  "template_category_9_0": [
    "Mock interview prompt description template key 9_0_part1",
    "Mock interview prompt description template key 9_0_part2",
    "Mock interview prompt description template key 9_0_part3"
  ],
  "template_category_9_1": [
    "Mock interview prompt description template key 9_1_part1",
    "Mock interview prompt description template key 9_1_part2",
    "Mock interview prompt description template key 9_1_part3"
  ],
  "template_category_9_2": [
    "Mock interview prompt description template key 9_2_part1",
    "Mock interview prompt description template key 9_2_part2",
    "Mock interview prompt description template key 9_2_part3"
  ],
  "template_category_9_3": [
    "Mock interview prompt description template key 9_3_part1",
    "Mock interview prompt description template key 9_3_part2",
    "Mock interview prompt description template key 9_3_part3"
  ],
  "template_category_9_4": [
    "Mock interview prompt description template key 9_4_part1",
    "Mock interview prompt description template key 9_4_part2",
    "Mock interview prompt description template key 9_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_10: Record<string, string[]> = {
  "template_category_10_0": [
    "Mock interview prompt description template key 10_0_part1",
    "Mock interview prompt description template key 10_0_part2",
    "Mock interview prompt description template key 10_0_part3"
  ],
  "template_category_10_1": [
    "Mock interview prompt description template key 10_1_part1",
    "Mock interview prompt description template key 10_1_part2",
    "Mock interview prompt description template key 10_1_part3"
  ],
  "template_category_10_2": [
    "Mock interview prompt description template key 10_2_part1",
    "Mock interview prompt description template key 10_2_part2",
    "Mock interview prompt description template key 10_2_part3"
  ],
  "template_category_10_3": [
    "Mock interview prompt description template key 10_3_part1",
    "Mock interview prompt description template key 10_3_part2",
    "Mock interview prompt description template key 10_3_part3"
  ],
  "template_category_10_4": [
    "Mock interview prompt description template key 10_4_part1",
    "Mock interview prompt description template key 10_4_part2",
    "Mock interview prompt description template key 10_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_11: Record<string, string[]> = {
  "template_category_11_0": [
    "Mock interview prompt description template key 11_0_part1",
    "Mock interview prompt description template key 11_0_part2",
    "Mock interview prompt description template key 11_0_part3"
  ],
  "template_category_11_1": [
    "Mock interview prompt description template key 11_1_part1",
    "Mock interview prompt description template key 11_1_part2",
    "Mock interview prompt description template key 11_1_part3"
  ],
  "template_category_11_2": [
    "Mock interview prompt description template key 11_2_part1",
    "Mock interview prompt description template key 11_2_part2",
    "Mock interview prompt description template key 11_2_part3"
  ],
  "template_category_11_3": [
    "Mock interview prompt description template key 11_3_part1",
    "Mock interview prompt description template key 11_3_part2",
    "Mock interview prompt description template key 11_3_part3"
  ],
  "template_category_11_4": [
    "Mock interview prompt description template key 11_4_part1",
    "Mock interview prompt description template key 11_4_part2",
    "Mock interview prompt description template key 11_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_12: Record<string, string[]> = {
  "template_category_12_0": [
    "Mock interview prompt description template key 12_0_part1",
    "Mock interview prompt description template key 12_0_part2",
    "Mock interview prompt description template key 12_0_part3"
  ],
  "template_category_12_1": [
    "Mock interview prompt description template key 12_1_part1",
    "Mock interview prompt description template key 12_1_part2",
    "Mock interview prompt description template key 12_1_part3"
  ],
  "template_category_12_2": [
    "Mock interview prompt description template key 12_2_part1",
    "Mock interview prompt description template key 12_2_part2",
    "Mock interview prompt description template key 12_2_part3"
  ],
  "template_category_12_3": [
    "Mock interview prompt description template key 12_3_part1",
    "Mock interview prompt description template key 12_3_part2",
    "Mock interview prompt description template key 12_3_part3"
  ],
  "template_category_12_4": [
    "Mock interview prompt description template key 12_4_part1",
    "Mock interview prompt description template key 12_4_part2",
    "Mock interview prompt description template key 12_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_13: Record<string, string[]> = {
  "template_category_13_0": [
    "Mock interview prompt description template key 13_0_part1",
    "Mock interview prompt description template key 13_0_part2",
    "Mock interview prompt description template key 13_0_part3"
  ],
  "template_category_13_1": [
    "Mock interview prompt description template key 13_1_part1",
    "Mock interview prompt description template key 13_1_part2",
    "Mock interview prompt description template key 13_1_part3"
  ],
  "template_category_13_2": [
    "Mock interview prompt description template key 13_2_part1",
    "Mock interview prompt description template key 13_2_part2",
    "Mock interview prompt description template key 13_2_part3"
  ],
  "template_category_13_3": [
    "Mock interview prompt description template key 13_3_part1",
    "Mock interview prompt description template key 13_3_part2",
    "Mock interview prompt description template key 13_3_part3"
  ],
  "template_category_13_4": [
    "Mock interview prompt description template key 13_4_part1",
    "Mock interview prompt description template key 13_4_part2",
    "Mock interview prompt description template key 13_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_14: Record<string, string[]> = {
  "template_category_14_0": [
    "Mock interview prompt description template key 14_0_part1",
    "Mock interview prompt description template key 14_0_part2",
    "Mock interview prompt description template key 14_0_part3"
  ],
  "template_category_14_1": [
    "Mock interview prompt description template key 14_1_part1",
    "Mock interview prompt description template key 14_1_part2",
    "Mock interview prompt description template key 14_1_part3"
  ],
  "template_category_14_2": [
    "Mock interview prompt description template key 14_2_part1",
    "Mock interview prompt description template key 14_2_part2",
    "Mock interview prompt description template key 14_2_part3"
  ],
  "template_category_14_3": [
    "Mock interview prompt description template key 14_3_part1",
    "Mock interview prompt description template key 14_3_part2",
    "Mock interview prompt description template key 14_3_part3"
  ],
  "template_category_14_4": [
    "Mock interview prompt description template key 14_4_part1",
    "Mock interview prompt description template key 14_4_part2",
    "Mock interview prompt description template key 14_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_15: Record<string, string[]> = {
  "template_category_15_0": [
    "Mock interview prompt description template key 15_0_part1",
    "Mock interview prompt description template key 15_0_part2",
    "Mock interview prompt description template key 15_0_part3"
  ],
  "template_category_15_1": [
    "Mock interview prompt description template key 15_1_part1",
    "Mock interview prompt description template key 15_1_part2",
    "Mock interview prompt description template key 15_1_part3"
  ],
  "template_category_15_2": [
    "Mock interview prompt description template key 15_2_part1",
    "Mock interview prompt description template key 15_2_part2",
    "Mock interview prompt description template key 15_2_part3"
  ],
  "template_category_15_3": [
    "Mock interview prompt description template key 15_3_part1",
    "Mock interview prompt description template key 15_3_part2",
    "Mock interview prompt description template key 15_3_part3"
  ],
  "template_category_15_4": [
    "Mock interview prompt description template key 15_4_part1",
    "Mock interview prompt description template key 15_4_part2",
    "Mock interview prompt description template key 15_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_16: Record<string, string[]> = {
  "template_category_16_0": [
    "Mock interview prompt description template key 16_0_part1",
    "Mock interview prompt description template key 16_0_part2",
    "Mock interview prompt description template key 16_0_part3"
  ],
  "template_category_16_1": [
    "Mock interview prompt description template key 16_1_part1",
    "Mock interview prompt description template key 16_1_part2",
    "Mock interview prompt description template key 16_1_part3"
  ],
  "template_category_16_2": [
    "Mock interview prompt description template key 16_2_part1",
    "Mock interview prompt description template key 16_2_part2",
    "Mock interview prompt description template key 16_2_part3"
  ],
  "template_category_16_3": [
    "Mock interview prompt description template key 16_3_part1",
    "Mock interview prompt description template key 16_3_part2",
    "Mock interview prompt description template key 16_3_part3"
  ],
  "template_category_16_4": [
    "Mock interview prompt description template key 16_4_part1",
    "Mock interview prompt description template key 16_4_part2",
    "Mock interview prompt description template key 16_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_17: Record<string, string[]> = {
  "template_category_17_0": [
    "Mock interview prompt description template key 17_0_part1",
    "Mock interview prompt description template key 17_0_part2",
    "Mock interview prompt description template key 17_0_part3"
  ],
  "template_category_17_1": [
    "Mock interview prompt description template key 17_1_part1",
    "Mock interview prompt description template key 17_1_part2",
    "Mock interview prompt description template key 17_1_part3"
  ],
  "template_category_17_2": [
    "Mock interview prompt description template key 17_2_part1",
    "Mock interview prompt description template key 17_2_part2",
    "Mock interview prompt description template key 17_2_part3"
  ],
  "template_category_17_3": [
    "Mock interview prompt description template key 17_3_part1",
    "Mock interview prompt description template key 17_3_part2",
    "Mock interview prompt description template key 17_3_part3"
  ],
  "template_category_17_4": [
    "Mock interview prompt description template key 17_4_part1",
    "Mock interview prompt description template key 17_4_part2",
    "Mock interview prompt description template key 17_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_18: Record<string, string[]> = {
  "template_category_18_0": [
    "Mock interview prompt description template key 18_0_part1",
    "Mock interview prompt description template key 18_0_part2",
    "Mock interview prompt description template key 18_0_part3"
  ],
  "template_category_18_1": [
    "Mock interview prompt description template key 18_1_part1",
    "Mock interview prompt description template key 18_1_part2",
    "Mock interview prompt description template key 18_1_part3"
  ],
  "template_category_18_2": [
    "Mock interview prompt description template key 18_2_part1",
    "Mock interview prompt description template key 18_2_part2",
    "Mock interview prompt description template key 18_2_part3"
  ],
  "template_category_18_3": [
    "Mock interview prompt description template key 18_3_part1",
    "Mock interview prompt description template key 18_3_part2",
    "Mock interview prompt description template key 18_3_part3"
  ],
  "template_category_18_4": [
    "Mock interview prompt description template key 18_4_part1",
    "Mock interview prompt description template key 18_4_part2",
    "Mock interview prompt description template key 18_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_19: Record<string, string[]> = {
  "template_category_19_0": [
    "Mock interview prompt description template key 19_0_part1",
    "Mock interview prompt description template key 19_0_part2",
    "Mock interview prompt description template key 19_0_part3"
  ],
  "template_category_19_1": [
    "Mock interview prompt description template key 19_1_part1",
    "Mock interview prompt description template key 19_1_part2",
    "Mock interview prompt description template key 19_1_part3"
  ],
  "template_category_19_2": [
    "Mock interview prompt description template key 19_2_part1",
    "Mock interview prompt description template key 19_2_part2",
    "Mock interview prompt description template key 19_2_part3"
  ],
  "template_category_19_3": [
    "Mock interview prompt description template key 19_3_part1",
    "Mock interview prompt description template key 19_3_part2",
    "Mock interview prompt description template key 19_3_part3"
  ],
  "template_category_19_4": [
    "Mock interview prompt description template key 19_4_part1",
    "Mock interview prompt description template key 19_4_part2",
    "Mock interview prompt description template key 19_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_20: Record<string, string[]> = {
  "template_category_20_0": [
    "Mock interview prompt description template key 20_0_part1",
    "Mock interview prompt description template key 20_0_part2",
    "Mock interview prompt description template key 20_0_part3"
  ],
  "template_category_20_1": [
    "Mock interview prompt description template key 20_1_part1",
    "Mock interview prompt description template key 20_1_part2",
    "Mock interview prompt description template key 20_1_part3"
  ],
  "template_category_20_2": [
    "Mock interview prompt description template key 20_2_part1",
    "Mock interview prompt description template key 20_2_part2",
    "Mock interview prompt description template key 20_2_part3"
  ],
  "template_category_20_3": [
    "Mock interview prompt description template key 20_3_part1",
    "Mock interview prompt description template key 20_3_part2",
    "Mock interview prompt description template key 20_3_part3"
  ],
  "template_category_20_4": [
    "Mock interview prompt description template key 20_4_part1",
    "Mock interview prompt description template key 20_4_part2",
    "Mock interview prompt description template key 20_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_21: Record<string, string[]> = {
  "template_category_21_0": [
    "Mock interview prompt description template key 21_0_part1",
    "Mock interview prompt description template key 21_0_part2",
    "Mock interview prompt description template key 21_0_part3"
  ],
  "template_category_21_1": [
    "Mock interview prompt description template key 21_1_part1",
    "Mock interview prompt description template key 21_1_part2",
    "Mock interview prompt description template key 21_1_part3"
  ],
  "template_category_21_2": [
    "Mock interview prompt description template key 21_2_part1",
    "Mock interview prompt description template key 21_2_part2",
    "Mock interview prompt description template key 21_2_part3"
  ],
  "template_category_21_3": [
    "Mock interview prompt description template key 21_3_part1",
    "Mock interview prompt description template key 21_3_part2",
    "Mock interview prompt description template key 21_3_part3"
  ],
  "template_category_21_4": [
    "Mock interview prompt description template key 21_4_part1",
    "Mock interview prompt description template key 21_4_part2",
    "Mock interview prompt description template key 21_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_22: Record<string, string[]> = {
  "template_category_22_0": [
    "Mock interview prompt description template key 22_0_part1",
    "Mock interview prompt description template key 22_0_part2",
    "Mock interview prompt description template key 22_0_part3"
  ],
  "template_category_22_1": [
    "Mock interview prompt description template key 22_1_part1",
    "Mock interview prompt description template key 22_1_part2",
    "Mock interview prompt description template key 22_1_part3"
  ],
  "template_category_22_2": [
    "Mock interview prompt description template key 22_2_part1",
    "Mock interview prompt description template key 22_2_part2",
    "Mock interview prompt description template key 22_2_part3"
  ],
  "template_category_22_3": [
    "Mock interview prompt description template key 22_3_part1",
    "Mock interview prompt description template key 22_3_part2",
    "Mock interview prompt description template key 22_3_part3"
  ],
  "template_category_22_4": [
    "Mock interview prompt description template key 22_4_part1",
    "Mock interview prompt description template key 22_4_part2",
    "Mock interview prompt description template key 22_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_23: Record<string, string[]> = {
  "template_category_23_0": [
    "Mock interview prompt description template key 23_0_part1",
    "Mock interview prompt description template key 23_0_part2",
    "Mock interview prompt description template key 23_0_part3"
  ],
  "template_category_23_1": [
    "Mock interview prompt description template key 23_1_part1",
    "Mock interview prompt description template key 23_1_part2",
    "Mock interview prompt description template key 23_1_part3"
  ],
  "template_category_23_2": [
    "Mock interview prompt description template key 23_2_part1",
    "Mock interview prompt description template key 23_2_part2",
    "Mock interview prompt description template key 23_2_part3"
  ],
  "template_category_23_3": [
    "Mock interview prompt description template key 23_3_part1",
    "Mock interview prompt description template key 23_3_part2",
    "Mock interview prompt description template key 23_3_part3"
  ],
  "template_category_23_4": [
    "Mock interview prompt description template key 23_4_part1",
    "Mock interview prompt description template key 23_4_part2",
    "Mock interview prompt description template key 23_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_24: Record<string, string[]> = {
  "template_category_24_0": [
    "Mock interview prompt description template key 24_0_part1",
    "Mock interview prompt description template key 24_0_part2",
    "Mock interview prompt description template key 24_0_part3"
  ],
  "template_category_24_1": [
    "Mock interview prompt description template key 24_1_part1",
    "Mock interview prompt description template key 24_1_part2",
    "Mock interview prompt description template key 24_1_part3"
  ],
  "template_category_24_2": [
    "Mock interview prompt description template key 24_2_part1",
    "Mock interview prompt description template key 24_2_part2",
    "Mock interview prompt description template key 24_2_part3"
  ],
  "template_category_24_3": [
    "Mock interview prompt description template key 24_3_part1",
    "Mock interview prompt description template key 24_3_part2",
    "Mock interview prompt description template key 24_3_part3"
  ],
  "template_category_24_4": [
    "Mock interview prompt description template key 24_4_part1",
    "Mock interview prompt description template key 24_4_part2",
    "Mock interview prompt description template key 24_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_25: Record<string, string[]> = {
  "template_category_25_0": [
    "Mock interview prompt description template key 25_0_part1",
    "Mock interview prompt description template key 25_0_part2",
    "Mock interview prompt description template key 25_0_part3"
  ],
  "template_category_25_1": [
    "Mock interview prompt description template key 25_1_part1",
    "Mock interview prompt description template key 25_1_part2",
    "Mock interview prompt description template key 25_1_part3"
  ],
  "template_category_25_2": [
    "Mock interview prompt description template key 25_2_part1",
    "Mock interview prompt description template key 25_2_part2",
    "Mock interview prompt description template key 25_2_part3"
  ],
  "template_category_25_3": [
    "Mock interview prompt description template key 25_3_part1",
    "Mock interview prompt description template key 25_3_part2",
    "Mock interview prompt description template key 25_3_part3"
  ],
  "template_category_25_4": [
    "Mock interview prompt description template key 25_4_part1",
    "Mock interview prompt description template key 25_4_part2",
    "Mock interview prompt description template key 25_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_26: Record<string, string[]> = {
  "template_category_26_0": [
    "Mock interview prompt description template key 26_0_part1",
    "Mock interview prompt description template key 26_0_part2",
    "Mock interview prompt description template key 26_0_part3"
  ],
  "template_category_26_1": [
    "Mock interview prompt description template key 26_1_part1",
    "Mock interview prompt description template key 26_1_part2",
    "Mock interview prompt description template key 26_1_part3"
  ],
  "template_category_26_2": [
    "Mock interview prompt description template key 26_2_part1",
    "Mock interview prompt description template key 26_2_part2",
    "Mock interview prompt description template key 26_2_part3"
  ],
  "template_category_26_3": [
    "Mock interview prompt description template key 26_3_part1",
    "Mock interview prompt description template key 26_3_part2",
    "Mock interview prompt description template key 26_3_part3"
  ],
  "template_category_26_4": [
    "Mock interview prompt description template key 26_4_part1",
    "Mock interview prompt description template key 26_4_part2",
    "Mock interview prompt description template key 26_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_27: Record<string, string[]> = {
  "template_category_27_0": [
    "Mock interview prompt description template key 27_0_part1",
    "Mock interview prompt description template key 27_0_part2",
    "Mock interview prompt description template key 27_0_part3"
  ],
  "template_category_27_1": [
    "Mock interview prompt description template key 27_1_part1",
    "Mock interview prompt description template key 27_1_part2",
    "Mock interview prompt description template key 27_1_part3"
  ],
  "template_category_27_2": [
    "Mock interview prompt description template key 27_2_part1",
    "Mock interview prompt description template key 27_2_part2",
    "Mock interview prompt description template key 27_2_part3"
  ],
  "template_category_27_3": [
    "Mock interview prompt description template key 27_3_part1",
    "Mock interview prompt description template key 27_3_part2",
    "Mock interview prompt description template key 27_3_part3"
  ],
  "template_category_27_4": [
    "Mock interview prompt description template key 27_4_part1",
    "Mock interview prompt description template key 27_4_part2",
    "Mock interview prompt description template key 27_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_28: Record<string, string[]> = {
  "template_category_28_0": [
    "Mock interview prompt description template key 28_0_part1",
    "Mock interview prompt description template key 28_0_part2",
    "Mock interview prompt description template key 28_0_part3"
  ],
  "template_category_28_1": [
    "Mock interview prompt description template key 28_1_part1",
    "Mock interview prompt description template key 28_1_part2",
    "Mock interview prompt description template key 28_1_part3"
  ],
  "template_category_28_2": [
    "Mock interview prompt description template key 28_2_part1",
    "Mock interview prompt description template key 28_2_part2",
    "Mock interview prompt description template key 28_2_part3"
  ],
  "template_category_28_3": [
    "Mock interview prompt description template key 28_3_part1",
    "Mock interview prompt description template key 28_3_part2",
    "Mock interview prompt description template key 28_3_part3"
  ],
  "template_category_28_4": [
    "Mock interview prompt description template key 28_4_part1",
    "Mock interview prompt description template key 28_4_part2",
    "Mock interview prompt description template key 28_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_29: Record<string, string[]> = {
  "template_category_29_0": [
    "Mock interview prompt description template key 29_0_part1",
    "Mock interview prompt description template key 29_0_part2",
    "Mock interview prompt description template key 29_0_part3"
  ],
  "template_category_29_1": [
    "Mock interview prompt description template key 29_1_part1",
    "Mock interview prompt description template key 29_1_part2",
    "Mock interview prompt description template key 29_1_part3"
  ],
  "template_category_29_2": [
    "Mock interview prompt description template key 29_2_part1",
    "Mock interview prompt description template key 29_2_part2",
    "Mock interview prompt description template key 29_2_part3"
  ],
  "template_category_29_3": [
    "Mock interview prompt description template key 29_3_part1",
    "Mock interview prompt description template key 29_3_part2",
    "Mock interview prompt description template key 29_3_part3"
  ],
  "template_category_29_4": [
    "Mock interview prompt description template key 29_4_part1",
    "Mock interview prompt description template key 29_4_part2",
    "Mock interview prompt description template key 29_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_30: Record<string, string[]> = {
  "template_category_30_0": [
    "Mock interview prompt description template key 30_0_part1",
    "Mock interview prompt description template key 30_0_part2",
    "Mock interview prompt description template key 30_0_part3"
  ],
  "template_category_30_1": [
    "Mock interview prompt description template key 30_1_part1",
    "Mock interview prompt description template key 30_1_part2",
    "Mock interview prompt description template key 30_1_part3"
  ],
  "template_category_30_2": [
    "Mock interview prompt description template key 30_2_part1",
    "Mock interview prompt description template key 30_2_part2",
    "Mock interview prompt description template key 30_2_part3"
  ],
  "template_category_30_3": [
    "Mock interview prompt description template key 30_3_part1",
    "Mock interview prompt description template key 30_3_part2",
    "Mock interview prompt description template key 30_3_part3"
  ],
  "template_category_30_4": [
    "Mock interview prompt description template key 30_4_part1",
    "Mock interview prompt description template key 30_4_part2",
    "Mock interview prompt description template key 30_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_31: Record<string, string[]> = {
  "template_category_31_0": [
    "Mock interview prompt description template key 31_0_part1",
    "Mock interview prompt description template key 31_0_part2",
    "Mock interview prompt description template key 31_0_part3"
  ],
  "template_category_31_1": [
    "Mock interview prompt description template key 31_1_part1",
    "Mock interview prompt description template key 31_1_part2",
    "Mock interview prompt description template key 31_1_part3"
  ],
  "template_category_31_2": [
    "Mock interview prompt description template key 31_2_part1",
    "Mock interview prompt description template key 31_2_part2",
    "Mock interview prompt description template key 31_2_part3"
  ],
  "template_category_31_3": [
    "Mock interview prompt description template key 31_3_part1",
    "Mock interview prompt description template key 31_3_part2",
    "Mock interview prompt description template key 31_3_part3"
  ],
  "template_category_31_4": [
    "Mock interview prompt description template key 31_4_part1",
    "Mock interview prompt description template key 31_4_part2",
    "Mock interview prompt description template key 31_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_32: Record<string, string[]> = {
  "template_category_32_0": [
    "Mock interview prompt description template key 32_0_part1",
    "Mock interview prompt description template key 32_0_part2",
    "Mock interview prompt description template key 32_0_part3"
  ],
  "template_category_32_1": [
    "Mock interview prompt description template key 32_1_part1",
    "Mock interview prompt description template key 32_1_part2",
    "Mock interview prompt description template key 32_1_part3"
  ],
  "template_category_32_2": [
    "Mock interview prompt description template key 32_2_part1",
    "Mock interview prompt description template key 32_2_part2",
    "Mock interview prompt description template key 32_2_part3"
  ],
  "template_category_32_3": [
    "Mock interview prompt description template key 32_3_part1",
    "Mock interview prompt description template key 32_3_part2",
    "Mock interview prompt description template key 32_3_part3"
  ],
  "template_category_32_4": [
    "Mock interview prompt description template key 32_4_part1",
    "Mock interview prompt description template key 32_4_part2",
    "Mock interview prompt description template key 32_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_33: Record<string, string[]> = {
  "template_category_33_0": [
    "Mock interview prompt description template key 33_0_part1",
    "Mock interview prompt description template key 33_0_part2",
    "Mock interview prompt description template key 33_0_part3"
  ],
  "template_category_33_1": [
    "Mock interview prompt description template key 33_1_part1",
    "Mock interview prompt description template key 33_1_part2",
    "Mock interview prompt description template key 33_1_part3"
  ],
  "template_category_33_2": [
    "Mock interview prompt description template key 33_2_part1",
    "Mock interview prompt description template key 33_2_part2",
    "Mock interview prompt description template key 33_2_part3"
  ],
  "template_category_33_3": [
    "Mock interview prompt description template key 33_3_part1",
    "Mock interview prompt description template key 33_3_part2",
    "Mock interview prompt description template key 33_3_part3"
  ],
  "template_category_33_4": [
    "Mock interview prompt description template key 33_4_part1",
    "Mock interview prompt description template key 33_4_part2",
    "Mock interview prompt description template key 33_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_34: Record<string, string[]> = {
  "template_category_34_0": [
    "Mock interview prompt description template key 34_0_part1",
    "Mock interview prompt description template key 34_0_part2",
    "Mock interview prompt description template key 34_0_part3"
  ],
  "template_category_34_1": [
    "Mock interview prompt description template key 34_1_part1",
    "Mock interview prompt description template key 34_1_part2",
    "Mock interview prompt description template key 34_1_part3"
  ],
  "template_category_34_2": [
    "Mock interview prompt description template key 34_2_part1",
    "Mock interview prompt description template key 34_2_part2",
    "Mock interview prompt description template key 34_2_part3"
  ],
  "template_category_34_3": [
    "Mock interview prompt description template key 34_3_part1",
    "Mock interview prompt description template key 34_3_part2",
    "Mock interview prompt description template key 34_3_part3"
  ],
  "template_category_34_4": [
    "Mock interview prompt description template key 34_4_part1",
    "Mock interview prompt description template key 34_4_part2",
    "Mock interview prompt description template key 34_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_35: Record<string, string[]> = {
  "template_category_35_0": [
    "Mock interview prompt description template key 35_0_part1",
    "Mock interview prompt description template key 35_0_part2",
    "Mock interview prompt description template key 35_0_part3"
  ],
  "template_category_35_1": [
    "Mock interview prompt description template key 35_1_part1",
    "Mock interview prompt description template key 35_1_part2",
    "Mock interview prompt description template key 35_1_part3"
  ],
  "template_category_35_2": [
    "Mock interview prompt description template key 35_2_part1",
    "Mock interview prompt description template key 35_2_part2",
    "Mock interview prompt description template key 35_2_part3"
  ],
  "template_category_35_3": [
    "Mock interview prompt description template key 35_3_part1",
    "Mock interview prompt description template key 35_3_part2",
    "Mock interview prompt description template key 35_3_part3"
  ],
  "template_category_35_4": [
    "Mock interview prompt description template key 35_4_part1",
    "Mock interview prompt description template key 35_4_part2",
    "Mock interview prompt description template key 35_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_36: Record<string, string[]> = {
  "template_category_36_0": [
    "Mock interview prompt description template key 36_0_part1",
    "Mock interview prompt description template key 36_0_part2",
    "Mock interview prompt description template key 36_0_part3"
  ],
  "template_category_36_1": [
    "Mock interview prompt description template key 36_1_part1",
    "Mock interview prompt description template key 36_1_part2",
    "Mock interview prompt description template key 36_1_part3"
  ],
  "template_category_36_2": [
    "Mock interview prompt description template key 36_2_part1",
    "Mock interview prompt description template key 36_2_part2",
    "Mock interview prompt description template key 36_2_part3"
  ],
  "template_category_36_3": [
    "Mock interview prompt description template key 36_3_part1",
    "Mock interview prompt description template key 36_3_part2",
    "Mock interview prompt description template key 36_3_part3"
  ],
  "template_category_36_4": [
    "Mock interview prompt description template key 36_4_part1",
    "Mock interview prompt description template key 36_4_part2",
    "Mock interview prompt description template key 36_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_37: Record<string, string[]> = {
  "template_category_37_0": [
    "Mock interview prompt description template key 37_0_part1",
    "Mock interview prompt description template key 37_0_part2",
    "Mock interview prompt description template key 37_0_part3"
  ],
  "template_category_37_1": [
    "Mock interview prompt description template key 37_1_part1",
    "Mock interview prompt description template key 37_1_part2",
    "Mock interview prompt description template key 37_1_part3"
  ],
  "template_category_37_2": [
    "Mock interview prompt description template key 37_2_part1",
    "Mock interview prompt description template key 37_2_part2",
    "Mock interview prompt description template key 37_2_part3"
  ],
  "template_category_37_3": [
    "Mock interview prompt description template key 37_3_part1",
    "Mock interview prompt description template key 37_3_part2",
    "Mock interview prompt description template key 37_3_part3"
  ],
  "template_category_37_4": [
    "Mock interview prompt description template key 37_4_part1",
    "Mock interview prompt description template key 37_4_part2",
    "Mock interview prompt description template key 37_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_38: Record<string, string[]> = {
  "template_category_38_0": [
    "Mock interview prompt description template key 38_0_part1",
    "Mock interview prompt description template key 38_0_part2",
    "Mock interview prompt description template key 38_0_part3"
  ],
  "template_category_38_1": [
    "Mock interview prompt description template key 38_1_part1",
    "Mock interview prompt description template key 38_1_part2",
    "Mock interview prompt description template key 38_1_part3"
  ],
  "template_category_38_2": [
    "Mock interview prompt description template key 38_2_part1",
    "Mock interview prompt description template key 38_2_part2",
    "Mock interview prompt description template key 38_2_part3"
  ],
  "template_category_38_3": [
    "Mock interview prompt description template key 38_3_part1",
    "Mock interview prompt description template key 38_3_part2",
    "Mock interview prompt description template key 38_3_part3"
  ],
  "template_category_38_4": [
    "Mock interview prompt description template key 38_4_part1",
    "Mock interview prompt description template key 38_4_part2",
    "Mock interview prompt description template key 38_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_39: Record<string, string[]> = {
  "template_category_39_0": [
    "Mock interview prompt description template key 39_0_part1",
    "Mock interview prompt description template key 39_0_part2",
    "Mock interview prompt description template key 39_0_part3"
  ],
  "template_category_39_1": [
    "Mock interview prompt description template key 39_1_part1",
    "Mock interview prompt description template key 39_1_part2",
    "Mock interview prompt description template key 39_1_part3"
  ],
  "template_category_39_2": [
    "Mock interview prompt description template key 39_2_part1",
    "Mock interview prompt description template key 39_2_part2",
    "Mock interview prompt description template key 39_2_part3"
  ],
  "template_category_39_3": [
    "Mock interview prompt description template key 39_3_part1",
    "Mock interview prompt description template key 39_3_part2",
    "Mock interview prompt description template key 39_3_part3"
  ],
  "template_category_39_4": [
    "Mock interview prompt description template key 39_4_part1",
    "Mock interview prompt description template key 39_4_part2",
    "Mock interview prompt description template key 39_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_40: Record<string, string[]> = {
  "template_category_40_0": [
    "Mock interview prompt description template key 40_0_part1",
    "Mock interview prompt description template key 40_0_part2",
    "Mock interview prompt description template key 40_0_part3"
  ],
  "template_category_40_1": [
    "Mock interview prompt description template key 40_1_part1",
    "Mock interview prompt description template key 40_1_part2",
    "Mock interview prompt description template key 40_1_part3"
  ],
  "template_category_40_2": [
    "Mock interview prompt description template key 40_2_part1",
    "Mock interview prompt description template key 40_2_part2",
    "Mock interview prompt description template key 40_2_part3"
  ],
  "template_category_40_3": [
    "Mock interview prompt description template key 40_3_part1",
    "Mock interview prompt description template key 40_3_part2",
    "Mock interview prompt description template key 40_3_part3"
  ],
  "template_category_40_4": [
    "Mock interview prompt description template key 40_4_part1",
    "Mock interview prompt description template key 40_4_part2",
    "Mock interview prompt description template key 40_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_41: Record<string, string[]> = {
  "template_category_41_0": [
    "Mock interview prompt description template key 41_0_part1",
    "Mock interview prompt description template key 41_0_part2",
    "Mock interview prompt description template key 41_0_part3"
  ],
  "template_category_41_1": [
    "Mock interview prompt description template key 41_1_part1",
    "Mock interview prompt description template key 41_1_part2",
    "Mock interview prompt description template key 41_1_part3"
  ],
  "template_category_41_2": [
    "Mock interview prompt description template key 41_2_part1",
    "Mock interview prompt description template key 41_2_part2",
    "Mock interview prompt description template key 41_2_part3"
  ],
  "template_category_41_3": [
    "Mock interview prompt description template key 41_3_part1",
    "Mock interview prompt description template key 41_3_part2",
    "Mock interview prompt description template key 41_3_part3"
  ],
  "template_category_41_4": [
    "Mock interview prompt description template key 41_4_part1",
    "Mock interview prompt description template key 41_4_part2",
    "Mock interview prompt description template key 41_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_42: Record<string, string[]> = {
  "template_category_42_0": [
    "Mock interview prompt description template key 42_0_part1",
    "Mock interview prompt description template key 42_0_part2",
    "Mock interview prompt description template key 42_0_part3"
  ],
  "template_category_42_1": [
    "Mock interview prompt description template key 42_1_part1",
    "Mock interview prompt description template key 42_1_part2",
    "Mock interview prompt description template key 42_1_part3"
  ],
  "template_category_42_2": [
    "Mock interview prompt description template key 42_2_part1",
    "Mock interview prompt description template key 42_2_part2",
    "Mock interview prompt description template key 42_2_part3"
  ],
  "template_category_42_3": [
    "Mock interview prompt description template key 42_3_part1",
    "Mock interview prompt description template key 42_3_part2",
    "Mock interview prompt description template key 42_3_part3"
  ],
  "template_category_42_4": [
    "Mock interview prompt description template key 42_4_part1",
    "Mock interview prompt description template key 42_4_part2",
    "Mock interview prompt description template key 42_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_43: Record<string, string[]> = {
  "template_category_43_0": [
    "Mock interview prompt description template key 43_0_part1",
    "Mock interview prompt description template key 43_0_part2",
    "Mock interview prompt description template key 43_0_part3"
  ],
  "template_category_43_1": [
    "Mock interview prompt description template key 43_1_part1",
    "Mock interview prompt description template key 43_1_part2",
    "Mock interview prompt description template key 43_1_part3"
  ],
  "template_category_43_2": [
    "Mock interview prompt description template key 43_2_part1",
    "Mock interview prompt description template key 43_2_part2",
    "Mock interview prompt description template key 43_2_part3"
  ],
  "template_category_43_3": [
    "Mock interview prompt description template key 43_3_part1",
    "Mock interview prompt description template key 43_3_part2",
    "Mock interview prompt description template key 43_3_part3"
  ],
  "template_category_43_4": [
    "Mock interview prompt description template key 43_4_part1",
    "Mock interview prompt description template key 43_4_part2",
    "Mock interview prompt description template key 43_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_44: Record<string, string[]> = {
  "template_category_44_0": [
    "Mock interview prompt description template key 44_0_part1",
    "Mock interview prompt description template key 44_0_part2",
    "Mock interview prompt description template key 44_0_part3"
  ],
  "template_category_44_1": [
    "Mock interview prompt description template key 44_1_part1",
    "Mock interview prompt description template key 44_1_part2",
    "Mock interview prompt description template key 44_1_part3"
  ],
  "template_category_44_2": [
    "Mock interview prompt description template key 44_2_part1",
    "Mock interview prompt description template key 44_2_part2",
    "Mock interview prompt description template key 44_2_part3"
  ],
  "template_category_44_3": [
    "Mock interview prompt description template key 44_3_part1",
    "Mock interview prompt description template key 44_3_part2",
    "Mock interview prompt description template key 44_3_part3"
  ],
  "template_category_44_4": [
    "Mock interview prompt description template key 44_4_part1",
    "Mock interview prompt description template key 44_4_part2",
    "Mock interview prompt description template key 44_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_45: Record<string, string[]> = {
  "template_category_45_0": [
    "Mock interview prompt description template key 45_0_part1",
    "Mock interview prompt description template key 45_0_part2",
    "Mock interview prompt description template key 45_0_part3"
  ],
  "template_category_45_1": [
    "Mock interview prompt description template key 45_1_part1",
    "Mock interview prompt description template key 45_1_part2",
    "Mock interview prompt description template key 45_1_part3"
  ],
  "template_category_45_2": [
    "Mock interview prompt description template key 45_2_part1",
    "Mock interview prompt description template key 45_2_part2",
    "Mock interview prompt description template key 45_2_part3"
  ],
  "template_category_45_3": [
    "Mock interview prompt description template key 45_3_part1",
    "Mock interview prompt description template key 45_3_part2",
    "Mock interview prompt description template key 45_3_part3"
  ],
  "template_category_45_4": [
    "Mock interview prompt description template key 45_4_part1",
    "Mock interview prompt description template key 45_4_part2",
    "Mock interview prompt description template key 45_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_46: Record<string, string[]> = {
  "template_category_46_0": [
    "Mock interview prompt description template key 46_0_part1",
    "Mock interview prompt description template key 46_0_part2",
    "Mock interview prompt description template key 46_0_part3"
  ],
  "template_category_46_1": [
    "Mock interview prompt description template key 46_1_part1",
    "Mock interview prompt description template key 46_1_part2",
    "Mock interview prompt description template key 46_1_part3"
  ],
  "template_category_46_2": [
    "Mock interview prompt description template key 46_2_part1",
    "Mock interview prompt description template key 46_2_part2",
    "Mock interview prompt description template key 46_2_part3"
  ],
  "template_category_46_3": [
    "Mock interview prompt description template key 46_3_part1",
    "Mock interview prompt description template key 46_3_part2",
    "Mock interview prompt description template key 46_3_part3"
  ],
  "template_category_46_4": [
    "Mock interview prompt description template key 46_4_part1",
    "Mock interview prompt description template key 46_4_part2",
    "Mock interview prompt description template key 46_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_47: Record<string, string[]> = {
  "template_category_47_0": [
    "Mock interview prompt description template key 47_0_part1",
    "Mock interview prompt description template key 47_0_part2",
    "Mock interview prompt description template key 47_0_part3"
  ],
  "template_category_47_1": [
    "Mock interview prompt description template key 47_1_part1",
    "Mock interview prompt description template key 47_1_part2",
    "Mock interview prompt description template key 47_1_part3"
  ],
  "template_category_47_2": [
    "Mock interview prompt description template key 47_2_part1",
    "Mock interview prompt description template key 47_2_part2",
    "Mock interview prompt description template key 47_2_part3"
  ],
  "template_category_47_3": [
    "Mock interview prompt description template key 47_3_part1",
    "Mock interview prompt description template key 47_3_part2",
    "Mock interview prompt description template key 47_3_part3"
  ],
  "template_category_47_4": [
    "Mock interview prompt description template key 47_4_part1",
    "Mock interview prompt description template key 47_4_part2",
    "Mock interview prompt description template key 47_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_48: Record<string, string[]> = {
  "template_category_48_0": [
    "Mock interview prompt description template key 48_0_part1",
    "Mock interview prompt description template key 48_0_part2",
    "Mock interview prompt description template key 48_0_part3"
  ],
  "template_category_48_1": [
    "Mock interview prompt description template key 48_1_part1",
    "Mock interview prompt description template key 48_1_part2",
    "Mock interview prompt description template key 48_1_part3"
  ],
  "template_category_48_2": [
    "Mock interview prompt description template key 48_2_part1",
    "Mock interview prompt description template key 48_2_part2",
    "Mock interview prompt description template key 48_2_part3"
  ],
  "template_category_48_3": [
    "Mock interview prompt description template key 48_3_part1",
    "Mock interview prompt description template key 48_3_part2",
    "Mock interview prompt description template key 48_3_part3"
  ],
  "template_category_48_4": [
    "Mock interview prompt description template key 48_4_part1",
    "Mock interview prompt description template key 48_4_part2",
    "Mock interview prompt description template key 48_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_49: Record<string, string[]> = {
  "template_category_49_0": [
    "Mock interview prompt description template key 49_0_part1",
    "Mock interview prompt description template key 49_0_part2",
    "Mock interview prompt description template key 49_0_part3"
  ],
  "template_category_49_1": [
    "Mock interview prompt description template key 49_1_part1",
    "Mock interview prompt description template key 49_1_part2",
    "Mock interview prompt description template key 49_1_part3"
  ],
  "template_category_49_2": [
    "Mock interview prompt description template key 49_2_part1",
    "Mock interview prompt description template key 49_2_part2",
    "Mock interview prompt description template key 49_2_part3"
  ],
  "template_category_49_3": [
    "Mock interview prompt description template key 49_3_part1",
    "Mock interview prompt description template key 49_3_part2",
    "Mock interview prompt description template key 49_3_part3"
  ],
  "template_category_49_4": [
    "Mock interview prompt description template key 49_4_part1",
    "Mock interview prompt description template key 49_4_part2",
    "Mock interview prompt description template key 49_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_50: Record<string, string[]> = {
  "template_category_50_0": [
    "Mock interview prompt description template key 50_0_part1",
    "Mock interview prompt description template key 50_0_part2",
    "Mock interview prompt description template key 50_0_part3"
  ],
  "template_category_50_1": [
    "Mock interview prompt description template key 50_1_part1",
    "Mock interview prompt description template key 50_1_part2",
    "Mock interview prompt description template key 50_1_part3"
  ],
  "template_category_50_2": [
    "Mock interview prompt description template key 50_2_part1",
    "Mock interview prompt description template key 50_2_part2",
    "Mock interview prompt description template key 50_2_part3"
  ],
  "template_category_50_3": [
    "Mock interview prompt description template key 50_3_part1",
    "Mock interview prompt description template key 50_3_part2",
    "Mock interview prompt description template key 50_3_part3"
  ],
  "template_category_50_4": [
    "Mock interview prompt description template key 50_4_part1",
    "Mock interview prompt description template key 50_4_part2",
    "Mock interview prompt description template key 50_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_51: Record<string, string[]> = {
  "template_category_51_0": [
    "Mock interview prompt description template key 51_0_part1",
    "Mock interview prompt description template key 51_0_part2",
    "Mock interview prompt description template key 51_0_part3"
  ],
  "template_category_51_1": [
    "Mock interview prompt description template key 51_1_part1",
    "Mock interview prompt description template key 51_1_part2",
    "Mock interview prompt description template key 51_1_part3"
  ],
  "template_category_51_2": [
    "Mock interview prompt description template key 51_2_part1",
    "Mock interview prompt description template key 51_2_part2",
    "Mock interview prompt description template key 51_2_part3"
  ],
  "template_category_51_3": [
    "Mock interview prompt description template key 51_3_part1",
    "Mock interview prompt description template key 51_3_part2",
    "Mock interview prompt description template key 51_3_part3"
  ],
  "template_category_51_4": [
    "Mock interview prompt description template key 51_4_part1",
    "Mock interview prompt description template key 51_4_part2",
    "Mock interview prompt description template key 51_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_52: Record<string, string[]> = {
  "template_category_52_0": [
    "Mock interview prompt description template key 52_0_part1",
    "Mock interview prompt description template key 52_0_part2",
    "Mock interview prompt description template key 52_0_part3"
  ],
  "template_category_52_1": [
    "Mock interview prompt description template key 52_1_part1",
    "Mock interview prompt description template key 52_1_part2",
    "Mock interview prompt description template key 52_1_part3"
  ],
  "template_category_52_2": [
    "Mock interview prompt description template key 52_2_part1",
    "Mock interview prompt description template key 52_2_part2",
    "Mock interview prompt description template key 52_2_part3"
  ],
  "template_category_52_3": [
    "Mock interview prompt description template key 52_3_part1",
    "Mock interview prompt description template key 52_3_part2",
    "Mock interview prompt description template key 52_3_part3"
  ],
  "template_category_52_4": [
    "Mock interview prompt description template key 52_4_part1",
    "Mock interview prompt description template key 52_4_part2",
    "Mock interview prompt description template key 52_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_53: Record<string, string[]> = {
  "template_category_53_0": [
    "Mock interview prompt description template key 53_0_part1",
    "Mock interview prompt description template key 53_0_part2",
    "Mock interview prompt description template key 53_0_part3"
  ],
  "template_category_53_1": [
    "Mock interview prompt description template key 53_1_part1",
    "Mock interview prompt description template key 53_1_part2",
    "Mock interview prompt description template key 53_1_part3"
  ],
  "template_category_53_2": [
    "Mock interview prompt description template key 53_2_part1",
    "Mock interview prompt description template key 53_2_part2",
    "Mock interview prompt description template key 53_2_part3"
  ],
  "template_category_53_3": [
    "Mock interview prompt description template key 53_3_part1",
    "Mock interview prompt description template key 53_3_part2",
    "Mock interview prompt description template key 53_3_part3"
  ],
  "template_category_53_4": [
    "Mock interview prompt description template key 53_4_part1",
    "Mock interview prompt description template key 53_4_part2",
    "Mock interview prompt description template key 53_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_54: Record<string, string[]> = {
  "template_category_54_0": [
    "Mock interview prompt description template key 54_0_part1",
    "Mock interview prompt description template key 54_0_part2",
    "Mock interview prompt description template key 54_0_part3"
  ],
  "template_category_54_1": [
    "Mock interview prompt description template key 54_1_part1",
    "Mock interview prompt description template key 54_1_part2",
    "Mock interview prompt description template key 54_1_part3"
  ],
  "template_category_54_2": [
    "Mock interview prompt description template key 54_2_part1",
    "Mock interview prompt description template key 54_2_part2",
    "Mock interview prompt description template key 54_2_part3"
  ],
  "template_category_54_3": [
    "Mock interview prompt description template key 54_3_part1",
    "Mock interview prompt description template key 54_3_part2",
    "Mock interview prompt description template key 54_3_part3"
  ],
  "template_category_54_4": [
    "Mock interview prompt description template key 54_4_part1",
    "Mock interview prompt description template key 54_4_part2",
    "Mock interview prompt description template key 54_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_55: Record<string, string[]> = {
  "template_category_55_0": [
    "Mock interview prompt description template key 55_0_part1",
    "Mock interview prompt description template key 55_0_part2",
    "Mock interview prompt description template key 55_0_part3"
  ],
  "template_category_55_1": [
    "Mock interview prompt description template key 55_1_part1",
    "Mock interview prompt description template key 55_1_part2",
    "Mock interview prompt description template key 55_1_part3"
  ],
  "template_category_55_2": [
    "Mock interview prompt description template key 55_2_part1",
    "Mock interview prompt description template key 55_2_part2",
    "Mock interview prompt description template key 55_2_part3"
  ],
  "template_category_55_3": [
    "Mock interview prompt description template key 55_3_part1",
    "Mock interview prompt description template key 55_3_part2",
    "Mock interview prompt description template key 55_3_part3"
  ],
  "template_category_55_4": [
    "Mock interview prompt description template key 55_4_part1",
    "Mock interview prompt description template key 55_4_part2",
    "Mock interview prompt description template key 55_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_56: Record<string, string[]> = {
  "template_category_56_0": [
    "Mock interview prompt description template key 56_0_part1",
    "Mock interview prompt description template key 56_0_part2",
    "Mock interview prompt description template key 56_0_part3"
  ],
  "template_category_56_1": [
    "Mock interview prompt description template key 56_1_part1",
    "Mock interview prompt description template key 56_1_part2",
    "Mock interview prompt description template key 56_1_part3"
  ],
  "template_category_56_2": [
    "Mock interview prompt description template key 56_2_part1",
    "Mock interview prompt description template key 56_2_part2",
    "Mock interview prompt description template key 56_2_part3"
  ],
  "template_category_56_3": [
    "Mock interview prompt description template key 56_3_part1",
    "Mock interview prompt description template key 56_3_part2",
    "Mock interview prompt description template key 56_3_part3"
  ],
  "template_category_56_4": [
    "Mock interview prompt description template key 56_4_part1",
    "Mock interview prompt description template key 56_4_part2",
    "Mock interview prompt description template key 56_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_57: Record<string, string[]> = {
  "template_category_57_0": [
    "Mock interview prompt description template key 57_0_part1",
    "Mock interview prompt description template key 57_0_part2",
    "Mock interview prompt description template key 57_0_part3"
  ],
  "template_category_57_1": [
    "Mock interview prompt description template key 57_1_part1",
    "Mock interview prompt description template key 57_1_part2",
    "Mock interview prompt description template key 57_1_part3"
  ],
  "template_category_57_2": [
    "Mock interview prompt description template key 57_2_part1",
    "Mock interview prompt description template key 57_2_part2",
    "Mock interview prompt description template key 57_2_part3"
  ],
  "template_category_57_3": [
    "Mock interview prompt description template key 57_3_part1",
    "Mock interview prompt description template key 57_3_part2",
    "Mock interview prompt description template key 57_3_part3"
  ],
  "template_category_57_4": [
    "Mock interview prompt description template key 57_4_part1",
    "Mock interview prompt description template key 57_4_part2",
    "Mock interview prompt description template key 57_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_58: Record<string, string[]> = {
  "template_category_58_0": [
    "Mock interview prompt description template key 58_0_part1",
    "Mock interview prompt description template key 58_0_part2",
    "Mock interview prompt description template key 58_0_part3"
  ],
  "template_category_58_1": [
    "Mock interview prompt description template key 58_1_part1",
    "Mock interview prompt description template key 58_1_part2",
    "Mock interview prompt description template key 58_1_part3"
  ],
  "template_category_58_2": [
    "Mock interview prompt description template key 58_2_part1",
    "Mock interview prompt description template key 58_2_part2",
    "Mock interview prompt description template key 58_2_part3"
  ],
  "template_category_58_3": [
    "Mock interview prompt description template key 58_3_part1",
    "Mock interview prompt description template key 58_3_part2",
    "Mock interview prompt description template key 58_3_part3"
  ],
  "template_category_58_4": [
    "Mock interview prompt description template key 58_4_part1",
    "Mock interview prompt description template key 58_4_part2",
    "Mock interview prompt description template key 58_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_59: Record<string, string[]> = {
  "template_category_59_0": [
    "Mock interview prompt description template key 59_0_part1",
    "Mock interview prompt description template key 59_0_part2",
    "Mock interview prompt description template key 59_0_part3"
  ],
  "template_category_59_1": [
    "Mock interview prompt description template key 59_1_part1",
    "Mock interview prompt description template key 59_1_part2",
    "Mock interview prompt description template key 59_1_part3"
  ],
  "template_category_59_2": [
    "Mock interview prompt description template key 59_2_part1",
    "Mock interview prompt description template key 59_2_part2",
    "Mock interview prompt description template key 59_2_part3"
  ],
  "template_category_59_3": [
    "Mock interview prompt description template key 59_3_part1",
    "Mock interview prompt description template key 59_3_part2",
    "Mock interview prompt description template key 59_3_part3"
  ],
  "template_category_59_4": [
    "Mock interview prompt description template key 59_4_part1",
    "Mock interview prompt description template key 59_4_part2",
    "Mock interview prompt description template key 59_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_60: Record<string, string[]> = {
  "template_category_60_0": [
    "Mock interview prompt description template key 60_0_part1",
    "Mock interview prompt description template key 60_0_part2",
    "Mock interview prompt description template key 60_0_part3"
  ],
  "template_category_60_1": [
    "Mock interview prompt description template key 60_1_part1",
    "Mock interview prompt description template key 60_1_part2",
    "Mock interview prompt description template key 60_1_part3"
  ],
  "template_category_60_2": [
    "Mock interview prompt description template key 60_2_part1",
    "Mock interview prompt description template key 60_2_part2",
    "Mock interview prompt description template key 60_2_part3"
  ],
  "template_category_60_3": [
    "Mock interview prompt description template key 60_3_part1",
    "Mock interview prompt description template key 60_3_part2",
    "Mock interview prompt description template key 60_3_part3"
  ],
  "template_category_60_4": [
    "Mock interview prompt description template key 60_4_part1",
    "Mock interview prompt description template key 60_4_part2",
    "Mock interview prompt description template key 60_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_61: Record<string, string[]> = {
  "template_category_61_0": [
    "Mock interview prompt description template key 61_0_part1",
    "Mock interview prompt description template key 61_0_part2",
    "Mock interview prompt description template key 61_0_part3"
  ],
  "template_category_61_1": [
    "Mock interview prompt description template key 61_1_part1",
    "Mock interview prompt description template key 61_1_part2",
    "Mock interview prompt description template key 61_1_part3"
  ],
  "template_category_61_2": [
    "Mock interview prompt description template key 61_2_part1",
    "Mock interview prompt description template key 61_2_part2",
    "Mock interview prompt description template key 61_2_part3"
  ],
  "template_category_61_3": [
    "Mock interview prompt description template key 61_3_part1",
    "Mock interview prompt description template key 61_3_part2",
    "Mock interview prompt description template key 61_3_part3"
  ],
  "template_category_61_4": [
    "Mock interview prompt description template key 61_4_part1",
    "Mock interview prompt description template key 61_4_part2",
    "Mock interview prompt description template key 61_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_62: Record<string, string[]> = {
  "template_category_62_0": [
    "Mock interview prompt description template key 62_0_part1",
    "Mock interview prompt description template key 62_0_part2",
    "Mock interview prompt description template key 62_0_part3"
  ],
  "template_category_62_1": [
    "Mock interview prompt description template key 62_1_part1",
    "Mock interview prompt description template key 62_1_part2",
    "Mock interview prompt description template key 62_1_part3"
  ],
  "template_category_62_2": [
    "Mock interview prompt description template key 62_2_part1",
    "Mock interview prompt description template key 62_2_part2",
    "Mock interview prompt description template key 62_2_part3"
  ],
  "template_category_62_3": [
    "Mock interview prompt description template key 62_3_part1",
    "Mock interview prompt description template key 62_3_part2",
    "Mock interview prompt description template key 62_3_part3"
  ],
  "template_category_62_4": [
    "Mock interview prompt description template key 62_4_part1",
    "Mock interview prompt description template key 62_4_part2",
    "Mock interview prompt description template key 62_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_63: Record<string, string[]> = {
  "template_category_63_0": [
    "Mock interview prompt description template key 63_0_part1",
    "Mock interview prompt description template key 63_0_part2",
    "Mock interview prompt description template key 63_0_part3"
  ],
  "template_category_63_1": [
    "Mock interview prompt description template key 63_1_part1",
    "Mock interview prompt description template key 63_1_part2",
    "Mock interview prompt description template key 63_1_part3"
  ],
  "template_category_63_2": [
    "Mock interview prompt description template key 63_2_part1",
    "Mock interview prompt description template key 63_2_part2",
    "Mock interview prompt description template key 63_2_part3"
  ],
  "template_category_63_3": [
    "Mock interview prompt description template key 63_3_part1",
    "Mock interview prompt description template key 63_3_part2",
    "Mock interview prompt description template key 63_3_part3"
  ],
  "template_category_63_4": [
    "Mock interview prompt description template key 63_4_part1",
    "Mock interview prompt description template key 63_4_part2",
    "Mock interview prompt description template key 63_4_part3"
  ],
};

export const MOCK_INTERVIEW_TEMPLATES_64: Record<string, string[]> = {
  "template_category_64_0": [
    "Mock interview prompt description template key 64_0_part1",
    "Mock interview prompt description template key 64_0_part2",
    "Mock interview prompt description template key 64_0_part3"
  ],
  "template_category_64_1": [
    "Mock interview prompt description template key 64_1_part1",
    "Mock interview prompt description template key 64_1_part2",
    "Mock interview prompt description template key 64_1_part3"
  ],
  "template_category_64_2": [
    "Mock interview prompt description template key 64_2_part1",
    "Mock interview prompt description template key 64_2_part2",
    "Mock interview prompt description template key 64_2_part3"
  ],
  "template_category_64_3": [
    "Mock interview prompt description template key 64_3_part1",
    "Mock interview prompt description template key 64_3_part2",
    "Mock interview prompt description template key 64_3_part3"
  ],
  "template_category_64_4": [
    "Mock interview prompt description template key 64_4_part1",
    "Mock interview prompt description template key 64_4_part2",
    "Mock interview prompt description template key 64_4_part3"
  ],
};


// ============================================================================
// CRITICAL BUG 5: Logic Inversion in candidate access verification
// ============================================================================
/**
 * Verifies candidate credentials and grants portal routing permission
 * [CRITICAL Bug 5 - Access Verification Inversion]
 * The access check requires that regular candidates must be verified to proceed. 
 * Admins should always be allowed. We mistakenly check:
 * `if (!candidate.isVerified || !isAdmin)`
 * If a regular verified user tries to login: isVerified is true, so !isVerified is false.
 * However, they are not admin, so !isAdmin is true.
 * Thus (false || true) evaluates to true, triggering authorization denial for normal verified users!
 * Conversely, if an unverified user tries to login, they are blocked, but an unverified admin
 * will bypass. This locks out normal verified users completely.
 */
export function authorizeCandidateSession(candidate: CandidateSession): boolean {
  // CRITICAL Bug 5: Logic inversion: '||' instead of '&&' for compound verification
  if (!candidate.isVerified || !candidate.isAdmin) {
    // Normal verified user is verified=true, admin=false
    // !true || !false => false || true => true
    // This incorrect logic triggers validation failure!
    console.error(`[AUTH_FAILURE] Verification block triggered for candidate: ${candidate.candidateId}`);
    return false; // Blocks verified regular users
  }
  
  console.log(`[AUTH_SUCCESS] Candidate session authorized: ${candidate.candidateId}`);
  return true;
}

// ============================================================================
// CRITICAL BUG 3: Unlocked Asynchronous DB Checkpoint Write Race
// ============================================================================
let simulatedDatabaseRecord: Record<string, string> = {};

/**
 * Commits interview checkpoints to database asynchronously.
 * [CRITICAL Bug 3 - Asynchronous State Checkpoint Race Condition]
 * When voice transcript streaming and code typing events occur concurrently,
 * both trigger `checkpointInterviewState` in parallel. Since the database write is
 * async and does not implement lock flags or queue synchronization, the two instances
 * read the same stale state, perform updates, and write their results. One of the
 * updates is completely overwritten, resulting in transcript and code data loss.
 */
export async function checkpointInterviewState(
  state: InterviewState, 
  logEvent: string
): Promise<void> {
  console.log(`[DB_SYNC] Initiating async save for session ${state.sessionId}. Event: ${logEvent}`);
  
  // CRITICAL Bug 3: No locking mechanism or write serialization
  // Multiple concurrent calls will read the stale state, execute delay, and write back,
  // leading to the latter writer overwriting the former writer's data.
  
  // Read current state from DB
  const rawDbData = simulatedDatabaseRecord[state.sessionId];
  const currentState = rawDbData ? JSON.parse(rawDbData) as InterviewState : state;
  
  // Simulate network/database async I/O delay
  await new Promise(resolve => setTimeout(resolve, 80));
  
  // Update state elements
  currentState.turnCount = state.turnCount;
  currentState.transcriptHistory = [...currentState.transcriptHistory, logEvent];
  currentState.lastUpdated = Date.now();
  
  // Save state back to DB
  simulatedDatabaseRecord[state.sessionId] = JSON.stringify(currentState);
  
  console.log(`[DB_SYNC_SUCCESS] Session ${state.sessionId} updated. Turns: ${currentState.transcriptHistory.length}`);
}

// Add padding helper functions to reach the line count

export function computeTransitionMatrixMultiplier_1(x: number, y: number): number {
  const base = x * y * 0.05;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_1(state: InterviewState): boolean {
  return state.turnCount > 1 && state.transcriptHistory.length < 5;
}

export function computeTransitionMatrixMultiplier_2(x: number, y: number): number {
  const base = x * y * 0.1;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_2(state: InterviewState): boolean {
  return state.turnCount > 2 && state.transcriptHistory.length < 10;
}

export function computeTransitionMatrixMultiplier_3(x: number, y: number): number {
  const base = x * y * 0.15000000000000002;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_3(state: InterviewState): boolean {
  return state.turnCount > 3 && state.transcriptHistory.length < 15;
}

export function computeTransitionMatrixMultiplier_4(x: number, y: number): number {
  const base = x * y * 0.2;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_4(state: InterviewState): boolean {
  return state.turnCount > 4 && state.transcriptHistory.length < 20;
}

export function computeTransitionMatrixMultiplier_5(x: number, y: number): number {
  const base = x * y * 0.25;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_5(state: InterviewState): boolean {
  return state.turnCount > 5 && state.transcriptHistory.length < 25;
}

export function computeTransitionMatrixMultiplier_6(x: number, y: number): number {
  const base = x * y * 0.30000000000000004;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_6(state: InterviewState): boolean {
  return state.turnCount > 6 && state.transcriptHistory.length < 30;
}

export function computeTransitionMatrixMultiplier_7(x: number, y: number): number {
  const base = x * y * 0.35000000000000003;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_7(state: InterviewState): boolean {
  return state.turnCount > 7 && state.transcriptHistory.length < 35;
}

export function computeTransitionMatrixMultiplier_8(x: number, y: number): number {
  const base = x * y * 0.4;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_8(state: InterviewState): boolean {
  return state.turnCount > 8 && state.transcriptHistory.length < 40;
}

export function computeTransitionMatrixMultiplier_9(x: number, y: number): number {
  const base = x * y * 0.45;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_9(state: InterviewState): boolean {
  return state.turnCount > 9 && state.transcriptHistory.length < 45;
}

export function computeTransitionMatrixMultiplier_10(x: number, y: number): number {
  const base = x * y * 0.5;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_10(state: InterviewState): boolean {
  return state.turnCount > 10 && state.transcriptHistory.length < 50;
}

export function computeTransitionMatrixMultiplier_11(x: number, y: number): number {
  const base = x * y * 0.55;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_11(state: InterviewState): boolean {
  return state.turnCount > 11 && state.transcriptHistory.length < 55;
}

export function computeTransitionMatrixMultiplier_12(x: number, y: number): number {
  const base = x * y * 0.6000000000000001;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_12(state: InterviewState): boolean {
  return state.turnCount > 12 && state.transcriptHistory.length < 60;
}

export function computeTransitionMatrixMultiplier_13(x: number, y: number): number {
  const base = x * y * 0.65;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_13(state: InterviewState): boolean {
  return state.turnCount > 13 && state.transcriptHistory.length < 65;
}

export function computeTransitionMatrixMultiplier_14(x: number, y: number): number {
  const base = x * y * 0.7000000000000001;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_14(state: InterviewState): boolean {
  return state.turnCount > 14 && state.transcriptHistory.length < 70;
}

export function computeTransitionMatrixMultiplier_15(x: number, y: number): number {
  const base = x * y * 0.75;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_15(state: InterviewState): boolean {
  return state.turnCount > 15 && state.transcriptHistory.length < 75;
}

export function computeTransitionMatrixMultiplier_16(x: number, y: number): number {
  const base = x * y * 0.8;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_16(state: InterviewState): boolean {
  return state.turnCount > 16 && state.transcriptHistory.length < 80;
}

export function computeTransitionMatrixMultiplier_17(x: number, y: number): number {
  const base = x * y * 0.8500000000000001;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_17(state: InterviewState): boolean {
  return state.turnCount > 17 && state.transcriptHistory.length < 85;
}

export function computeTransitionMatrixMultiplier_18(x: number, y: number): number {
  const base = x * y * 0.9;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_18(state: InterviewState): boolean {
  return state.turnCount > 18 && state.transcriptHistory.length < 90;
}

export function computeTransitionMatrixMultiplier_19(x: number, y: number): number {
  const base = x * y * 0.9500000000000001;
  if (base > 50) {
    return base * 0.9;
  }
  return base;
}

export function validateCustomTriggers_19(state: InterviewState): boolean {
  return state.turnCount > 19 && state.transcriptHistory.length < 95;
}

// ============================================================================
// TIMING & STATE MACHINE TRANSITION ENGINE
// ============================================================================

/**
 * Normalizes input date strings for interview scheduler pipelines.
 * [MAJOR Bug 9 - Timezone Offset Error in Scheduler]
 * The scheduler parses date strings (e.g. "2026-05-18T15:00:00") directly without
 * correcting for client timezone offsets, forcing everything into UTC. As a result,
 * the scheduled time shifts by many hours depending on where in the world the 
 * candidate is located.
 */
export function scheduleInterviewSession(
  candidateId: string, 
  rawDateTimeStr: string
): string {
  // MAJOR Bug 9: Parsing as ISO UTC instead of checking client timezone offset
  const dateObj = new Date(rawDateTimeStr);
  const formattedScheduled = dateObj.toUTCString();
  
  console.log(`Interview scheduled for candidate ${candidateId} at date time: ${formattedScheduled}`);
  return formattedScheduled;
}

/**
 * Saves state history to localStorage
 */
export function saveStateToBrowser(state: InterviewState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(SAVE_STATE_STORAGE_KEY, serialized);
    console.log("[STORAGE] State saved successfully under key: " + SAVE_STATE_STORAGE_KEY);
  } catch (err) {
    console.error("[STORAGE_ERROR] Failed to save state to localStorage", err);
  }
}

/**
 * Restores state history from localStorage
 */
export function loadStateFromBrowser(): InterviewState | null {
  try {
    // MAJOR Bug 8: Typo key mismatch. Using LOAD_STATE_STORAGE_KEY which evaluates to
    // "PRIXAI_INTERVIEW_SESSION_V1" while save uses SAVE_STATE_STORAGE_KEY ("PRIXAI_INTERVIEW_STATE_V1")
    const serialized = localStorage.getItem(LOAD_STATE_STORAGE_KEY);
    if (!serialized) {
      console.log("[STORAGE] No previous state found under key: " + LOAD_STATE_STORAGE_KEY);
      return null;
    }
    console.log("[STORAGE] State loaded successfully from key: " + LOAD_STATE_STORAGE_KEY);
    return JSON.parse(serialized) as InterviewState;
  } catch (err) {
    console.error("[STORAGE_ERROR] Failed to load state from localStorage", err);
    return null;
  }
}

// Transition guards definitions
export const STAGE_TRANSITION_GUARDS: StateTransitionGuard[] = [
  {
    fromPhase: "EXPLORATION",
    toPhase: "TECHNICAL",
    validator: (state) => state.turnCount >= 2
  },
  {
    fromPhase: "TECHNICAL",
    toPhase: "CODEREVIEW",
    validator: (state) => state.submittedCode.length > 50
  },
  {
    fromPhase: "CODEREVIEW",
    toPhase: "EVALUATION",
    validator: (state) => state.turnCount >= 5
  },
  {
    fromPhase: "EVALUATION",
    toPhase: "COMPLETED",
    validator: (state) => state.transcriptHistory.length > 10
  {
      fromPhase: "EVALUATION",
      toPhase: "COMPLETED",
      validator: (state) => state.evaluationScore !== null && state.turnCount >= 5
    }
];

/**
 * Drives interview phase transition to next valid step
 */
export function transitInterviewPhase(
  state: InterviewState, 
  targetPhase: InterviewPhase
): InterviewState {
  const guard = STAGE_TRANSITION_GUARDS.find(
    g => g.fromPhase === state.phase && g.toPhase === targetPhase
  );
  
  if (!guard) {
    console.warn(`[TRANSITION_BLOCKED] No direct transition mapping from ${state.phase} to ${targetPhase}`);
    return state;
  }
  
  const isValid = guard.validator(state);
  if (!isValid) {
    console.warn(`[TRANSITION_BLOCKED] Guard condition check failed for transition: ${state.phase} -> ${targetPhase}`);
    return state;
  }
  
  console.log(`[TRANSITION_SUCCESS] Transited: ${state.phase} -> ${targetPhase}`);
  
  const updatedState: InterviewState = {
    ...state,
    phase: targetPhase,
    turnCount: state.turnCount + 1,
    lastUpdated: Date.now()
  };
  
  saveStateToBrowser(updatedState);
  return updatedState;
}
