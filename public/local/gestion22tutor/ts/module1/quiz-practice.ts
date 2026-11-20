/// <amd-module name="local_gestion22tutor/module1/quiz-practice" />
import type {Content} from './types';
import type {Progress} from './progress';
import {el, button, status, tutor} from './dom';
import {renderQuestion} from './question';
export function quizPractice(content: Content, progress: Progress): HTMLElement {
    const root = el('div'); const questions = el('div'); const summary = status();
    const results = new Map<string, boolean>();
    const draw = (): void => {
        questions.replaceChildren(...content.quiz.map(question => renderQuestion(question, correct => {
            results.set(question.id, correct); progress.activity('practice'); progress.answered(question.id);
            const passed = [...results.values()].filter(Boolean).length;
            const topics = content.quiz.filter(q => results.get(q.id) === false).map(q => q.topic);
            summary.textContent = `${results.size} preguntas respondidas; ${passed} de ${content.quiz.length} correctas. ` +
                (topics.length ? `Repasa: ${[...new Set(topics)].join(', ')}.` : 'Puedes revisar las explicaciones.');
            if (passed === content.quiz.length) progress.activity('practice', true);
        })));
    };
    root.append(el('p', 'Autoevaluación formativa, sin nota. Estas preguntas se crearon con los contenidos suministrados; no proceden del quiz oficial.'),
        questions, summary, button('Reintentar autoevaluación', () => {
            results.clear(); summary.textContent = ''; progress.resetActivity('practice'); draw();
        }, 'g22l-button g22l-secondary'), tutor('practice', 'repaso de integridad cutánea antes del quiz oficial'));
    draw(); return root;
}
