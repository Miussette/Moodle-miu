/// <amd-module name="local_gestion22tutor/module1/clinical-checklist" />
import type {Content} from './types';
import type {Progress} from './progress';
import {el, button, choices, status, tutor} from './dom';

export function clinicalChecklist(content: Content, progress: Progress): HTMLElement {
    const root = el('div', '', 'g22l-checklist'); const form = el('form'); const feedback = status(); const summary = el('pre', '', 'g22l-summary');
    const section = (title: string, description: string): {group: HTMLFieldSetElement; fields: HTMLDivElement} => {
        const group = el('fieldset', '', 'g22l-checklist-section');
        const fields = el('div', '', 'g22l-checklist-grid');
        group.append(el('legend', title), el('p', description, 'g22l-muted'), fields); form.append(group);
        return {group, fields};
    };
    const identification = section('01 · Datos de la simulación', 'El paciente y el evaluador están predefinidos. Completa la fecha y la unidad de práctica.');
    const controls = new Map<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();
    let exported = '';
    const fixed = (label: string, value: string): void => {
        const wrapper = el('label', label, 'g22l-field'); const input = el('input'); input.value = value; input.readOnly = true;
        input.defaultValue = value; wrapper.append(input); identification.fields.append(wrapper); controls.set(label, input);
    };
    fixed('Paciente ficticio', 'SIM-076'); fixed('Evaluador ficticio', 'Evaluador simulado A');
    const dateLabel = el('label', 'Fecha de simulación', 'g22l-field'); const date = el('input'); date.type = 'date'; date.required = true;
    dateLabel.append(date); identification.fields.append(dateLabel); controls.set('Fecha', date);
    const service = choices('Servicio o unidad simulada', ['Unidad simulada A', 'Unidad simulada B']); service.select.required = true;
    identification.fields.append(service.wrapper); controls.set('Servicio', service.select);
    const assessment = section('02 · Evaluación de la piel', 'Selecciona un resultado para cada aspecto de la valoración simulada.');
    for (const item of content.checklist) {
        const field = choices(item, ['Normal en la simulación', 'Alterado en la simulación', 'No evaluable en la simulación']);
        field.select.required = true; assessment.fields.append(field.wrapper); controls.set(item, field.select);
    }
    const plan = section('03 · Hallazgos y plan de cuidados', 'Describe los hallazgos ficticios y las acciones que propondrías en esta simulación.');
    for (const [name, label] of [['Ubicación', 'Ubicación de hallazgos ficticios'], ['Observaciones', 'Observaciones generales de la simulación'],
        ['Plan', 'Plan educativo de cuidados'], ['Reevaluación', 'Reevaluación programada de la simulación']] as const) {
        const wrapper = el('label', label, 'g22l-field'); const input = el('textarea'); input.rows = 2; input.maxLength = 1200;
        input.required = true; input.minLength = 3; input.rows = 4;
        wrapper.append(input); plan.fields.append(wrapper); controls.set(name, input);
    }
    const confirmation = el('label', '', 'g22l-option'); const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.required = true;
    confirmation.append(checkbox, document.createTextNode('Confirmo que los datos de esta práctica son ficticios y que no he ingresado datos de pacientes reales.')); form.append(confirmation);
    const editable = [...controls.values()].filter(control => !(control instanceof HTMLInputElement && control.readOnly));
    const completion = el('progress'); completion.max = editable.length + 1; completion.value = 0;
    completion.setAttribute('aria-label', 'Avance del formulario');
    const countLabel = el('p', '', 'g22l-checklist-count');
    const updateCount = (): void => {
        completion.value = editable.filter(control => control.value.trim() && control.validity.valid).length + Number(checkbox.checked);
        countLabel.textContent = `${completion.value} de ${completion.max} campos completados`;
    };
    updateCount();
    form.addEventListener('input', () => {
        progress.activity('checklist'); exported = ''; summary.textContent = '';
        updateCount();
    });
    const submit = el('button', 'Generar resumen de práctica', 'g22l-button'); submit.type = 'submit';
    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const values = [...controls.entries()].map(([name, control]) => `${name}: ${control.value.trim()}`);
        if (values.some(value => /\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/.test(value))) {
            feedback.textContent = 'No incluyas RUT ni identificadores reales. Usa únicamente datos ficticios.'; return;
        }
        exported = 'SIMULACIÓN EDUCATIVA — NO VÁLIDA COMO REGISTRO CLÍNICO.\n\n' + values.join('\n');
        summary.textContent = exported; feedback.textContent = '✓ Resumen educativo generado. No se guarda ni se envía al Tutor IA.';
        progress.activity('checklist', true);
    });
    const submitRow = el('div', '', 'g22l-checklist-submit'); submitRow.append(submit); form.append(submitRow);
    const progressBox = el('div', '', 'g22l-checklist-progress'); progressBox.append(countLabel, completion);
    const actions = el('div', '', 'g22l-checklist-actions');
    const exportButton = button('Exportar resumen de práctica (.txt)', () => {
            if (!exported) {feedback.textContent = 'Primero completa el formulario y genera el resumen.'; return;}
            const url = URL.createObjectURL(new Blob([exported], {type: 'text/plain;charset=utf-8'}));
            const link = el('a'); link.href = url; link.download = 'SIMULACION-EDUCATIVA-NO-REGISTRO-CLINICO.txt';
            link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    actions.append(exportButton, button('Reiniciar checklist', () => {
            form.reset(); controls.get('Paciente ficticio')?.setAttribute('value', 'SIM-076');
            controls.get('Evaluador ficticio')?.setAttribute('value', 'Evaluador simulado A');
            exported = ''; summary.textContent = ''; feedback.textContent = ''; updateCount();
            progress.resetActivity('checklist');
        }, 'g22l-button g22l-secondary'), tutor('checklist', 'componentes del registro y checklist educativo'));
    root.append(el('p', 'SIMULACIÓN EDUCATIVA — NO VÁLIDA COMO REGISTRO CLÍNICO. No ingreses nombres, RUT ni datos clínicos de personas reales.', 'g22l-checklist-notice'),
        progressBox, form, feedback, summary, actions);
    return root;
}
