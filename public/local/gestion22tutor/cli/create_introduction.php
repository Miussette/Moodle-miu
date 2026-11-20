<?php
// Explicit, repeatable setup of the introductory section in an associated local course.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/course/modlib.php');
require_once($CFG->libdir . '/resourcelib.php');

list($options, $unknown) = cli_get_params(['courseid' => null, 'context' => null, 'bindings' => null, 'update' => false]);
if ($unknown || !$options['courseid'] || !$options['context'] || !$options['bindings']) {
    cli_error('Required: --courseid=ID --context=FILE --bindings=FILE');
}
$data = json_decode(file_get_contents($options['context']), true, 32, JSON_THROW_ON_ERROR);
$bindings = json_decode(file_get_contents($options['bindings']), true, 32, JSON_THROW_ON_ERROR);
$courseid = (int)$options['courseid'];
if ($courseid <= SITEID || rtrim($CFG->wwwroot, '/') !== rtrim($bindings['moodleOrigin'] ?? '', '/') ||
        ($bindings['courses'][(string)$courseid] ?? null) !== ($data['id'] ?? null)) {
    cli_error('The context must be explicitly associated with this course and this Moodle instance.');
}
$course = get_course($courseid);
\core\session\manager::set_user(get_admin());
$PAGE->set_context(context_course::instance($courseid));
$PAGE->set_course($course);
require_capability('moodle/course:update', $PAGE->context);
require_capability('moodle/course:manageactivities', $PAGE->context);
$existingid = get_config('local_gestion22tutor', 'introductionsection_' . $courseid);
$existing = $existingid ? $DB->get_record('course_sections', ['id' => $existingid, 'course' => $courseid]) : false;
if ($existing && !$options['update']) {
    cli_writeln('Introduction already exists: ' . $CFG->wwwroot . '/course/section.php?id=' . $existingid);
    exit;
}

$resources = $data['beforeStarting'];
$resources[] = ['id' => 'examen-final', 'title' => 'Examen Final',
    'description' => 'Enlace al examen original del aula de producción. Corresponde al 100% de la calificación.',
    'url' => $data['assessment']['finalExam']['url']];
foreach ($resources as $resource) {
    $url = new moodle_url($resource['url']);
    $allowed = $url->get_scheme() === 'https' &&
        ($url->get_host() === 'aulavirtual.gestion22.cl' ||
            ($resource['id'] === 'presentacion-docente' && $url->get_host() === 'vimeo.com'));
    if (!$allowed) {
        cli_error('Unexpected introductory resource URL.');
    }
}

$summary = html_writer::tag('h3', s($data['title']));
foreach (explode("\n\n", $data['welcome']) as $paragraph) {
    $summary .= html_writer::tag('p', nl2br(s($paragraph)));
}
// The supplied Vimeo URL identifies the video; no video content or script is copied locally.
$videourl = null;
foreach ($resources as $resource) {
    if ($resource['id'] === 'presentacion-docente') {
        $videourl = new moodle_url($resource['url']);
    }
}
if (!$videourl || !preg_match('~^/([0-9]+)$~', $videourl->get_path(), $matches)) {
    cli_error('A valid Vimeo presentation video is required.');
}
$player = html_writer::tag('iframe', '', [
    'src' => 'https://player.vimeo.com/video/' . $matches[1] . '?dnt=1',
    'title' => 'Presentación del Curso',
    'allow' => 'fullscreen; picture-in-picture; encrypted-media',
    'allowfullscreen' => 'allowfullscreen',
    'referrerpolicy' => 'strict-origin-when-cross-origin',
    'width' => '1100', 'height' => '619',
    'style' => 'position:absolute;inset:0;width:100%;height:100%;border:0;',
]);
$presentation = html_writer::tag('h3', 'Presentación del Curso', ['style' => 'text-align:center;']);
$presentation .= html_writer::div($player, 'g22-introduction-player',
    ['style' => 'position:relative;width:100%;aspect-ratio:16 / 9;background:#000;']);
$summary = html_writer::div($presentation, 'g22-introduction-presentation',
    ['style' => 'width:100%;max-width:1100px;margin:0 auto 2rem;']) . $summary;
$summary .= html_writer::tag('h4', 'Antes de comenzar');
$summary .= html_writer::tag('p', 'Revisa la Ficha Técnica, el video de presentación de la docente y el Foro Consultas al Docente que encontrarás a continuación.');
$summary .= html_writer::tag('p', 'Los enlaces identificados como «aula de producción» corresponden a aulavirtual.gestion22.cl y pueden requerir iniciar sesión allí. El video está alojado en Vimeo.');
$summary .= html_writer::tag('h4', 'Sistema de evaluación');
$summary .= html_writer::tag('p', 'El Examen Final corresponde al 100% de la calificación. Las evaluaciones diagnósticas y formativas son actividades de apoyo al aprendizaje y no inciden en la nota final.');
$summary .= html_writer::tag('h4', 'Soporte técnico y administrativo');
$summary .= html_writer::tag('p', html_writer::link('mailto:' . $data['support']['email'], s($data['support']['email'])) .
    '. Indica tu nombre completo y el código del curso en el correo.');

