import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {LearningSchema, loadModule1Content, module1Instruction} from '../src/module1-context.js';

test('learning activity whitelist and concept association are enforced', () => {
  assert.ok(LearningSchema.safeParse({activityId: 'anatomy', concept: 'anatomy'}).success);
  assert.ok(!LearningSchema.safeParse({activityId: 'anatomy', concept: 'case'}).success);
  assert.ok(!LearningSchema.safeParse({activityId: 'unknown', concept: 'unknown'}).success);
});
test('module fragments are scoped to the explicitly bound course and requested activity', () => {
  const content = loadModule1Content(process.env.MODULE1_CONTENT_FILE ?? fileURLToPath(new URL('../data/module1.json', import.meta.url)));
  assert.ok(content);
  assert.match(module1Instruction(content, content.contextId, 'anatomy'), /Queratinocitos|queratinocitos/);
  assert.ok(!module1Instruction(content, 'different-course', 'anatomy').includes('Queratinocitos'));
  assert.match(module1Instruction(content, content.contextId, undefined), /Manejo del neonato/);
  assert.match(module1Instruction(content, content.contextId, undefined), /80%/);
  assert.ok(!module1Instruction(content, 'different-course', undefined).includes('Manejo del neonato'));
  assert.match(module1Instruction(content, content.contextId, 'case'), /predefinidas/);
});
