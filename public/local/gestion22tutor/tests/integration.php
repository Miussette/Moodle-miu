<?php
// Run only from CLI inside the local Moodle container. Does not create or change users.
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../../config.php');
if (PHP_SAPI !== 'cli') {
    exit(1);
}
$mode = $argv[1] ?? 'hook';
if ($mode === 'network') {
    require_once($CFG->libdir . '/filelib.php');
    $client = new curl(['ignoresecurity' => true]);
    $raw = $client->get('http://gestion22-ai:3001/health');
    echo json_encode(['status' => $client->get_info()['http_code'] ?? 0,
        'errno' => $client->get_errno(), 'error' => $client->error,
        'healthy' => (json_decode($raw, true)['status'] ?? '') === 'ok']);
    exit;
}
$course = get_course(2);
$context = context_course::instance(2);
$users = get_enrolled_users($context, 'local/gestion22tutor:use', 0, 'u.*', null, 0, 1, true);
if (!$users) {
    fwrite(STDERR, "No enrolled authorized user for course 2.\n");
    exit(2);
}
$user = reset($users);
\core\session\manager::set_user($user);
if ($mode === 'navigation') {
    $source = 'https://vimeo.com/1216289858?fl=pl&fe=cm';
    $answer = 'Ver [Video de presentación de la docente](' . $source . ').';
    $sectionid = get_config('local_gestion22tutor', 'introductionsection_2');
    $destination = (new moodle_url('/course/section.php', ['id' => $sectionid]))->out(false);
    $actual = \local_gestion22tutor\local\course_navigation::video_links(2, $answer);
    if ($actual !== 'Ver [Video de presentación de la docente](' . $destination . ').' ||
            \local_gestion22tutor\local\course_navigation::video_links(3, $answer) !== $answer ||
            \local_gestion22tutor\local\course_navigation::video_links(2, 'https://vimeo.com/12162898580') !==
                'https://vimeo.com/12162898580') {
        throw new RuntimeException('Video navigation regression');
    }
    echo "Course-specific video link points to its introduction; other courses/videos unchanged: OK\n";
    exit;
}
if ($mode === 'hook') {
    $PAGE->set_context($context);
    $PAGE->set_course($course);
    $PAGE->set_url('/course/view.php', ['id' => 2]);
    $hook = new \core\hook\output\before_standard_footer_html_generation($PAGE->get_renderer('core'));
    \local_gestion22tutor\local\hook_callbacks::footer($hook);
    if (!str_contains($hook->get_output(), 'gestion22-chat')) {
        throw new \RuntimeException('Chat hook failed');
    }
    if (!core_requirejs::find_one_amd_module('local_gestion22tutor', 'chat.js')) {
        throw new \RuntimeException('AMD discovery failed');
    }
    echo "Hook and AMD discovery OK\n";
    exit;
}
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = ['courseid' => 2, 'sesskey' => sesskey(), 'question' => 'Explica qué es el aprendizaje activo en dos frases.'];
if ($mode === 'csrf') {
    $_POST['sesskey'] = 'invalid';
} else if ($mode === 'guest') {
    \core\session\manager::set_user(guest_user());
} else if ($mode === 'permission') {
    $_POST['courseid'] = SITEID;
} else if ($mode === 'validation') {
    $_POST['question'] = 'a';
} else if ($mode !== 'gemini') {
    throw new \InvalidArgumentException('Unknown mode');
}
require(__DIR__ . '/../chat.php');
