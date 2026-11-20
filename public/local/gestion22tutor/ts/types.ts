/// <amd-module name="local_gestion22tutor/types" />
export interface ChatConfig {
    containerId: string;
    endpoint: string;
    courseid: number;
    sesskey: string;
    timeoutMs: number;
}
export interface ChatRequest {
    courseid: number;
    question: string;
    sesskey: string;
}
export interface LearningContext {
    activityId: 'anatomy' | 'risks' | 'assessment' | 'checklist' | 'case' | 'practice';
    concept: string;
}
export interface GeminiResponse {
    success: true;
    courseId: number;
    answer: string;
    sources: string[];
    grounded: boolean;
    needsHumanTutor: boolean;
}
export interface ApiError {
    success: false;
    error: string;
    retryable?: boolean;
}
export interface ConversationMessage {
    role: 'student' | 'assistant';
    text: string;
}
