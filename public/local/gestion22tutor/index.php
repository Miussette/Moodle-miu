<?php
require_once(__DIR__ . '/../../config.php');
$courseid = required_param('courseid', PARAM_INT);
$course = get_course($courseid);
require_login($course);
$context = context_course::instance($courseid);
require_capability('local/gestion22tutor:use', $context);
if (!get_config('local_gestion22tutor', 'enabled')) {
    throw new moodle_exception('disabled', 'local_gestion22tutor');
}
$url = new moodle_url('/local/gestion22tutor/index.php', ['courseid' => $courseid]);
$PAGE->set_url($url);
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title(get_string('pluginname', 'local_gestion22tutor'));
$PAGE->set_heading(format_string($course->fullname));

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('pluginname', 'local_gestion22tutor'));
echo html_writer::tag('p', get_string('intro', 'local_gestion22tutor'));

echo html_writer::tag('p', 'Abre el chat Tutor IA para conversar.');
echo $OUTPUT->footer();
