<?php
if (PHP_SAPI !== 'cli') exit(1);
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../../config.php');
$context = context_course::instance(2);
\core\session\manager::set_user(get_admin());
if (!\local_gestion22tutor\local\module1_access::require_access(2)) {
    throw new RuntimeException('Expected unapproved teacher preview, not publication.');
}
echo "Teacher preview and pending clinical review: OK\n";
$studentchecked = false;
foreach (get_enrolled_users($context, 'local/gestion22tutor:use') as $user) {
    if (!has_capability('local/gestion22tutor:manage', $context, $user)) {
        \core\session\manager::set_user($user);
        try {
            \local_gestion22tutor\local\module1_access::require_access(2);
        } catch (moodle_exception $e) {
            $studentchecked = true;
            break;
        }
        throw new RuntimeException('Unapproved student access must be denied.');
    }
}
echo $studentchecked ? "Student blocked until clinical review: OK\n" : "Student fixture unavailable; no student denial assertion executed.\n";
\core\session\manager::set_user(get_admin());
$blocked = false;
try {\local_gestion22tutor\local\module1_access::require_access(1);} catch (moodle_exception $e) {$blocked = true;}
if (!$blocked) throw new RuntimeException('Unassociated course access must be denied.');
echo "Unassociated course access denied: OK\n";
