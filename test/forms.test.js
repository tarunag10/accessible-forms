import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessFormReadiness,
  exampleForms,
  filterForms,
  validateFormSpec
} from '../src/forms.js';

test('validates accessible form specs and catches missing labels', () => {
  assert.equal(validateFormSpec({ fields: [{ id: 'name', label: 'Full name', type: 'text' }] }).valid, true);
  assert.equal(validateFormSpec({ fields: [{ id: 'email', type: 'email' }] }).valid, false);
});

test('includes realistic public-service form examples', () => {
  const titles = exampleForms.map((form) => form.title);
  assert.deepEqual(titles, [
    'Council housing repair request',
    'Benefits evidence upload',
    'Freedom Pass issue report',
    'Social care callback request',
    'Exam adjustment request'
  ]);
});

test('flags missing hints for complex fields and grouped controls without fieldsets', () => {
  const result = validateFormSpec({
    fields: [
      { id: 'files', label: 'Upload evidence', type: 'file', required: true, error: 'Upload at least one file.' },
      { id: 'contact', label: 'Contact preference', type: 'radio', required: true, error: 'Choose a contact preference.' }
    ]
  });

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.includes('files needs hint text')));
  assert.ok(result.issues.some((issue) => issue.includes('contact needs fieldset and legend text')));
});

test('computes readiness score and checklist from form accessibility requirements', () => {
  const result = assessFormReadiness({
    title: 'Incomplete evidence form',
    description: 'A deliberately incomplete evidence hand-in form.',
    fields: [
      { id: 'case-ref', label: 'Case reference', type: 'text', required: true },
      { id: 'evidence', label: 'Upload evidence', type: 'file', required: true, error: 'Upload evidence.' }
    ]
  });

  assert.equal(result.score, 60);
  assert.equal(result.status, 'Needs review');
  assert.deepEqual(result.checklist.map((item) => item.key), [
    'visible-labels',
    'required-errors',
    'complex-hints',
    'grouped-controls',
    'plain-language'
  ]);
  assert.equal(result.checklist.find((item) => item.key === 'required-errors').passed, false);
  assert.equal(result.checklist.find((item) => item.key === 'complex-hints').passed, false);
  assert.ok(result.issues.some((issue) => issue.includes('case-ref needs error text')));
});

test('filters forms by topic and complexity', () => {
  assert.deepEqual(filterForms(exampleForms, { topic: 'housing' }).map((form) => form.title), [
    'Council housing repair request'
  ]);
  assert.deepEqual(filterForms(exampleForms, { complexity: 'complex' }).map((form) => form.title), [
    'Social care callback request',
    'Exam adjustment request'
  ]);
  assert.equal(filterForms(exampleForms, { topic: 'benefits', complexity: 'standard' })[0].title, 'Benefits evidence upload');
});
