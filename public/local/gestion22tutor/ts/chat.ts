/// <amd-module name="local_gestion22tutor/chat" />
import {ChatApi, isConfig} from './api';
import {formatMessage} from './format';
import type {ChatConfig, ConversationMessage, LearningContext} from './types';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}
export class Gestion22Chat {
    private readonly api: ChatApi;
    private readonly toggle = element('button', 'g22-toggle', 'Tutor IA');
    private readonly panel = element('section', 'g22-panel');
    private readonly log = element('div', 'g22-messages');
    private readonly input = element('textarea', 'g22-input');
    private readonly send = element('button', 'g22-send', 'Enviar');
    private readonly status = element('p', 'g22-status');
    private busy = false;
    private learning: LearningContext | undefined;

    constructor(root: HTMLElement, config: ChatConfig) {
        this.api = new ChatApi(config);
        root.classList.add('g22-chat');
        this.toggle.type = 'button';
        this.toggle.setAttribute('aria-expanded', 'false');
        this.toggle.setAttribute('aria-controls', `${config.containerId}-panel`);
        this.toggle.setAttribute('aria-label', 'Abrir Tutor IA Gestión22');
        this.panel.id = `${config.containerId}-panel`;
        this.panel.hidden = true;
        this.panel.setAttribute('role', 'region');
        this.panel.setAttribute('aria-label', 'Tutor IA Gestión22');
        const header = element('header', 'g22-header');
        const close = element('button', 'g22-close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', 'Cerrar chat');
        close.addEventListener('click', () => this.setOpen(false));
        header.append(element('strong', '', 'Tutor IA Gestión22'), close);
        this.log.setAttribute('role', 'log');
        this.log.setAttribute('aria-live', 'polite');
        this.log.setAttribute('aria-label', 'Conversación');
        this.log.tabIndex = 0;
        const form = element('form', 'g22-form');
        const label = element('label', '', 'Tu pregunta');
        this.input.id = `${config.containerId}-question`;
        label.htmlFor = this.input.id;
        this.input.rows = 2;
        this.input.maxLength = 2000;
        this.input.minLength = 3;
        this.input.required = true;
        this.send.type = 'submit';
        this.status.setAttribute('role', 'status');
        this.status.setAttribute('aria-live', 'polite');
        form.append(label, this.input, this.send);
        form.addEventListener('submit', (event: SubmitEvent) => { event.preventDefault(); void this.submit(); });
        this.panel.append(header, this.log, this.status, form);
        root.append(this.toggle, this.panel);
        this.toggle.addEventListener('click', () => this.setOpen(this.panel.hidden));
        this.panel.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') { this.setOpen(false); }
        });
        window.addEventListener('gestion22tutor:ask', (event: Event) => {
            if (!(event instanceof CustomEvent) || this.busy) return;
            const detail: unknown = event.detail;
            if (typeof detail !== 'object' || detail === null || !('activityId' in detail) ||
                !('concept' in detail) || !('question' in detail) || typeof detail.question !== 'string' ||
                detail.question.length > 2000 || typeof detail.concept !== 'string' || detail.concept !== detail.activityId) return;
            const activityId = detail.activityId;
            if (activityId !== 'anatomy' && activityId !== 'risks' && activityId !== 'assessment' &&
                activityId !== 'checklist' && activityId !== 'case' && activityId !== 'practice') return;
            this.learning = {activityId, concept: activityId}; this.input.value = detail.question;
            this.setOpen(true); this.status.textContent = 'Revisa la pregunta y pulsa Enviar. No se incluyen tus registros de práctica.';
        });
        this.render({role: 'assistant', text: '¡Hola! Soy tu Tutor IA. Puedo ayudarte a comprender conceptos. ' +
            'Puedes preguntarme por los materiales disponibles de tu curso. No compartas datos reales de pacientes ni información personal.'});
    }
    private setOpen(open: boolean): void {
        this.panel.hidden = !open;
        this.toggle.setAttribute('aria-expanded', String(open));
        if (open) { this.input.focus(); } else { this.toggle.focus(); }
    }
    private render(message: ConversationMessage): void {
        const bubble = element('div', `g22-message g22-${message.role}`);
        const body = element('div', 'g22-message-body');
        if (message.role === 'assistant') {
            body.append(formatMessage(message.text));
        } else {
            body.textContent = message.text;
        }
        bubble.append(element('span', 'g22-author', message.role === 'student' ? 'Tú: ' : 'Tutor IA: '), body);
        this.log.append(bubble);
        this.log.scrollTop = this.log.scrollHeight;
    }
    private async submit(): Promise<void> {
        if (this.busy) { return; }
        const question = this.input.value.trim();
        if (question.length < 3 || question.length > 2000) {
            this.status.textContent = 'Escribe entre 3 y 2000 caracteres.';
            return;
        }
        this.busy = true;
        this.send.disabled = true;
        this.input.readOnly = true;
        this.status.textContent = 'Escribiendo…';
        this.render({role: 'student', text: question});
        try {
            const response = await this.api.ask(question, this.learning);
            this.render({role: 'assistant', text: response.answer});
            this.input.value = '';
            this.learning = undefined;
            this.status.textContent = response.needsHumanTutor ? 'Consulta también con tu tutor humano.' : '';
        } catch (error: unknown) {
            this.status.textContent = error instanceof Error ? error.message : 'Ocurrió un error. Intenta nuevamente.';
        } finally {
            this.busy = false;
            this.send.disabled = false;
            this.input.readOnly = false;
            if (!this.panel.hidden) { this.input.focus(); }
        }
    }
}
export function init(config: unknown): void {
    if (!isConfig(config)) { return; }
    const root = document.getElementById(config.containerId);
    if (!root || root.dataset.initialized === 'true') { return; }
    // Boost copies footer HTML into its help popover, without DOM event listeners.
    // Mount outside the footer before rendering so the chat is never copied or hidden with it.
    document.body.append(root);
    new Gestion22Chat(root, config);
    root.dataset.initialized = 'true';
}
