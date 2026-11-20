<?php
namespace local_gestion22tutor\local;
defined('MOODLE_INTERNAL') || die();

final class hook_callbacks {
    private static bool $rendered = false;

    private static function available(): bool {
        global $PAGE;
        return isloggedin() && !isguestuser() && !empty($PAGE->course->id) && $PAGE->course->id != SITEID &&
            get_config('local_gestion22tutor', 'enabled') &&
            has_capability('local/gestion22tutor:use', \context_course::instance($PAGE->course->id)) &&
            is_enrolled(\context_course::instance($PAGE->course->id), null, '', true);
    }

    public static function head(\core\hook\output\before_standard_head_html_generation $hook): void {
        global $PAGE, $DB;
        if (self::available()) {
            $PAGE->requires->css('/local/gestion22tutor/styles.css');
            // In normal viewing, omit our retired shortcuts even for teachers.
            // Editing mode retains every native resource for course management.
            if (!$PAGE->user_is_editing()) {
                $selectors = [];
                foreach ($DB->get_records('course_modules', ['course' => $PAGE->course->id,
                        'visibleoncoursepage' => 0]) as $cm) {
                    if ($cm->idnumber === 'gestion22-module1-interactive' ||
                            str_starts_with($cm->idnumber ?? '', 'gestion22-module1-quick-')) {
                        $selectors[] = '#courseindex [data-id="' . (int)$cm->id . '"][data-for="cm"]';
                    }
                }
                if ($selectors) $hook->add_html('<style>' . implode(',', $selectors) . '{display:none!important}</style>');
            }
        }
    }

    public static function footer(\core\hook\output\before_standard_footer_html_generation $hook): void {
        global $PAGE;
        if (self::$rendered || !self::available()) {
            return;
        }
        self::$rendered = true;
        $hook->add_html(\html_writer::div('', '', ['id' => 'gestion22-chat']));
        $PAGE->requires->js_call_amd('local_gestion22tutor/chat', 'init', [[
            'containerId' => 'gestion22-chat',
            'endpoint' => (new \moodle_url('/local/gestion22tutor/chat.php'))->out(false),
            'courseid' => (int)$PAGE->course->id,
            'sesskey' => sesskey(),
            'timeoutMs' => 95000,
        ]]);
    }
}
