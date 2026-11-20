<?php
if (PHP_SAPI !== 'cli') {http_response_code(404); exit;}
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/course/modlib.php');
require_once($CFG->libdir . '/resourcelib.php');
list($options, $unknown) = cli_get_params(['courseid' => null, 'bindings' => null]);
if ($unknown || !$options['courseid'] || !$options['bindings']) cli_error('Required: --courseid=ID --bindings=FILE');
$courseid = (int)$options['courseid'];
$bindings = json_decode(file_get_contents($options['bindings']), true, 32, JSON_THROW_ON_ERROR);
$content = \local_gestion22tutor\local\module1_access::content();
if ($courseid <= SITEID || rtrim($CFG->wwwroot, '/') !== rtrim($bindings['moodleOrigin'] ?? '', '/') ||
        ($bindings['courses'][(string)$courseid] ?? null) !== $content['contextId']) {
    cli_error('Course must be explicitly bound to this content and local Moodle instance.');
}
$course = get_course($courseid);
\core\session\manager::set_user(get_admin());
$PAGE->set_course($course); $PAGE->set_context(context_course::instance($courseid));
require_capability('moodle/course:update', $PAGE->context);
require_capability('moodle/course:manageactivities', $PAGE->context);
$beforegrades = $DB->get_records('grade_items', ['courseid' => $courseid]);
$beforequizzes = $DB->get_records('quiz', ['course' => $courseid]);
$beforeavailability = $DB->get_records_menu('course_modules', ['course' => $courseid], '', 'id,availability');
$transaction = $DB->start_delegated_transaction();
$sectionid = get_config('local_gestion22tutor', 'module1section_' . $courseid);
$section = $sectionid ? $DB->get_record('course_sections', ['id' => $sectionid, 'course' => $courseid]) : false;
if (!$section) {
    // Reuse only a genuinely empty placeholder after the introduction; preserve other sections.
    $introid = get_config('local_gestion22tutor', 'introductionsection_' . $courseid);
    $introposition = $introid ? (int)$DB->get_field('course_sections', 'section', ['id' => $introid, 'course' => $courseid]) : 0;
    foreach ($DB->get_records('course_sections', ['course' => $courseid], 'section ASC') as $candidate) {
        if ($candidate->section > $introposition && empty($candidate->name) && empty($candidate->sequence) &&
                trim(strip_tags($candidate->summary ?? '')) === '' && empty($candidate->component)) {
            $section = $candidate; break;
        }
    }
    if (!$section) $section = \core_courseformat\formatactions::section($course)->create($introposition + 1);
    $sectioninfo = get_fast_modinfo($course)->get_section_info_by_id($section->id);
    \core_courseformat\formatactions::section($course)->update($sectioninfo, ['name' => 'Módulo 1',
        'summary' => html_writer::tag('p', 'Integridad cutánea · Videos originales y seis actividades interactivas de práctica. Formativo, sin calificación. Contenido sujeto a revisión docente antes de habilitar para estudiantes.'),
        'summaryformat' => FORMAT_HTML, 'visible' => 1]);
}
$welcome = '<h3>Módulo 1: Fundamentos Anatomo-Fisiológicos de la Piel</h3>' .
    '<p>Bienvenido(a) a este primer módulo del curso. Aquí conocerá la anatomía, fisiología y principales funciones de la piel, así como los factores locales y sistémicos que influyen en la integridad cutánea. Estos contenidos constituyen la base para comprender los mecanismos de reparación tisular y el manejo clínico de las heridas de difícil cicatrización desde una perspectiva basada en evidencia.</p>' .
    '<h4>Antes de comenzar</h4><ol>' .
    '<li>Visualice los videos en el orden en que se presentan, ya que han sido diseñados con una secuencia progresiva para facilitar el aprendizaje.</li>' .
    '<li>Realice las actividades propuestas antes de avanzar al siguiente módulo, con el fin de consolidar los contenidos revisados.</li>' .
    '<li>Si tiene dudas académicas, utilice el foro <a href="https://aulavirtual.gestion22.cl/mod/forum/view.php?id=24043" target="_blank" rel="noopener">Consultas al Docente</a>, donde podrá realizar sus preguntas y recibir orientación durante el desarrollo del curso.</li>' .
    '<li>Para consultas relacionadas con la plataforma o dificultades de acceso, comuníquese a <a href="mailto:aulavirtual@gestion22.cl">aulavirtual@gestion22.cl</a>, indicando el nombre del curso y el módulo correspondiente.</li></ol>' .
    '<p>Le invitamos a participar activamente, reflexionar sobre los contenidos y aplicar los conocimientos en su práctica clínica.</p>' .
    '<p style="text-align:center"><strong>¡Le deseamos mucho éxito en este proceso de aprendizaje!</strong></p>';
$sectioninfo = get_fast_modinfo($course)->get_section_info_by_id($section->id);
\core_courseformat\formatactions::section($course)->update($sectioninfo,
    ['summary' => $welcome, 'summaryformat' => FORMAT_HTML]);
