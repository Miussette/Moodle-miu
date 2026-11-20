<?php
defined('MOODLE_INTERNAL') || die();
if ($hassiteconfig) {
    $settings = new admin_settingpage('local_gestion22tutor', get_string('pluginname', 'local_gestion22tutor'));
    $settings->add(new admin_setting_configcheckbox('local_gestion22tutor/enabled',
        get_string('enabled', 'local_gestion22tutor'), get_string('enabled_desc', 'local_gestion22tutor'), 1));
    $ADMIN->add('localplugins', $settings);
}
