/// <amd-module name="local_gestion22tutor/module1/question" />
import type {Question} from './types';
import {el, button, choices, status} from './dom';
export function renderQuestion(question: Question, onAnswer: (correct: boolean) => void): HTMLElement {
    const box = el('fieldset', '', 'g22l-question'); box.append(el('legend', question.text));
    const feedback = status(); const radios: HTMLInputElement[] = []; const matches: Array<{select: HTMLSelectElement; right: string}> = [];
    if (question.kind === 'matching') {
        for (const pair of question.pairs ?? []) {
            const control = choices(pair.left, question.options); matches.push({select: control.select, right: pair.right}); box.append(control.wrapper);
        }
    } else {
        question.options.forEach((option, index) => {
            const label = el('label', '', 'g22l-option'); const input = el('input'); input.type = 'radio';
            input.name = question.id; input.value = String(index); radios.push(input); label.append(input, document.createTextNode(option)); box.append(label);
        });
    }
    box.append(button('Comprobar respuesta', () => {
        if (matches.length ? matches.some(item => !item.select.value) : !radios.some(input => input.checked)) {
            feedback.textContent = 'Selecciona una respuesta antes de comprobar.'; return;
        }
        const correct = matches.length ? matches.every(item => item.select.value === item.right) :
            radios.findIndex(input => input.checked) === question.correct;
        feedback.textContent = (correct ? '✓ Correcto. ' : 'Revisa tu respuesta. ') + question.explanation;
        feedback.dataset.result = correct ? 'correct' : 'retry'; onAnswer(correct);
    }), feedback);
    return box;
}