$marker = 'gestion22-module1-interactive';
if (!$DB->record_exists('course_modules', ['course' => $courseid, 'idnumber' => $marker])) {
    add_moduleinfo((object)[
        'modulename' => 'url', 'module' => $DB->get_field('modules', 'id', ['name' => 'url'], MUST_EXIST),
        'section' => $section->section, 'name' => 'Módulo 1 · Experiencia interactiva',
        'intro' => 'Explora anatomía, riesgos, valoración cutánea, checklist, caso ficticio y autoevaluación. Sin nota.',
        'introformat' => FORMAT_HTML, 'externalurl' => (new moodle_url('/local/gestion22tutor/module1.php', ['courseid' => $courseid]))->out(false),
        'display' => RESOURCELIB_DISPLAY_OPEN, 'visible' => 1, 'showdescription' => 1,
        'completion' => COMPLETION_DISABLED, 'cmidnumber' => $marker,
    ], $course);
}
// Individual native resources also appear in Moodle's course index.
$quicklinks = [];
foreach ($content['videos'] as $index => $video) {
    $quicklinks['video-' . ($index + 1)] = ['01 · Video ' . ($index + 1) . ': ' . $video['title'], 'Video original del módulo.'];
}
$quicklinks += [
    'infographics' => ['02 · Infografía: anatomía de la piel', 'Material visual de consulta.'],
    'anatomy' => ['03 · Ejercicio: capas de la piel', 'Capas, funciones y preguntas de práctica.'],
    'risks' => ['03 · Ejercicio: factores de riesgo', 'Relaciona factores, ejemplos y consecuencias.'],
    'assessment' => ['03 · Ejercicio: valoración cutánea', 'Explora las zonas y los hallazgos de la valoración.'],
    'checklist' => ['03 · Ejercicio: checklist cutáneo', 'Formulario de simulación educativa con exportación.'],
    'case' => ['03 · Ejercicio: caso clínico ficticio', 'Recorrido formativo de decisiones.'],
    'practice' => ['03 · Autoevaluación de práctica (sin nota)', 'Actividad formativa independiente del quiz oficial.'],
];
foreach ($content['complementary'] as $index => $material) {
    $quicklinks['material-' . ($index + 1)] = ['04 · Material complementario: ' . $material['title'], $material['description']];
}
$quicklinks['official-quiz'] = ['05 · Quiz Módulo 1 (aula de producción)',
    'Abre el cuestionario oficial en aulavirtual.gestion22.cl. Requiere acceso al aula de producción y conserva sus condiciones de disponibilidad.'];
$quicklinks = [
    'videos' => ['Videos', 'Revisa los cuatro videos del módulo.'],
    'infographics' => ['Infografías', 'Consulta el material visual de anatomía de la piel.'],
    'exercises' => ['Ejercicios prácticos', 'Selecciona una de las seis actividades formativas.'],
    'materials' => ['Material complementario', 'Recursos de consulta del módulo.'],
    'official-quiz' => ['Quiz Módulo 1', 'Abre la evaluación oficial en el aula de producción.'],
];
// Keep previous URLs available through direct links, without filling the course index.
$managed = $DB->get_records('course_modules', ['course' => $courseid]);
foreach ($managed as $cm) {
    $prefix = 'gestion22-module1-quick-';
    if ($cm->idnumber === $marker || (str_starts_with($cm->idnumber ?? '', $prefix) &&
            !array_key_exists(substr($cm->idnumber, strlen($prefix)), $quicklinks))) {
        set_coursemodule_visible($cm->id, $cm->visible, 0, false);
    }
}
foreach ($quicklinks as $key => [$name, $description]) {
    $idnumber = 'gestion22-module1-quick-' . $key;
    $url = (new moodle_url('/local/gestion22tutor/module1.php', ['courseid' => $courseid], 'g22l-' . $key))->out(false);
    if ($key === 'official-quiz') {
        $url = 'https://aulavirtual.gestion22.cl/mod/quiz/view.php?id=24059';
    }
    $existing = $DB->get_record('course_modules', ['course' => $courseid, 'idnumber' => $idnumber]);
    if ($existing) {
        set_coursemodule_name($existing->id, $name);
        $DB->set_field('url', 'externalurl', $url, ['id' => $existing->instance]);
        $existing->modname = 'url';
        set_coursemodule_visible($existing->id, $existing->visible, 1, false);
        moveto_module($existing, $section);
        continue;
    }
    add_moduleinfo((object)[
        'modulename' => 'url', 'module' => $DB->get_field('modules', 'id', ['name' => 'url'], MUST_EXIST),
        'section' => $section->section, 'name' => $name, 'intro' => s($description),
        'introformat' => FORMAT_HTML, 'externalurl' => $url,
        'display' => RESOURCELIB_DISPLAY_OPEN, 'visible' => 1, 'showdescription' => 1,
        'completion' => COMPLETION_DISABLED, 'cmidnumber' => $idnumber,
    ], $course);
}
if ($beforegrades != $DB->get_records('grade_items', ['courseid' => $courseid]) ||
        $beforequizzes != $DB->get_records('quiz', ['course' => $courseid])) {
    throw new RuntimeException('Unexpected grades or official quiz change.');
}
foreach ($beforeavailability as $id => $availability) {
    if ($DB->get_field('course_modules', 'availability', ['id' => $id]) !== $availability) {
        throw new RuntimeException('Existing access restriction changed.');
    }
}
set_config('module1section_' . $courseid, $section->id, 'local_gestion22tutor');
set_config('module1context_' . $courseid, $content['contextId'], 'local_gestion22tutor');
$transaction->allow_commit(); rebuild_course_cache($courseid, true);
cli_writeln('Módulo 1 ready in section ' . $section->id . '. Existing grades, quizzes and access restrictions unchanged.');
cli_writeln((new moodle_url('/local/gestion22tutor/module1.php', ['courseid' => $courseid]))->out(false));
