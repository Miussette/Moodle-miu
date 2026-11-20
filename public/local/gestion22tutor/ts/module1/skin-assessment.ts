/// <amd-module name="local_gestion22tutor/module1/skin-assessment" />
import type {Content} from './types';
import type {Progress} from './progress';
import {el, button, choices, status, list, tutor} from './dom';

export function skinAssessment(content: Content, progress: Progress): HTMLElement {
    const root = el('div'); const body = el('div', '', 'g22l-body'); const editor = el('div', '', 'g22l-info');
    body.dataset.view = 'front';
    const results = new Map<string, string>(); const markers = new Map<string, HTMLButtonElement>(); const completion = status();
    const findings = ['Sin hallazgos simulados', 'Eritema', 'Lesión', 'Maceración', 'Sequedad', 'Otros'];
    const positions: Array<[number, number]> = [[50, 9], [50, 18], [50, 31], [20, 39], [50, 46], [50, 53], [50, 71], [37, 91], [64, 96]];
    const imageFrame = el('div', '', 'g22l-adult-frame');
    const illustration = el('img', '', 'g22l-adult-image');
    illustration.src = new URL('images/cuerpo-adulto-ia.png', document.baseURI).href;
    illustration.alt = 'Ilustración educativa de un adulto de cuerpo completo, vista frontal.';
    imageFrame.append(illustration); body.append(imageFrame);
    const viewLabel = el('p', 'Vista frontal');
    const view = el('div', '', 'g22l-actions');
    const changeView = (back: boolean): void => {
        viewLabel.textContent = back ? 'Vista posterior · localiza sacro, glúteos y talones' : 'Vista frontal';
        body.dataset.view = back ? 'back' : 'front';
        illustration.alt = `Ilustración educativa de un adulto de cuerpo completo, vista ${back ? 'posterior' : 'frontal'}.`;
        frontControl.setAttribute('aria-pressed', String(!back)); backControl.setAttribute('aria-pressed', String(back));
    };
    const frontControl = button('Vista frontal', () => changeView(false));
    const backControl = button('Vista posterior', () => changeView(true));
    frontControl.setAttribute('aria-pressed', 'true'); backControl.setAttribute('aria-pressed', 'false');
    view.append(frontControl, backControl);
    content.zones.forEach((zone, index) => {
        const position = positions[index] ?? [50, 50];
        const marker = button(zone, () => {
            progress.activity('assessment');
            const field = choices(`Hallazgo simulado · ${zone}`, findings); field.select.value = results.get(zone) ?? '';
            const feedback = status();
            editor.replaceChildren(el('h3', zone), field.wrapper,
                button('Registrar zona', () => {
                    if (!field.select.value) {feedback.textContent = 'Selecciona un hallazgo simulado.'; return;}
                    results.set(zone, field.select.value); marker.dataset.finding = String(findings.indexOf(field.select.value));
                    marker.textContent = `${zone} · ${findings.indexOf(field.select.value)} ✓`; marker.setAttribute('aria-label', `${zone}: ${field.select.value}`);
                    feedback.textContent = `Registrado: ${zone} · ${field.select.value}.`;
                    completion.textContent = `${results.size} de ${content.zones.length} zonas revisadas en esta práctica.`;
                    if (results.size === content.zones.length) progress.activity('assessment', true);
                }), feedback);
        }, 'g22l-marker');
        marker.style.left = `${position[0]}%`; marker.style.top = `${position[1]}%`;
        marker.dataset.zone = zone;
        markers.set(zone, marker); body.append(marker);
    });
    root.append(el('p', 'SIMULACIÓN EDUCATIVA. Selecciona cada zona y registra un hallazgo ficticio. Los hallazgos permanecen solo en esta página.'),
        view, viewLabel, body, el('p', 'Ilustración educativa de adulto generada con IA.', 'g22l-muted'),
        el('p', 'Leyenda: 0 sin hallazgos · 1 eritema · 2 lesión · 3 maceración · 4 sequedad · 5 otros. El nombre del hallazgo también se muestra al seleccionar la zona.'),
        editor, completion, el('h3', 'Qué observar'), list(content.observations),
        el('h3', 'Zonas de especial atención'), list(content.attentionZones), tutor('assessment', 'valoración sistemática de cabeza a pies'));
    return root;
}
