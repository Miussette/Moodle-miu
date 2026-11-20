<?php
require_once(__DIR__ . '/../../config.php');
$courseid = required_param('courseid', PARAM_INT);
\local_gestion22tutor\local\module1_access::require_access($courseid);
$context = context_course::instance($courseid);
require_capability('local/gestion22tutor:manage', $context);
$PAGE->set_url('/local/gestion22tutor/review_module1.php', ['courseid' => $courseid]);
$PAGE->set_context($context);
$PAGE->set_course(get_course($courseid));
$PAGE->set_title('Revisión docente del Módulo 1');
$PAGE->set_heading('Revisión docente del Módulo 1');
$hash = \local_gestion22tutor\local\module1_access::content_hash();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    if (required_param('contenthash', PARAM_ALPHANUM) !== $hash) {
        throw new moodle_exception('invalidparameter', 'debug');
    }
    $reviewed = optional_param('reviewed', 0, PARAM_BOOL);
    set_config('module1reviewed_' . $courseid, $reviewed, 'local_gestion22tutor');
    set_config('module1reviewhash_' . $courseid, $reviewed ? $hash : '', 'local_gestion22tutor');
    redirect(new moodle_url('/local/gestion22tutor/module1.php', ['courseid' => $courseid]));
}
echo $OUTPUT->header();
echo html_writer::tag('p', 'Antes de habilitar el módulo para estudiantes, revisa los contenidos clínicos, preguntas, respuestas y explicaciones. Las actividades son formativas y no modifican notas. Esta acción solo afecta a este curso. Una modificación posterior del contenido requiere nueva revisión.');
echo html_writer::tag('p', html_writer::link(new moodle_url('/local/gestion22tutor/module1.php', ['courseid' => $courseid]), 'Abrir vista previa del contenido'));
echo html_writer::start_tag('form', ['method' => 'post']);
foreach (['courseid' => $courseid, 'sesskey' => sesskey(), 'contenthash' => $hash] as $name => $value) {
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => $name, 'value' => $value]);
}
echo html_writer::tag('label', html_writer::empty_tag('input', ['type' => 'checkbox', 'name' => 'reviewed', 'value' => 1,
    'checked' => get_config('local_gestion22tutor', 'module1reviewhash_' . $courseid) === $hash ? 'checked' : null]) .
    ' He revisado y aprobado este contenido clínico para habilitarlo a los estudiantes de este curso.');
echo html_writer::tag('p', html_writer::tag('button', 'Guardar revisión', ['type' => 'submit', 'class' => 'btn btn-primary']));
echo html_writer::end_tag('form');
echo $OUTPUT->footer();
