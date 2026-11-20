/// <amd-module name="local_gestion22tutor/module1" />
import {isConfig, activities} from './types';
import type {ActivityId} from './types';
import {el, button} from './dom';
import {Progress} from './progress';
import {videoPlayer} from './video-player';
import {anatomy} from './anatomy';
import {riskFactors} from './risk-factors';
import {skinAssessment} from './skin-assessment';
import {clinicalChecklist} from './clinical-checklist';
import {branchingCase} from './branching-case';
import {quizPractice} from './quiz-practice';

export function init(input: unknown): void {
    if (!isConfig(input)) return;
    const root = document.getElementById(input.containerId);
    if (!root || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true'; root.className = 'g22l';
    const content = input.content; const progress = new Progress(input.storageKey, content);
    const header = el('header', '', 'g22l-hero');
    header.append(el('p', 'GESTIÓN22 · INTERACTIVE LEARNING', 'g22l-eyebrow'), el('h1', content.title), el('p', content.subtitle));
    if (input.preview) header.append(el('p', 'VISTA PREVIA DOCENTE · Pendiente de revisión clínica antes de habilitar para estudiantes.', 'g22l-warning'));
    header.append(el('p', 'Actividades formativas sin nota. Solo casos ficticios. No sustituyen la valoración ni el criterio de profesionales sanitarios. No compartas datos de pacientes reales.'));
    const welcome = el('section', '', 'g22l-section g22l-welcome');
    welcome.append(el('h2', 'Módulo 1: Fundamentos Anatomo-Fisiológicos de la Piel'),
        el('p', 'Bienvenido(a) a este primer módulo del curso. Aquí conocerá la anatomía, fisiología y principales funciones de la piel, así como los factores locales y sistémicos que influyen en la integridad cutánea. Estos contenidos constituyen la base para comprender los mecanismos de reparación tisular y el manejo clínico de las heridas de difícil cicatrización desde una perspectiva basada en evidencia.'),
        el('h3', 'Antes de comenzar'));
    const instructions = el('ol');
    instructions.append(el('li', 'Visualice los videos en el orden en que se presentan, ya que han sido diseñados con una secuencia progresiva para facilitar el aprendizaje.'),
        el('li', 'Realice las actividades propuestas antes de avanzar al siguiente módulo, con el fin de consolidar los contenidos revisados.'));
    const forumItem = el('li', 'Si tiene dudas académicas, utilice el foro ');
    const forumLink = el('a', 'Consultas al Docente');
    forumLink.href = 'https://aulavirtual.gestion22.cl/mod/forum/view.php?id=24043';
    forumLink.target = '_blank'; forumLink.rel = 'noopener';
    forumItem.append(forumLink, document.createTextNode(', donde podrá realizar sus preguntas y recibir orientación durante el desarrollo del curso.'));
    const supportItem = el('li', 'Para consultas relacionadas con la plataforma o dificultades de acceso, comuníquese a ');
    const supportLink = el('a', 'aulavirtual@gestion22.cl'); supportLink.href = 'mailto:aulavirtual@gestion22.cl';
    supportItem.append(supportLink, document.createTextNode(', indicando el nombre del curso y el módulo correspondiente.'));
    instructions.append(forumItem, supportItem);
    welcome.append(instructions, el('p', 'Le invitamos a participar activamente, reflexionar sobre los contenidos y aplicar los conocimientos en su práctica clínica.'),
        el('p', '¡Le deseamos mucho éxito en este proceso de aprendizaje!', 'g22l-welcome-closing'));
    const progressBox = el('section', '', 'g22l-progress'); progressBox.setAttribute('aria-label', 'Avance formativo local');
    const bar = el('progress'); bar.max = 100; bar.setAttribute('aria-label', 'Porcentaje de avance');
    const summary = el('p'); const storage = el('p', '', 'g22l-muted');
    progressBox.append(el('h2', 'Tu avance de práctica'), bar, summary, storage,
        button('Reiniciar progreso local', () => {
            progress.reset(); storage.textContent = 'Progreso reiniciado. Recarga para reiniciar también las respuestas que sigan abiertas.';
        }, 'g22l-button g22l-secondary'));
    const nav = el('nav', '', 'g22l-navigation'); nav.setAttribute('aria-label', 'Secciones del Módulo 1');
    const exerciseMenu = el('details', '', 'g22l-submenu'); exerciseMenu.open = true;
    exerciseMenu.append(el('summary', 'Seleccionar ejercicio práctico'), nav);
    const videoSection = el('section', '', 'g22l-section'); videoSection.id = 'g22l-videos';
    videoSection.append(el('h2', 'Videos módulo I'));
    const targets = new Map<ActivityId, HTMLElement>(); const states = new Map<ActivityId, HTMLElement>();
    const navigate = (id: ActivityId): void => {
        const target = targets.get(id); if (!target) return;
        selectGroup('exercises'); progress.activity(id); target.scrollIntoView({behavior: 'smooth', block: 'start'});
        target.querySelector<HTMLElement>('h2')?.focus({preventScroll: true});
    };
    const titles: Record<ActivityId, string> = {anatomy: 'Anatomía de la piel', risks: 'Factores de riesgo',
        assessment: 'Valoración cutánea', checklist: 'Checklist digital', case: 'Caso clínico ficticio', practice: 'Autoevaluación formativa'};
    const factories: Record<ActivityId, () => HTMLElement> = {
        anatomy: () => anatomy(content, progress), risks: () => riskFactors(content, progress),
        assessment: () => skinAssessment(content, progress), checklist: () => clinicalChecklist(content, progress),
        case: () => branchingCase(content, progress), practice: () => quizPractice(content, progress),
    };
    const container = el('div'); container.id = 'g22l-exercises';
    container.append(el('h2', 'Ejercicios prácticos'), el('p', 'Aplica lo aprendido con estas seis actividades formativas, sin nota.'));
    for (const [index, id] of activities.entries()) {
        const section = el('section', '', 'g22l-section'); section.id = `g22l-${id}`; section.dataset.activity = id;
        const title = el('h2', `${String(index + 1).padStart(2, '0')} · ${titles[id]}`); title.tabIndex = -1;
        const state = el('span', '', 'g22l-badge'); states.set(id, state); targets.set(id, section);
        if (id === 'risks' || id === 'checklist') {
            title.textContent = titles[id];
            const heading = el('header', '', 'g22l-activity-heading');
            const headingText = el('div');
            headingText.append(el('p', `${String(index + 1).padStart(2, '0')} · ACTIVIDAD`, 'g22l-activity-eyebrow'), title);
            heading.append(headingText, state); section.append(heading, factories[id]());
        } else section.append(title, state, factories[id]());
        container.append(section);
        nav.append(button(titles[id], () => navigate(id), 'g22l-nav-item'));
    }
    for (const [index, video] of content.videos.entries()) {
        const player = videoPlayer(video, progress, navigate, () => navigate('anatomy'));
        player.id = `g22l-video-${index + 1}`;
        videoSection.append(player);
    }
    const complementary = el('section', '', 'g22l-section'); complementary.id = 'g22l-materials'; complementary.append(el('h2', 'Materiales complementarios'));
    const materialFiles: Record<string, string> = {
        'Manejo del neonato con piel frágil': 'Manejo del neonato con piel frágil.pdf',
        'Dermatitis atópica severa en la infancia': 'Dermatitis atópica severa en la infancia.pdf',
    };
    for (const [index, material] of content.complementary.entries()) {
        const resource = el('section'); resource.id = `g22l-material-${index + 1}`;
        resource.append(el('h3', material.title));
        const description = el('p');
        const titlePosition = material.description.toLocaleLowerCase('es').indexOf(material.title.toLocaleLowerCase('es'));
        if (index === 0) {
            description.append(el('strong', material.title), document.createTextNode(` ${material.description.charAt(0).toLocaleLowerCase('es')}${material.description.slice(1)}`));
        } else {
            if (titlePosition >= 0) {
                description.append(document.createTextNode(material.description.slice(0, titlePosition)),
                    el('strong', material.description.slice(titlePosition, titlePosition + material.title.length)),
                    document.createTextNode(material.description.slice(titlePosition + material.title.length)));
            } else {
                description.textContent = material.description;
            }
        }
        resource.append(description);
        const citations: Record<string, string> = {
            'Manejo del neonato con piel frágil': 'Acosta Agustina, Álvarez Mariela, Bazzano Carlos, Borda Karla, Borbonet Daniel, De María Manuela et al. Manejo del neonato con piel frágil. Arch. Pediatr. Urug. [Internet]. 2024 [citado 2026 Ago 07]; 95(1): e801. Disponible en: http://www.scielo.edu.uy/scielo.php?script=sci_arttext&pid=S1688-12492024000101801&lng=es. Epub 01-Jun-2024. https://doi.org/10.31134/ap.95.1.16.',
            'Dermatitis atópica severa en la infancia': 'Agüero U, López B, Hasbún Z. Dermatitis atópica severa en la infancia en la era de la medicina personalizada. Andes Pediatr. 2024;95(3):236-243. doi: 10.32641/andespediatr.v95i3.5049.',
        };
        if (citations[material.title]) {
            const citation = el('p', '', 'g22l-material-citation');
            citation.append(el('strong', citations[material.title]));
            resource.append(citation);
        }
        const filename = materialFiles[material.title];
        if (filename) {
            const actions = el('div', '', 'g22l-pdf-actions');
            const url = new URL(`pdf/${encodeURIComponent(filename)}`, document.baseURI).href;
            const open = el('a', 'Ver PDF', 'g22l-button');
            open.href = url; open.target = '_blank'; open.rel = 'noopener';
            open.setAttribute('aria-label', `Ver PDF: ${material.title} (abre en otra pestaña)`);
            const download = el('a', 'Descargar PDF', 'g22l-button g22l-secondary');
            download.href = url; download.download = filename;
            download.setAttribute('aria-label', `Descargar PDF: ${material.title}`);
            actions.append(open, download); resource.append(actions);
        }
        complementary.append(resource);
    }
    const infographics = el('section', '', 'g22l-section'); infographics.id = 'g22l-infographics';
    infographics.append(el('h2', 'Infografías'), el('p', 'Consulta el material visual antes de realizar los ejercicios.'));
    const infographic = container.querySelector<HTMLDetailsElement>('.g22l-infographic');
    if (infographic) { infographic.open = true; infographics.append(infographic); }
    const additionalInfographics = [
        {title: 'Checklist de evaluación de la piel', file: 'Checklist de evaluación de la piel.png'},
        {title: 'Prevención desde el ingreso del paciente', file: 'Prevención desde el ingreso del paciente.png'},
        {title: 'Tabla resumen: factores que afectan la integridad cutánea',
            file: 'Tabla Resumen_ Factores que afectan la integridad Cutánea.png'},
    ];
    for (const item of additionalInfographics) {
        const details = el('details', '', 'g22l-infographic');
        const image = el('img');
        image.src = new URL(`images/${encodeURIComponent(item.file)}`, document.baseURI).href;
        image.alt = item.title; image.loading = 'lazy';
        const fullImage = el('a', 'Abrir infografía en tamaño completo');
        fullImage.href = image.src; fullImage.target = '_blank'; fullImage.rel = 'noopener';
        details.append(el('summary', item.title), image, fullImage); infographics.append(details);
    }
    const groups = new Map<string, HTMLElement>([['videos', videoSection], ['infographics', infographics],
        ['exercises', container], ['materials', complementary]]);
    const groupNav = el('nav', '', 'g22l-navigation g22l-group-navigation');
    groupNav.setAttribute('aria-label', 'Contenido del módulo');
    const groupButtons = new Map<string, HTMLButtonElement>();
    const selectGroup = (id: string): void => {
        for (const [key, section] of groups) section.hidden = key !== id;
        exerciseMenu.hidden = id !== 'exercises';
        for (const [key, control] of groupButtons) control.setAttribute('aria-pressed', String(key === id));
    };
    for (const [id, label] of [['videos', '01 · Videos'], ['infographics', '02 · Infografías'],
        ['exercises', '03 · Ejercicios prácticos'], ['materials', '04 · Material complementario']]) {
        const control = button(label!, () => selectGroup(id!), 'g22l-nav-item');
        control.setAttribute('aria-controls', groups.get(id!)!.id); groupButtons.set(id!, control); groupNav.append(control);
    }
    root.append(header, welcome, groupNav, progressBox, exerciseMenu, videoSection, infographics, container, complementary,
        el('p', content.source, 'g22l-muted'));
    selectGroup('videos');
    const update = (): void => {
        const state = progress.summary(); bar.value = state.percent;
        summary.textContent = `${state.percent}% · ${state.videos}/4 videos vistos (mínimo 80%) · ${state.completed}/6 actividades completadas · ${state.answered} preguntas respondidas. ` +
            (progress.activityState('case') === 'completed' ? 'Caso práctico completado.' : 'Caso práctico pendiente.');
        storage.textContent = progress.memoryOnly ? 'No se pudo guardar en este navegador. El avance se mantiene solo en memoria.' :
            'Avance guardado solo en este navegador para esta cuenta y curso. No se guardan observaciones ni formularios clínicos.';
        for (const [id, label] of states) {
            const activity = progress.activityState(id);
            label.textContent = activity === 'completed' ? '✓ Completada' : activity === 'started' ? 'En curso' : 'Pendiente';
            label.dataset.state = activity;
        }
    };
    progress.onChange(update); update();
    // Native Moodle resources link here; resolve only known elements within this module.
    const openQuickAccess = (): void => {
        const id = window.location.hash.slice(1);
        const target = Array.from(root.querySelectorAll<HTMLElement>('[id]')).find(item => item.id === id);
        if (!target) return;
        for (const [key, section] of groups) {
            if (section === target || section.contains(target)) selectGroup(key);
        }
        target.tabIndex = -1;
        target.scrollIntoView({block: 'start'});
        target.focus({preventScroll: true});
    };
    requestAnimationFrame(openQuickAccess);
    window.addEventListener('hashchange', openQuickAccess);
}
