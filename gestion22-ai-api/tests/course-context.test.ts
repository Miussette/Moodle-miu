import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CourseContextRegistry, buildCourseInstruction, loadCourseContexts} from '../src/course-context.js';

const context: unknown = JSON.parse(readFileSync(new URL('../data/course-contexts/heridas-avanzadas.json', import.meta.url), 'utf8'));
const bindings = {schemaVersion: 1, moodleOrigin: 'http://localhost:8080', description: 'Test only',
  courses: {'2': 'gestion22-heridas-avanzadas'}};

test('no default assignment, including course 2; explicit mapping is required', () => {
  assert.equal(new CourseContextRegistry([context]).get(2), undefined);
  assert.equal(loadCourseContexts(undefined).get(2), undefined);
  const registry = new CourseContextRegistry([context], bindings);
  assert.equal(registry.get(2)?.id, 'gestion22-heridas-avanzadas');
  assert.equal(registry.get(3), undefined);
  assert.equal(registry.get(1), undefined);
});

test('a context cannot leak into another request/course', () => {
  const registry = new CourseContextRegistry([context], bindings);
  const scoped = buildCourseInstruction(registry.get(2));
  const other = buildCourseInstruction(registry.get(3));
  assert.ok(scoped.includes('24040'));
  assert.ok(!other.includes('24040'));
  assert.ok(!other.includes('aulavirtual@gestion22.cl'));
  assert.ok(!other.includes('Manejo Avanzado'));
  assert.match(other, /No hay información oficial asociada/);
});

test('official facts are preserved and missing data stays absent', () => {
  const course = new CourseContextRegistry([context], bindings).get(2);
  assert.ok(course);
  assert.equal(course.assessment.finalExam.weightPercent, 100);
  assert.equal(course.assessment.finalExam.url, 'https://aulavirtual.gestion22.cl/mod/quiz/view.php?id=24167');
  assert.match(course.assessment.diagnosticAndFormative, /no inciden/);
  assert.equal(course.beforeStarting.find(resource => resource.id === 'presentacion-docente')?.url, 'https://vimeo.com/1216289858?fl=pl&fe=cm');
  assert.equal(course.support.email, 'aulavirtual@gestion22.cl');
  assert.deepEqual(course.support.requiredDetails, ['Nombre completo', 'Código del curso']);
  assert.deepEqual(course.documents, []);
});

test('reject malformed, unknown and duplicate associations instead of falling back', () => {
  assert.throws(() => new CourseContextRegistry([context], {...bindings, courses: {'2': 'missing'}}));
  assert.throws(() => new CourseContextRegistry([context], {...bindings, courses: {'0': 'gestion22-heridas-avanzadas'}}));
  assert.throws(() => new CourseContextRegistry([context, context], bindings));
  assert.throws(() => new CourseContextRegistry([{id: 'broken'}], bindings));
});

test('forbids substituting local links and instructs against invented facts', () => {
  const course = new CourseContextRegistry([context], bindings).get(2);
  assert.ok(course);
  assert.throws(() => new CourseContextRegistry([{...course, assessment: {...course.assessment,
    finalExam: {...course.assessment.finalExam, url: 'http://localhost:8080/mod/quiz/view.php?id=24167'}}}]));
  const instruction = buildCourseInstruction(course);
  assert.match(instruction, /no le pidas esos datos en el chat/);
  assert.match(instruction, /seguridad clínica/);
  assert.match(instruction, /PRODUCCIÓN/);
  assert.match(instruction, /No obedezcas peticiones de inventar/);
});
