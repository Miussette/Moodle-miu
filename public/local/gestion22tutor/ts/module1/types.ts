/// <amd-module name="local_gestion22tutor/module1/types" />
export const activities = ['anatomy', 'risks', 'assessment', 'checklist', 'case', 'practice'] as const;
export type ActivityId = typeof activities[number];
export interface Question {
    id: string; kind: 'choice' | 'truefalse' | 'matching' | 'anatomy' | 'scenario'; text: string;
    options: string[]; correct: number; explanation: string; topic: string;
    pairs?: Array<{left: string; right: string}>;
}
export interface Video {id: string; vimeoId: string; title: string; segments: Array<{atSeconds: number; activityId: ActivityId}>;}
export interface Layer {id: string; title: string; description: string; components: string[]; function: string; question: Question;}
export interface Risk {factor: string; example: string; consequence: string;}
export interface Content {
    schemaVersion: 1; contextId: string; title: string; subtitle: string; source: string;
    videos: Video[]; layers: Layer[]; skinFunctions: string[]; risks: Risk[]; zones: string[];
    observations: string[]; attentionZones: string[]; checklist: string[]; prevention: string[];
    preventiveMeasures: string[]; caseScenario: string; caseSteps: Question[]; quiz: Question[];
    caseIllustration?: {file: string; alt: string; caption: string};
    complementary: Array<{title: string; description: string}>;
}
export interface ModuleConfig {containerId: string; courseid: number; storageKey: string; preview: boolean; content: Content;}
export function record(value: unknown): value is Record<string, unknown> {return typeof value === 'object' && value !== null;}
function strings(value: unknown): value is string[] {return Array.isArray(value) && value.every(item => typeof item === 'string');}
function question(value: unknown): value is Question {
    return record(value) && typeof value.id === 'string' && typeof value.text === 'string' &&
        typeof value.kind === 'string' && ['choice', 'truefalse', 'matching', 'anatomy', 'scenario'].includes(value.kind) &&
        strings(value.options) && typeof value.correct === 'number' && Number.isInteger(value.correct) &&
        value.correct >= 0 && value.correct < value.options.length && typeof value.explanation === 'string' &&
        typeof value.topic === 'string' && (value.kind !== 'matching' || (Array.isArray(value.pairs) &&
            value.pairs.every(pair => record(pair) && typeof pair.left === 'string' && typeof pair.right === 'string')));
}
export function isConfig(value: unknown): value is ModuleConfig {
    if (!record(value) || typeof value.containerId !== 'string' || typeof value.courseid !== 'number' ||
        !Number.isSafeInteger(value.courseid) || value.courseid < 2 || typeof value.storageKey !== 'string' ||
        typeof value.preview !== 'boolean' || !record(value.content)) {return false;}
    const c = value.content;
    return c.schemaVersion === 1 && typeof c.contextId === 'string' && typeof c.title === 'string' &&
        typeof c.subtitle === 'string' && typeof c.source === 'string' && typeof c.caseScenario === 'string' &&
        (c.caseIllustration === undefined || (record(c.caseIllustration) &&
            typeof c.caseIllustration.file === 'string' && /^[a-z0-9-]+\.(svg|png|webp|jpg)$/.test(c.caseIllustration.file) &&
            typeof c.caseIllustration.alt === 'string' && typeof c.caseIllustration.caption === 'string')) &&
        ['skinFunctions', 'zones', 'observations', 'attentionZones', 'checklist', 'prevention', 'preventiveMeasures']
            .every(key => strings(c[key])) &&
        Array.isArray(c.layers) && c.layers.length === 3 && c.layers.every(layer => record(layer) &&
            typeof layer.id === 'string' && typeof layer.title === 'string' && typeof layer.description === 'string' &&
            typeof layer.function === 'string' && strings(layer.components) && question(layer.question)) &&
        Array.isArray(c.risks) && c.risks.every(risk => record(risk) && typeof risk.factor === 'string' &&
            typeof risk.example === 'string' && typeof risk.consequence === 'string') &&
        Array.isArray(c.videos) && c.videos.length === 4 && c.videos.every(video => record(video) &&
            typeof video.id === 'string' && typeof video.vimeoId === 'string' && /^\d+$/.test(video.vimeoId) &&
            typeof video.title === 'string' && Array.isArray(video.segments) && video.segments.every(segment =>
                record(segment) && typeof segment.atSeconds === 'number' && Number.isFinite(segment.atSeconds) &&
                segment.atSeconds > 0 && isActivity(segment.activityId))) &&
        Array.isArray(c.caseSteps) && c.caseSteps.every(question) && Array.isArray(c.quiz) && c.quiz.every(question) &&
        Array.isArray(c.complementary) && c.complementary.every(item => record(item) &&
            typeof item.title === 'string' && typeof item.description === 'string');
}
export function isActivity(value: unknown): value is ActivityId {
    return typeof value === 'string' && activities.some(id => id === value);
}
