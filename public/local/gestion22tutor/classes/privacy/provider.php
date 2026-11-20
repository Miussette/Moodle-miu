<?php
namespace local_gestion22tutor\privacy;
defined('MOODLE_INTERNAL') || die();
class provider implements \core_privacy\local\metadata\provider {
    public static function get_metadata(\core_privacy\local\metadata\collection $collection): \core_privacy\local\metadata\collection {
        $collection->add_external_location_link('ai', ['question' => 'privacy:metadata:ai:question'],
            'privacy:metadata:ai');
        return $collection;
    }
}
