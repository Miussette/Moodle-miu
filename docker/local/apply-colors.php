<?php
// Apply the local Gestion22 palette through Boost settings without editing core theme files.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
define('CLI_SCRIPT', true);
require(__DIR__ . '/../../config.php');
$start = '/* BEGIN GESTION22 COLORS */';
$end = '/* END GESTION22 COLORS */';
$current = (string)get_config('theme_boost', 'scss');
$clean = preg_replace('~/\* BEGIN GESTION22 COLORS \*/.*?/\* END GESTION22 COLORS \*/~s', '', $current);
$css = file_get_contents(__DIR__ . '/gestion22-colors.scss');
if ($css === false) { throw new RuntimeException('Cannot read palette'); }
set_config('brandcolor', '#0bb523', 'theme_boost');
set_config('scss', rtrim($clean) . "\n" . $start . "\n" . $css . "\n" . $end, 'theme_boost');
theme_reset_all_caches();
echo "Gestion22 colors applied.\n";
