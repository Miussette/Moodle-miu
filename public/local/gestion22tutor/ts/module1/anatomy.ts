/// <amd-module name="local_gestion22tutor/module1/anatomy" />
import type {Content} from './types';
import type {Progress} from './progress';
import {el, button, list, tutor} from './dom';
import {renderQuestion} from './question';
export function anatomy(content: Content, progress: Progress): HTMLElement {
    const root = el('div'); const diagram = el('div', '', 'g22l-skin');
    diagram.setAttribute('role', 'group'); diagram.setAttribute('aria-label', 'Explora las tres capas de la piel');
    const illustration = el('img', '', 'g22l-skin-image');
    illustration.src = new URL('images/capas-piel-ia.png', document.baseURI).href;
    illustration.alt = 'Ilustración de un corte de piel: epidermis superficial, dermis con folículos y vasos, e hipodermis con tejido adiposo.';
    diagram.append(illustration);
    const panel = el('div', '', 'g22l-info'); panel.setAttribute('aria-live', 'polite');
    const passed = new Set<string>(); const controls: HTMLButtonElement[] = [];
    for (const layer of content.layers) {
        const control = button(layer.title, () => {
            controls.forEach(item => item.setAttribute('aria-pressed', String(item === control)));
            progress.activity('anatomy');
            panel.replaceChildren(el('h3', layer.title), el('p', layer.description), list(layer.components),
                el('p', layer.function), renderQuestion(layer.question, correct => {
                    progress.answered(layer.question.id);
                    if (correct) passed.add(layer.id);
                    if (passed.size === content.layers.length) progress.activity('anatomy', true);
                }), tutor('anatomy', layer.title));
        }, `g22l-layer g22l-layer-${layer.id}`);
        const label = el('span', layer.title); control.replaceChildren(label);
        control.setAttribute('aria-pressed', 'false'); controls.push(control); diagram.append(control);
    }
    const infographic = el('details', '', 'g22l-infographic');
    const infographicImage = el('img');
    infographicImage.src = new URL('images/anatomia-piel.png', document.baseURI).href;
    infographicImage.alt = 'Infografía Anatomía de la piel de Gestión22: estructura, componentes y funciones de epidermis, dermis e hipodermis.';
    infographicImage.loading = 'lazy';
    const fullImage = el('a', 'Abrir infografía en tamaño completo');
    fullImage.href = infographicImage.src; fullImage.target = '_blank'; fullImage.rel = 'noopener';
    infographic.append(el('summary', 'Consultar infografía: Anatomía de la piel'), infographicImage, fullImage);
    root.append(el('p', 'Selecciona una capa en la ilustración y responde sus preguntas.'), diagram,
        el('p', 'Ilustración educativa generada con IA. Las proporciones son esquemáticas.', 'g22l-muted'), panel, infographic,
        el('h3', 'Funciones generales de la piel'), list(content.skinFunctions));
    panel.append(el('p', 'Selecciona una capa para comenzar la exploración.'));
    return root;
}
