<?php
require_once(__DIR__ . '/../../config.php');
$courseid = required_param('courseid', PARAM_INT);
$preview = \local_gestion22tutor\local\module1_access::require_access($courseid);
$course = get_course($courseid);
$PAGE->set_url('/local/gestion22tutor/module1.php', ['courseid' => $courseid]);
$PAGE->set_context(context_course::instance($courseid));
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title('Módulo 1 · Gestión22 Interactive Learning');
$PAGE->set_heading(format_string($course->fullname));
$PAGE->requires->css('/local/gestion22tutor/styles.css');
$PAGE->requires->css('/local/gestion22tutor/module1.css');
$PAGE->requires->js_call_amd('local_gestion22tutor/module1', 'init', [[
    'containerId' => 'g22-module1', 'courseid' => $courseid, 'preview' => $preview,
    'storageKey' => 'g22-module1:' . hash('sha256', $CFG->wwwroot . ':' . $USER->id . ':' . $courseid),
    'content' => \local_gestion22tutor\local\module1_access::content(),
]]);
echo $OUTPUT->header();
if (has_capability('local/gestion22tutor:manage', $PAGE->context)) {
    echo html_writer::tag('p', html_writer::link(new moodle_url('/local/gestion22tutor/review_module1.php',
        ['courseid' => $courseid]), 'Revisión docente y publicación del módulo'));
}
echo html_writer::div('', '', ['id' => 'g22-module1']);
echo html_writer::tag('noscript', 'Activa JavaScript para utilizar las actividades interactivas.');
echo $OUTPUT->footer();
