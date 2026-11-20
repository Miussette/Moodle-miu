<?php
define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/filelib.php');

/** Return a controlled JSON result without disclosing upstream details. */
function local_gestion22tutor_reply(int $status, array $body): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    local_gestion22tutor_reply(405, ['success' => false, 'error' => 'Utiliza POST.']);
}
if (!isloggedin() || isguestuser()) {
    local_gestion22tutor_reply(401, ['success' => false, 'error' => 'Inicia sesión.']);
}
try {
    require_sesskey();
    $courseid = required_param('courseid', PARAM_INT);
    $course = get_course($courseid);
    require_login($course, false);
    $context = context_course::instance($courseid);
    require_capability('local/gestion22tutor:use', $context);
    if ($courseid == SITEID || !is_enrolled($context, null, '', true) ||
            !get_config('local_gestion22tutor', 'enabled')) {
        local_gestion22tutor_reply(403, ['success' => false, 'error' => 'Acceso no permitido.']);
    }
    $question = trim(required_param('question', PARAM_RAW));
    $activityid = optional_param('activityid', '', PARAM_ALPHANUMEXT);
    $learning = [];
    $module1allowed = false;
    if (get_config('local_gestion22tutor', 'module1context_' . $courseid) === 'gestion22-heridas-avanzadas') {
        try {
            \local_gestion22tutor\local\module1_access::require_access($courseid);
            $module1allowed = true;
        } catch (\moodle_exception $e) {
            // Keep general course support available while module content is in teacher preview.
        }
    }
    if ($activityid !== '') {
        \local_gestion22tutor\local\module1_access::require_access($courseid);
        if (!\local_gestion22tutor\local\module1_access::valid_activity($activityid) ||
                optional_param('concept', '', PARAM_ALPHANUMEXT) !== $activityid) {
            local_gestion22tutor_reply(400, ['success' => false, 'error' => 'Actividad no válida.']);
        }
        $learning = ['activityId' => $activityid, 'concept' => $activityid];
    }
    if (core_text::strlen($question) < 3 || core_text::strlen($question) > 2000 || strlen($question) > 8000) {
        local_gestion22tutor_reply(400, ['success' => false, 'error' => 'Escribe entre 3 y 2000 caracteres.']);
    }
} catch (\moodle_exception $e) {
    local_gestion22tutor_reply(403, ['success' => false, 'error' => 'Acceso no permitido o sesión vencida.']);
}

$token = getenv('INTERNAL_API_TOKEN');
if (!$token) {
    local_gestion22tutor_reply(503, ['success' => false, 'error' => 'El tutor no está disponible.']);
}
// Bound provider use per authenticated Moodle session, without recording question text.
$now = time();
$recent = array_values(array_filter($SESSION->local_g22requests ?? [], static fn($stamp) => is_int($stamp) && $stamp > $now - 60));
if (count($recent) >= 20) {
    local_gestion22tutor_reply(429, ['success' => false, 'error' => 'Espera un momento antes de volver a consultar.']);
}
$recent[] = $now;
$SESSION->local_g22requests = $recent;
// Release the session lock during the slow provider request.
\core\session\manager::write_close();
try {
    // A fixed, trusted Docker destination must bypass the site's external-URL blocklist.
    // Neither the URL nor redirect destinations can be supplied by the browser.
    $client = new curl(['ignoresecurity' => true]);
    $client->setHeader(['Content-Type: application/json', 'Accept: application/json', 'x-internal-token: ' . $token]);
    $raw = $client->post('http://gestion22-ai:3001/api/chat',
        json_encode(['courseId' => $courseid, 'question' => $question, 'module1Allowed' => $module1allowed] + $learning),
        ['CURLOPT_CONNECTTIMEOUT' => 5, 'CURLOPT_TIMEOUT' => 90, 'CURLOPT_FOLLOWLOCATION' => false]);
    $status = (int)($client->get_info()['http_code'] ?? 0);
    if ($client->get_errno() || $client->error || $status !== 200) {
        $code = in_array($status, [429, 503], true) ? $status : 502;
        local_gestion22tutor_reply($code, ['success' => false,
            'error' => 'El tutor no está disponible temporalmente.', 'retryable' => true]);
    }
    $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($data) || ($data['success'] ?? null) !== true || ($data['courseId'] ?? null) !== $courseid ||
            !is_string($data['answer'] ?? null) || trim($data['answer']) === '' ||
            !is_array($data['sources'] ?? null) || !is_bool($data['grounded'] ?? null) ||
            !is_bool($data['needsHumanTutor'] ?? null)) {
        throw new \UnexpectedValueException('Invalid upstream response');
    }
    // Only expose supported response fields; generated claims are not automatically verified.
    $answer = \local_gestion22tutor\local\course_navigation::video_links($courseid, $data['answer']);
    local_gestion22tutor_reply(200, ['success' => true, 'courseId' => $courseid, 'answer' => $answer,
        'sources' => [], 'grounded' => false, 'needsHumanTutor' => $data['needsHumanTutor']]);
} catch (\Throwable $e) {
    local_gestion22tutor_reply(502, ['success' => false, 'error' => 'No fue posible consultar el tutor.']);
}
