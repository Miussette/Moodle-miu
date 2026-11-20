/// <amd-module name="local_gestion22tutor/module1/branching-case" />
import type {Content} from './types';
import type {Progress} from './progress';
import {el, button, list, tutor} from './dom';
import {renderQuestion} from './question';
export function branchingCase(content: Content, progress: Progress): HTMLElement {
    const root = el('div'); const stage = el('div'); const history = el('ol', '', 'g22l-history');
    let index = 0; const passed = new Set<number>();
    const draw = (): void => {
        const question = content.caseSteps[index];
        if (!question) return;
        const bar = el('progress'); bar.max = content.caseSteps.length; bar.value = passed.size;
        const next = button('Continuar a la siguiente etapa', () => {
            if (!passed.has(index)) return;
            if (index + 1 < content.caseSteps.length) {index++; draw();}
            else {progress.activity('case', true); stage.replaceChildren(el('h3', '✓ Caso completado'),
                el('p', 'Revisa tus decisiones y compara la secuencia de prevención. No es una pauta asistencial.'), list(content.prevention, true));}
        });
        next.disabled = !passed.has(index);
        const reflection = el('div', '', 'g22l-remediation'); reflection.hidden = true;
        stage.replaceChildren(el('p', `Etapa ${index + 1} de ${content.caseSteps.length}`), bar,
            renderQuestion(question, correct => {
                progress.activity('case'); progress.answered(question.id);
                reflection.hidden = correct;
                if (correct) {
                    passed.add(index); next.disabled = false;
                    history.replaceChildren(...content.caseSteps.filter((_, i) => passed.has(i)).map(q => el('li', q.text)));
                } else {
                    reflection.replaceChildren(el('p', 'Ruta de reflexión: vuelve al contenido antes de decidir. Puedes revisar tu selección.'),
                        el('p', question.explanation), tutor('case', question.topic));
                }
            }), reflection, next, button('Revisar etapa anterior', () => {index = Math.max(0, index - 1); draw();}, 'g22l-button g22l-secondary'));
    };
    root.append(el('p', content.caseScenario, 'g22l-case-intro'));
    if (content.caseIllustration) {
        const figure = el('figure', '', 'g22l-case-figure');
        const image = el('img');
        image.src = new URL(`images/${content.caseIllustration.file}`, document.baseURI).href;
        image.alt = content.caseIllustration.alt;
        image.width = 800; image.height = 380;
        figure.append(image, el('figcaption', content.caseIllustration.caption));
        root.append(figure);
    }
    root.append(stage, el('h3', 'Decisiones revisadas'), history,
        button('Reiniciar caso', () => {index = 0; passed.clear(); history.replaceChildren(); progress.resetActivity('case'); draw();}, 'g22l-button g22l-secondary'),
        el('h3', 'Medidas mencionadas en el material'), list(content.preventiveMeasures),
        el('p', 'Las medidas requieren adaptación a la valoración y al criterio profesional. No son indicaciones universales para pacientes reales.'),
        tutor('case', 'valoración, prevención y reevaluación del caso ficticio'));
    draw(); return root;
}
