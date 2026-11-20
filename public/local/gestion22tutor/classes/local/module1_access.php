<?php
namespace local_gestion22tutor\local;
defined('MOODLE_INTERNAL') || die();

final class module1_access {
    public static function require_access(int $courseid): bool {
        $course = get_course($courseid);
        require_login($course, false);
        $context = \context_course::instance($courseid);
        require_capability('local/gestion22tutor:use', $context);
        if ($courseid == SITEID || isguestuser() || !is_enrolled($context, null, '', true) ||
                get_config('local_gestion22tutor', 'module1context_' . $courseid) !== 'gestion22-heridas-avanzadas') {
            throw new \moodle_exception('nopermissions', 'error', '', 'acceder a Módulo 1');
        }
        $reviewed = get_config('local_gestion22tutor', 'module1reviewed_' . $courseid) &&
            get_config('local_gestion22tutor', 'module1reviewhash_' . $courseid) === self::content_hash();
        if (!$reviewed) {
            require_capability('local/gestion22tutor:manage', $context);
        }
        return !$reviewed;
    }

    public static function content(): array {
        return json_decode(file_get_contents(self::content_file()), true, 64, JSON_THROW_ON_ERROR);
    }
    public static function content_hash(): string {
        return hash_file('sha256', self::content_file());
    }
    private static function content_file(): string {
        $filename = getenv('GESTION22_MODULE1_CONTENT_FILE');
        if (!$filename || !is_readable($filename)) {
            throw new \moodle_exception('error', 'error', '', null, 'Module content not configured');
        }
        return $filename;
    }

    public static function valid_activity(string $id): bool {
        return in_array($id, ['anatomy', 'risks', 'assessment', 'checklist', 'case', 'practice'], true);
    }
}
