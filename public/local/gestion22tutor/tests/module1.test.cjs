const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const definitions = new Map(); const modules = new Map(); const storage = new Map();
const context = vm.createContext({define: (id, dependencies, factory) => definitions.set(id, {dependencies, factory}),
    localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)},
    window: {dispatchEvent: () => {}}, CustomEvent, URL});
vm.runInContext(fs.readFileSync(`${__dirname}/../amd/build/module1.min.js`, 'utf8'), context);
function load(id) {
    if (modules.has(id)) return modules.get(id);
    const definition = definitions.get(id); assert.ok(definition, id);
    const exports = {}; modules.set(id, exports);
    definition.factory(...definition.dependencies.map(dep => dep === 'exports' ? exports : dep === 'require' ? load : load(dep)));
    return exports;
}
const content = JSON.parse(fs.readFileSync(`${__dirname}/../../../../gestion22-ai-api/data/module1.json`, 'utf8'));
test('Moodle module1 AMD entry and every dependency resolve', () => {
    assert.equal(typeof load('local_gestion22tutor/module1').init, 'function');
    assert.ok(fs.existsSync(`${__dirname}/../amd/build/module1.min.js.map`));
});
test('runtime rejects malformed module content and invented timestamps', () => {
    const {isConfig} = load('local_gestion22tutor/module1/types');
    const config = {containerId: 'module', courseid: 2, preview: true, storageKey: 'test', content};
    assert.ok(isConfig(config));
    assert.equal(isConfig({...config, content: {...content, layers: [{}]}}), false);
    assert.equal(isConfig({...config, content: {...content, videos: [{...content.videos[0], segments: [{atSeconds: -1, activityId: 'case'}]}]}}), false);
    assert.ok(content.videos.every(video => video.segments.length === 0));
});
test('only 80% of unique played ranges completes a video; seeking and replays do not add coverage', () => {
    const {Progress} = load('local_gestion22tutor/module1/progress');
    const progress = new Progress('progress-test', content);
    assert.equal(progress.summary().percent, 0);
    progress.video('video1', {percent: 100}); assert.equal(progress.summary().videos, 0);
    progress.video('video1', {completed: true}); assert.equal(progress.summary().videos, 0);
    progress.video('video1', {started: true, duration: 100, watched: [[0, 40], [90, 100]]});
    assert.equal(progress.videoState('video1').percent, 50);
    progress.video('video1', {duration: 100, watched: [[0, 40], [0, 30], [35, 60]]});
    assert.equal(progress.videoState('video1').percent, 70);
    progress.video('video1', {duration: 100, watched: [[60, 69.99]]});
    assert.equal(progress.videoState('video1').completed, false);
    progress.video('video1', {duration: 100, watched: [[60, 70]]});
    assert.equal(progress.videoState('video1').completed, true);
    assert.equal(progress.summary().videos, 1);
    progress.answered(content.quiz[0].id); progress.answered(content.quiz[0].id); progress.answered('not-a-question');
    assert.equal(progress.summary().answered, 1);
    const restored = new Progress('progress-test', content); assert.equal(restored.summary().videos, 1);
    assert.deepEqual(Object.keys(JSON.parse(storage.get('progress-test'))).sort(), ['activities', 'questions', 'version', 'videos']);
});

test('legacy completion is cleared while exercise progress survives the new video rule', () => {
    const {Progress, mergeWatched} = load('local_gestion22tutor/module1/progress');
    storage.set('legacy', JSON.stringify({version: 1, videos: {video1: {started: true, completed: true,
        selfReported: true, percent: 100}}, activities: {anatomy: 'completed'}, questions: [content.quiz[0].id]}));
    const restored = new Progress('legacy', content);
    assert.equal(restored.summary().videos, 0);
    assert.equal(restored.activityState('anatomy'), 'completed');
    assert.equal(restored.summary().answered, 1);
    assert.equal(mergeWatched([[0, 0], [20, 10], [0, Infinity], ['0', 100]], 100).length, 0);
    assert.equal(mergeWatched([[0, 100]], NaN).length, 0);
    restored.reset(); assert.equal(restored.summary().percent, 0);
});
