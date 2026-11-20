<?php
namespace local_gestion22tutor\local;
defined('MOODLE_INTERNAL') || die();

/** Resolve video recommendations to the actual, accessible course introduction. */
final class course_navigation {
    public static function video_links(int $courseid, string $answer): string {
        $sectionid = get_config('local_gestion22tutor', 'introductionsection_' . $courseid);
        $videourl = get_config('local_gestion22tutor', 'introductionvideo_' . $courseid);
        if (!$sectionid || !$videourl) {
            return $answer;
        }
        $section = get_fast_modinfo($courseid)->get_section_info_by_id((int)$sectionid, IGNORE_MISSING);
        $video = parse_url($videourl);
        if (!$section || !$section->uservisible || !$video || ($video['host'] ?? '') !== 'vimeo.com' ||
                !preg_match('~^/([0-9]+)$~', $video['path'] ?? '', $matches)) {
            return $answer;
        }
        $destination = (new \moodle_url('/course/section.php', ['id' => $section->id]))->out(false);
        // Replace only this course's known video, including optional Vimeo tracking parameters.
        $pattern = '~https://(?:vimeo\.com/|player\.vimeo\.com/video/)' . preg_quote($matches[1], '~') .
            '(?=[?\s<>)\]]|$)(?:\?[^\s<>)\]]*)?~u';
        return preg_replace_callback($pattern, static fn() => $destination, $answer) ?? $answer;
    }
}
