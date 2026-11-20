/// <amd-module name="local_gestion22tutor/module1/dom" />
import type {ActivityId} from './types';
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag); node.textContent = text; node.className = className; return node;
}
export function button(text: string, action: () => void, className = 'g22l-button'): HTMLButtonElement {
    const node = el('button', text, className); node.type = 'button'; node.addEventListener('click', action); return node;
}
export function status(): HTMLParagraphElement {
    const node = el('p', '', 'g22l-feedback'); node.setAttribute('role', 'status'); return node;
}
export function choices(label: string, values: readonly string[]): {wrapper: HTMLLabelElement; select: HTMLSelectElement} {
    const wrapper = el('label', label, 'g22l-field'); const select = el('select');
    select.setAttribute('aria-label', label);
    select.append(new Option('Selecciona…', ''));
    values.forEach(value => select.append(new Option(value, value))); wrapper.append(select); return {wrapper, select};
}
export function tutor(activityId: ActivityId, concept: string): HTMLButtonElement {
    return button('Preguntar al Tutor IA', () => window.dispatchEvent(new CustomEvent('gestion22tutor:ask', {
        detail: {activityId, concept: activityId, question: `Explícame este concepto del Módulo 1: ${concept}. Dame un ejemplo educativo, sin datos de pacientes reales.`},
    })), 'g22l-button g22l-secondary');
}
export function list(items: readonly string[], ordered = false): HTMLElement {
    const node = el(ordered ? 'ol' : 'ul'); items.forEach(item => node.append(el('li', item))); return node;
}
