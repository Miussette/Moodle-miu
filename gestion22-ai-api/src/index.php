
<?php
// Gestión22 Tutor IA - Página principal del plugin.

require_once(__DIR__ . '/../../../config.php');

$courseid = required_param('courseid', PARAM_INT);

// Obtener el curso.
$course = get_course($courseid);

// Verificar sesión y acceso al curso.
require_login($course);

$context = context_course::instance($courseid);

require_capability(
    'local/gestion22tutor:use',
    $context
);

// Configuración de la página.
$PAGE->set_url(
    new moodle_url('/local/gestion22tutor/index.php', [
        'courseid' => $courseid
    ])
);

$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');

$PAGE->set_title('Tutor IA Gestión22');
$PAGE->set_heading($course->fullname);

// Navegación.
$PAGE->navbar->add('Tutor IA Gestión22');

// Mostrar página.
echo $OUTPUT->header();

echo html_writer::tag(
    'h2',
    'Tutor IA Gestión22'
);

echo html_writer::tag(
    'p',
    '¡Hola! Soy tu tutor virtual. ' .
    'Puedo ayudarte a comprender los contenidos del curso, ' .
    'resolver dudas y practicar antes de tus evaluaciones.'
);

// Formulario visual provisional.
echo html_writer::start_tag('div', [
    'class' => 'card p-4 mt-3'
]);

echo html_writer::tag(
    'label',
    'Escribe una pregunta sobre el curso:',
    ['for' => 'gestion22-question']
);

echo html_writer::empty_tag('textarea', [
    'id' => 'gestion22-question',
    'class' => 'form-control mt-2',
    'rows' => 4,
    'placeholder' => '¿Qué tema necesitas repasar?'
]);

echo html_writer::tag(
    'p',
    'La conexión con Gemini se habilitará en la siguiente etapa.',
    ['class' => 'text-muted mt-3']
);

echo html_writer::end_tag('div');

echo $OUTPUT->footer();
