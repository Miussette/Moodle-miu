const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const definitions = new Map();
const context = vm.createContext({
    define: (name, dependencies, factory) => definitions.set(name, {dependencies, factory}),
    window: {location: {href: 'http://localhost:8080/course/view.php?id=2', origin: 'http://localhost:8080'},
        setTimeout, clearTimeout},
    URL, URLSearchParams, AbortController,
});
vm.runInContext(fs.readFileSync(`${__dirname}/../amd/build/chat.min.js`, 'utf8'), context);
const modules = new Map();
function load(name) {
    if (modules.has(name)) return modules.get(name);
    const definition = definitions.get(name);
    assert.ok(definition, `AMD module ${name} exists`);
    const exports = {};
    modules.set(name, exports);
    definition.factory(...definition.dependencies.map(dep => dep === 'exports' ? exports :
        dep === 'require' ? load : load(dep)));
    return exports;
}
const config = {containerId: 'chat', endpoint: '/local/gestion22tutor/chat.php', courseid: 2,
    sesskey: 'test', timeoutMs: 50};
const valid = {success: true, courseId: 2, answer: '<img src=x onerror=alert(1)>', sources: [],
    grounded: false, needsHumanTutor: false};
test('Moodle AMD entry exports init and all dependencies resolve', () => {
    assert.equal(typeof load('local_gestion22tutor/chat').init, 'function');
    assert.ok(fs.existsSync(`${__dirname}/../amd/build/chat.min.js.map`));
});
test('runtime validation rejects malformed results and config', () => {
    const api = load('local_gestion22tutor/api');
    assert.ok(api.isResponse(valid));
    assert.equal(api.isResponse({...valid, sources: [{}]}), false);
    assert.equal(api.isConfig({...config, timeoutMs: Infinity}), false);
});
test('fetch sends Moodle fields and validates course; handles HTTP and timeout', async () => {
    const {ChatApi} = load('local_gestion22tutor/api');
    const client = new ChatApi(config);
    context.fetch = async (_url, options) => {
        assert.equal(options.body.get('courseid'), '2');
        assert.equal(options.body.get('sesskey'), 'test');
        assert.equal(options.body.get('question'), 'Pregunta');
        return {ok: true, json: async () => valid};
    };
    assert.equal((await client.ask('Pregunta')).answer, valid.answer);
    context.fetch = async () => ({ok: true, json: async () => ({...valid, courseId: 3})});
    await assert.rejects(client.ask('Pregunta'), /inválida/);
    for (const status of [429, 502, 503]) {
        context.fetch = async () => ({ok: false, status, json: async () => ({success: false, error: 'secret'})});
        await assert.rejects(client.ask('Pregunta'), error => !error.message.includes('secret'));
    }
    context.fetch = (_url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('Aborted')));
    });
    await assert.rejects(client.ask('Pregunta'), /demasiado/);
});
