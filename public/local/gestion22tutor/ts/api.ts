/// <amd-module name="local_gestion22tutor/api" />
import type {ChatConfig, ChatRequest, GeminiResponse, ApiError, LearningContext} from './types';

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
export function isResponse(value: unknown): value is GeminiResponse {
    return record(value) && value.success === true && Number.isSafeInteger(value.courseId) &&
        typeof value.answer === 'string' && value.answer.trim().length > 0 &&
        Array.isArray(value.sources) && value.sources.every((source: unknown) => typeof source === 'string') &&
        typeof value.grounded === 'boolean' && typeof value.needsHumanTutor === 'boolean';
}
export function isApiError(value: unknown): value is ApiError {
    return record(value) && value.success === false && typeof value.error === 'string' &&
        (value.retryable === undefined || typeof value.retryable === 'boolean');
}
export function isConfig(value: unknown): value is ChatConfig {
    return record(value) && typeof value.containerId === 'string' && typeof value.endpoint === 'string' &&
        typeof value.courseid === 'number' && Number.isSafeInteger(value.courseid) && value.courseid > 1 &&
        typeof value.sesskey === 'string' && value.sesskey.length > 0 &&
        typeof value.timeoutMs === 'number' && Number.isFinite(value.timeoutMs) &&
        value.timeoutMs > 0 && value.timeoutMs <= 180000;
}
export class ChatApi {
    constructor(private readonly config: ChatConfig) {
        if (new URL(config.endpoint, window.location.href).origin !== window.location.origin) {
            throw new Error('El endpoint debe pertenecer a Moodle.');
        }
    }
    async ask(question: string, learning?: LearningContext): Promise<GeminiResponse> {
        const trimmed = question.trim();
        if (trimmed.length < 3 || trimmed.length > 2000) {
            throw new Error('Escribe una pregunta de entre 3 y 2000 caracteres.');
        }
        const request: ChatRequest = {courseid: this.config.courseid, question: trimmed, sesskey: this.config.sesskey};
        const controller = new AbortController();
        const body = new URLSearchParams({courseid: String(request.courseid), question: request.question, sesskey: request.sesskey});
        if (learning) {body.set('activityid', learning.activityId); body.set('concept', learning.concept);}
        const timer = window.setTimeout(() => controller.abort(), this.config.timeoutMs);
        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST', credentials: 'same-origin', redirect: 'error',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json'},
                body, signal: controller.signal,
            });
            const data: unknown = await response.json().catch(() => null);
            if (!response.ok) {
                const messages: Record<number, string> = {
                    401: 'Tu sesión terminó. Vuelve a iniciar sesión.',
                    403: 'No tienes permiso o tu sesión venció. Recarga la página.',
                    429: 'Demasiadas consultas. Espera antes de volver a intentar.',
                    502: 'No fue posible obtener una respuesta. Intenta nuevamente.',
                    503: 'El tutor está temporalmente ocupado. Intenta en unos minutos.',
                };
                throw new Error(messages[response.status] ?? 'No fue posible enviar la pregunta.');
            }
            if (isApiError(data)) {
                throw new Error('No fue posible obtener una respuesta. Intenta nuevamente.');
            }
            if (!isResponse(data) || data.courseId !== request.courseid) {
                throw new Error('El tutor devolvió una respuesta inválida.');
            }
            return data;
        } catch (error: unknown) {
            if (controller.signal.aborted) {
                throw new Error('El tutor tardó demasiado. Intenta nuevamente.');
            }
            if (error instanceof TypeError) {
                throw new Error('No se pudo conectar. Comprueba tu conexión e intenta nuevamente.');
            }
            throw error;
        } finally {
            window.clearTimeout(timer);
        }
    }
}
