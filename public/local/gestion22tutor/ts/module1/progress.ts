/// <amd-module name="local_gestion22tutor/module1/progress" />
import {activities, isActivity, record} from './types';
import type {ActivityId, Content} from './types';
export interface VideoProgress {started: boolean; completed: boolean; percent: number; duration: number; watched: number[][];}
export function mergeWatched(ranges: unknown, duration: number): number[][] {
    if (!Array.isArray(ranges) || !Number.isFinite(duration) || duration <= 0) return [];
    const sorted = ranges.filter((r): r is number[] => Array.isArray(r) && r.length === 2 &&
        r.every(n => typeof n === 'number' && Number.isFinite(n)) && r[1] > r[0])
        .map(r => [Math.max(0, r[0]!), Math.min(duration, r[1]!)])
        .filter(r => r[1]! > r[0]!).sort((a, b) => a[0]! - b[0]!);
    const merged: number[][] = [];
    for (const range of sorted) {
        const last = merged[merged.length - 1];
        if (last && range[0]! <= last[1]!) last[1] = Math.max(last[1]!, range[1]!);
        else merged.push(range);
    }
    return merged;
}
type ActivityState = 'started' | 'completed';
interface State {version: 2; videos: Record<string, VideoProgress>; activities: Partial<Record<ActivityId, ActivityState>>; questions: string[];}
export class Progress {
    private state: State = {version: 2, videos: {}, activities: {}, questions: []};
    private readonly questionIds: Set<string>;
    private readonly videoIds: Set<string>;
    private listeners: Array<() => void> = [];
    memoryOnly = false;
    constructor(private readonly key: string, content: Content) {
        this.videoIds = new Set(content.videos.map(v => v.id));
        this.questionIds = new Set([...content.quiz, ...content.caseSteps, ...content.layers.map(l => l.question)].map(q => q.id));
        try {
            const raw: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
            if (record(raw) && (raw.version === 1 || raw.version === 2) && record(raw.videos) && record(raw.activities) && Array.isArray(raw.questions)) {
                for (const [id, value] of Object.entries(raw.videos)) {
                    if (raw.version === 2 && this.videoIds.has(id) && record(value) && typeof value.started === 'boolean' &&
                        typeof value.duration === 'number') {
                        this.state.videos[id] = this.calculateVideo(value.started, value.duration, value.watched);
                    }
                }
                for (const [id, value] of Object.entries(raw.activities)) {
                    if (isActivity(id) && (value === 'started' || value === 'completed')) this.state.activities[id] = value;
                }
                this.state.questions = raw.questions.filter((id): id is string => typeof id === 'string' && this.questionIds.has(id));
            }
        } catch {this.memoryOnly = true;}
    }
    onChange(listener: () => void): void {this.listeners.push(listener);}
    private changed(): void {
        try {localStorage.setItem(this.key, JSON.stringify(this.state));} catch {this.memoryOnly = true;}
        this.listeners.forEach(listener => listener());
    }
    activity(id: ActivityId, complete = false): void {
        if (this.state.activities[id] === 'completed' && !complete) return;
        this.state.activities[id] = complete ? 'completed' : 'started'; this.changed();
        if (complete) window.dispatchEvent(new CustomEvent('g22-module:completed', {detail: id}));
    }
    activityState(id: ActivityId): string {return this.state.activities[id] ?? 'pending';}
    answered(id: string): void {
        if (this.questionIds.has(id) && !this.state.questions.includes(id)) {this.state.questions.push(id); this.changed();}
    }
    video(id: string, update: Partial<VideoProgress>): void {
        if (!this.videoIds.has(id)) return;
        const previous = this.videoState(id);
        this.state.videos[id] = this.calculateVideo(previous.started || !!update.started,
            update.duration ?? previous.duration, [...previous.watched, ...(update.watched ?? [])]); this.changed();
    }
    private calculateVideo(started: boolean, duration: number, ranges: unknown): VideoProgress {
        const watched = mergeWatched(ranges, duration);
        const covered = watched.reduce((sum, r) => sum + r[1]! - r[0]!, 0);
        const fraction = duration > 0 && Number.isFinite(duration) ? covered / duration : 0;
        return {started, duration, watched, percent: Math.floor(fraction * 100), completed: fraction >= .8};
    }
    videoState(id: string): VideoProgress {return this.state.videos[id] ?? {started: false, completed: false, percent: 0, duration: 0, watched: []};}
    summary(): {percent: number; videos: number; completed: number; answered: number} {
        const videos = Object.values(this.state.videos).filter(v => v.completed).length;
        const completed = activities.filter(id => this.state.activities[id] === 'completed').length;
        return {percent: Math.round((videos + completed) / (this.videoIds.size + activities.length) * 100),
            videos, completed, answered: this.state.questions.length};
    }
    resetActivity(id: ActivityId): void {delete this.state.activities[id]; this.changed();}
    reset(): void {this.state = {version: 2, videos: {}, activities: {}, questions: []}; this.changed();}
}
