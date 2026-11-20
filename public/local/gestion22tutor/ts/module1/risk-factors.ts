/// <amd-module name="local_gestion22tutor/module1/risk-factors" />
import type {Content} from './types';
import type {Progress} from './progress';
import {el, button, choices, status, tutor} from './dom';
export function riskFactors(content: Content, progress: Progress): HTMLElement {
    const root = el('div', '', 'g22l-risk-exercise');
    root.append(el('p', 'Relaciona cada factor con un ejemplo y su posible consecuencia.', 'g22l-risk-intro'));
    const counter = el('p', '', 'g22l-risk-counter'); counter.setAttribute('role', 'status');
    const rows = content.risks.map(risk => {
        const card = el('div', '', 'g22l-risk');
        const example = choices('Ejemplo', content.risks.map(item => item.example));
        const consequence = choices('Posible consecuencia', content.risks.map(item => item.consequence));
        example.select.setAttribute('aria-label', `${risk.factor} · Ejemplo`);
        consequence.select.setAttribute('aria-label', `${risk.factor} · Posible consecuencia`);
        for (const select of [example.select, consequence.select]) {
            select.options[0]!.text = 'Selecciona una opción';
            select.addEventListener('change', () => {progress.activity('risks'); updateCounter();});
        }
        const fields = el('div', '', 'g22l-risk-fields'); fields.append(example.wrapper, consequence.wrapper);
        const feedback = status(); card.append(el('h3', risk.factor), fields, feedback); root.append(card);
        return {risk, example: example.select, consequence: consequence.select, feedback};
    });
    const updateCounter = (): void => {
        const answered = rows.reduce((sum, row) => sum + Number(!!row.example.value) + Number(!!row.consequence.value), 0);
        counter.textContent = `${answered} de ${rows.length * 2} respuestas completadas`;
    };
    updateCounter();
    const note = el('p', 'Estas asociaciones son orientativas y no determinan un diagnóstico.', 'g22l-risk-note');
    const footer = el('div', '', 'g22l-risk-footer');
    const feedback = status();
    footer.append(counter, button('Comprobar respuestas', () => {
        progress.activity('risks'); let correct = 0;
        for (const row of rows) {
            const passed = row.example.value === row.risk.example && row.consequence.value === row.risk.consequence;
            if (passed) correct++;
            row.feedback.textContent = passed ? '✓ Asociación correcta.' :
                `Revisa: ${row.risk.factor} → ${row.risk.example} → ${row.risk.consequence}. Es una asociación educativa.`;
        }
        feedback.textContent = `${correct} de ${rows.length} asociaciones correctas. Puedes ajustar tus respuestas y comprobar otra vez.`;
        if (correct === rows.length) progress.activity('risks', true);
    }));
    root.append(note, footer, feedback, button('Reintentar', () => {
        rows.forEach(row => {row.example.value = ''; row.consequence.value = ''; row.feedback.textContent = '';});
        feedback.textContent = ''; progress.resetActivity('risks'); updateCounter();
    }, 'g22l-button g22l-secondary'), tutor('risks', 'factores de riesgo y sus asociaciones educativas'));
    return root;
}
