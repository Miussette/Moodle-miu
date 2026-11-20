/// <amd-module name="local_gestion22tutor/module1/video-player" />
import {record, isActivity} from './types';
import type {ActivityId, Video} from './types';
import type {Progress} from './progress';
import {el, button, status} from './dom';

interface Player {
    ready(): Promise<void>; on(event: string, callback: (data: unknown) => void): void;
    pause(): Promise<void>; play(): Promise<void>;
    getPlayed(): Promise<unknown>; getDuration(): Promise<number>;
}
interface PlayerConstructor {new(iframe: HTMLIFrameElement): Player;}
interface RequireFunction {
    (dependencies: string[], callback: (sdk: unknown) => void, error: (reason: unknown) => void): void;
    config(options: {paths: Record<string, string>}): unknown;
}
declare global {interface Window {require?: RequireFunction;}}
let sdkPromise: Promise<PlayerConstructor> | undefined;
function isSdk(value: unknown): value is PlayerConstructor {
    return typeof value === 'function' && record(value.prototype) &&
        ['ready', 'on', 'pause', 'play', 'getPlayed', 'getDuration'].every(key => typeof value.prototype[key] === 'function');
}
function sdk(): Promise<PlayerConstructor> {
    if (!sdkPromise) sdkPromise = new Promise((resolve, reject) => {
        const loader = window.require;
        if (!loader) {reject(new Error('AMD loader unavailable')); return;}
        const timer = window.setTimeout(() => reject(new Error('Vimeo SDK timeout')), 15000);
        loader.config({paths: {'local_gestion22tutor/vimeo-sdk': 'https://player.vimeo.com/api/player'}});
        loader(['local_gestion22tutor/vimeo-sdk'], value => {
            window.clearTimeout(timer);
            if (isSdk(value)) resolve(value); else reject(new Error('Invalid SDK'));
        }, reason => {window.clearTimeout(timer); reject(reason);});
    });
    return sdkPromise;
}

export function videoPlayer(video: Video, progress: Progress, navigate: (id: ActivityId) => void,
        afterVideo: () => void): HTMLElement {
    const root = el('article', '', 'g22l-video'); root.dataset.video = video.id;
    const iframe = el('iframe'); iframe.title = `${video.title} · Vimeo`;
    iframe.src = `https://player.vimeo.com/video/${video.vimeoId}?dnt=1`;
    iframe.allow = 'fullscreen; picture-in-picture; encrypted-media'; iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    const wrapper = el('div', '', 'g22l-video-frame'); wrapper.append(iframe);
    const feedback = status(); feedback.textContent = 'Reproducción todavía no verificada. Cargando conexión con Vimeo…';
    const restored = el('p');
    const updateStatus = (): void => {
        const state = progress.videoState(video.id);
        restored.textContent = state.completed ? `✓ Visto · ${state.percent}% reproducido` : `${state.percent}% reproducido · Debes ver al menos el 80% para marcarlo como visto.`;
    };
    progress.onChange(updateStatus); updateStatus();
    const review = el('div'); review.hidden = true;
    review.append(el('p', 'Después de este video puedes practicar con las actividades generales del módulo. No hay transcripción ni correspondencia temática verificada con este video.'),
        button('Ir a las actividades formativas', afterVideo));
    const resume = el('div'); let pending: {player: Player; activityId: ActivityId} | undefined;
    const resumeButton = button('Continuar reproducción tras la actividad', () => {
        if (pending) void pending.player.play().catch(() => {feedback.textContent = 'Usa el botón de reproducción de Vimeo para continuar.';});
        resume.hidden = true; pending = undefined;
    });
    resume.append(resumeButton); resume.hidden = true;
    window.addEventListener('g22-module:completed', (event: Event) => {
        if (event instanceof CustomEvent && pending && event.detail === pending.activityId) {
            resume.hidden = false; resumeButton.focus();
        }
    });
    root.append(el('h3', video.title), wrapper, restored, feedback, review, resume);
    void sdk().then(async Constructor => {
        const player = new Constructor(iframe);
        const timeout = new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Player unavailable')), 15000));
        await Promise.race([player.ready(), timeout]);
        let busy = false; let retry = false; let lastCheck = 0;
        const verify = async (force = false): Promise<void> => {
            if (busy) {if (force) retry = true; return;}
            if (!force && Date.now() - lastCheck < 1000) return;
            busy = true; lastCheck = Date.now();
            try {
                const [ranges, duration] = await Promise.all([player.getPlayed(), player.getDuration()]);
                if (!Number.isFinite(duration) || duration <= 0 || !Array.isArray(ranges)) return;
                progress.video(video.id, {duration, watched: ranges});
                review.hidden = !progress.videoState(video.id).completed;
                if (!review.hidden) feedback.textContent = '✓ Requisito de visualización completado.';
            } catch {feedback.textContent = 'No se pudo verificar el avance. Reanuda el video para volver a intentarlo.';}
            finally {busy = false; if (retry) {retry = false; void verify(true);}}
        };
        feedback.textContent = '';
        review.hidden = !progress.videoState(video.id).completed;
        player.on('play', () => {progress.video(video.id, {started: true}); feedback.textContent = 'Reproduciendo.';});
        player.on('pause', () => {feedback.textContent = 'Reproducción en pausa.'; void verify(true);});
        player.on('error', () => {feedback.textContent = 'No se pudo verificar la reproducción. Recarga el reproductor para volver a intentarlo.';});
        const triggered = new Set<number>();
        player.on('timeupdate', data => {
            if (!record(data) || typeof data.percent !== 'number' || typeof data.seconds !== 'number' ||
                !Number.isFinite(data.percent) || !Number.isFinite(data.seconds)) return;
            void verify();
            for (const segment of video.segments) {
                if (data.seconds >= segment.atSeconds && !triggered.has(segment.atSeconds) && isActivity(segment.activityId)) {
                    triggered.add(segment.atSeconds); pending = {player, activityId: segment.activityId};
                    void player.pause().catch(() => {}); navigate(segment.activityId);
                }
            }
        });
        player.on('ended', () => {
            void verify(true);
        });
    }).catch(() => {feedback.textContent = 'No se pudo conectar con el reproductor. Recarga la página para verificar el avance; el video se marcará como visto al reproducir el 80%.';});
    return root;
}