$transaction = $DB->start_delegated_transaction();
$module1section = get_config('local_gestion22tutor', 'module1section_' . $courseid);
$forumurl = null;
foreach ($resources as $resource) {
    if ($resource['id'] === 'consultas-docente') $forumurl = $resource['url'];
}
$shortcuts = [
    ['Foros', 'Consultas al docente', $forumurl, 'Abrir foro', 'FORO'],
    ['Módulo 1', 'Fundamentos anatomofisiológicos de la piel',
        $module1section ? (new moodle_url('/course/section.php', ['id' => $module1section]))->out(false) : null,
        'Entrar al módulo', 'M1'],
    ['Módulo 2', 'Fisiopatología de la cicatrización y factores asociados', null, '', 'M2'],
    ['Módulo 3', 'Valoración clínica y clasificación etiológica de heridas', null, '', 'M3'],
    ['Módulo 4', 'Manejo avanzado y tecnologías para la curación', null, '', 'M4'],
    ['Módulo 5', 'Manejo de heridas de difícil cicatrización', null, '', 'M5'],
    ['Módulo 6', 'Prevención, seguridad del paciente y continuidad del cuidado', null, '', 'M6'],
    ['Encuesta de satisfacción', 'Comparte tu experiencia del curso', null, '', 'ENCUESTA'],
    ['Examen Final', 'Evaluación final del curso', $data['assessment']['finalExam']['url'], 'Abrir examen', 'EXAMEN'],
    ['Certificado de aprobación', 'Documento de aprobación del curso', null, '', 'CERTIFICADO'],
];
$cards = '';
foreach ($shortcuts as [$title, $description, $url, $action, $badge]) {
    if (!$url) {
        $setting = 'portal_section_' . strtolower($badge) . '_' . $courseid;
        $targetid = get_config('local_gestion22tutor', $setting);
        $target = $targetid ? $DB->get_record('course_sections', ['id' => $targetid, 'course' => $courseid]) : false;
        if (!$target) {
            $position = 1 + (int)$DB->get_field_sql('SELECT MAX(section) FROM {course_sections} WHERE course = ?', [$courseid]);
            $sectionactions = \core_courseformat\formatactions::section($course);
            $target = $sectionactions->create($position);
            $targetinfo = get_fast_modinfo($course)->get_section_info_by_id($target->id);
            $sectionactions->update($targetinfo, ['name' => $title,
                'summary' => html_writer::tag('h3', s($description)) .
                    html_writer::tag('p', 'Este apartado está en preparación. Su contenido todavía no está disponible.'),
                'summaryformat' => FORMAT_HTML, 'visible' => 1]);
            set_config($setting, $target->id, 'local_gestion22tutor');
        }
        $url = (new moodle_url('/course/section.php', ['id' => $target->id]))->out(false);
        $action = 'Ver apartado · En preparación';
    }
    $contents = html_writer::span(s($badge), 'g22-course-card-badge') .
        html_writer::tag('h5', s($title)) . html_writer::tag('p', s($description)) .
        html_writer::span($url ? s($action) . ' →' : 'Pendiente de habilitar', 'g22-course-card-status');
    if ($url) {
        $cards .= html_writer::link($url, $contents, ['class' => 'g22-course-card']);
    } else {
        $cards .= html_writer::div($contents, 'g22-course-card g22-course-card-pending', ['aria-disabled' => 'true']);
    }
}
$summary .= html_writer::tag('h4', 'Accesos directos al curso') .
    html_writer::tag('p', 'Selecciona un apartado para continuar. Los apartados en preparación se completarán próximamente.') .
    html_writer::div($cards, 'g22-course-shortcuts');

$quizcount = $DB->count_records('quiz', ['course' => $courseid]);
$gradecount = $DB->count_records('grade_items', ['courseid' => $courseid]);
$actions = \core_courseformat\formatactions::section($course);
$section = $existing ?: $actions->create(1);
$sectioninfo = get_fast_modinfo($course)->get_section_info_by_id($section->id);
$actions->update($sectioninfo, ['name' => 'Introducción', 'summary' => $summary,
    'summaryformat' => FORMAT_HTML, 'visible' => 1]);
$moduleid = $DB->get_field('modules', 'id', ['name' => 'url'], MUST_EXIST);
foreach ($resources as $resource) {
    if ($DB->record_exists('course_modules', ['course' => $courseid,
            'idnumber' => 'gestion22-intro-' . $resource['id']])) {
        continue;
    }
    $external = $resource['id'] === 'presentacion-docente' ? 'Vimeo' : 'aula de producción';
    add_moduleinfo((object)[
        'modulename' => 'url', 'module' => $moduleid, 'section' => $section->section,
        'name' => $resource['title'] . ' (' . $external . ')',
        'intro' => html_writer::tag('p', s($resource['description'])), 'introformat' => FORMAT_HTML,
        'externalurl' => $resource['url'], 'display' => RESOURCELIB_DISPLAY_NEW,
        'visible' => 1, 'showdescription' => 1, 'completion' => COMPLETION_DISABLED,
        'cmidnumber' => 'gestion22-intro-' . $resource['id'],
    ], $course);
}
if ($DB->count_records('quiz', ['course' => $courseid]) !== $quizcount ||
        $DB->count_records('grade_items', ['courseid' => $courseid]) !== $gradecount) {
    throw new RuntimeException('Unexpected exam or grade item change; rolling back.');
}
set_config('introductionsection_' . $courseid, $section->id, 'local_gestion22tutor');
set_config('introductionvideo_' . $courseid, $videourl->out(false), 'local_gestion22tutor');
$transaction->allow_commit();
rebuild_course_cache($courseid, true);
cli_writeln('Introduction saved with embedded presentation and 4 URL resources; exams and grade item counts unchanged.');
cli_writeln($CFG->wwwroot . '/course/section.php?id=' . $section->id);
