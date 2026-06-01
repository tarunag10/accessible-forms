import {
  assessFormReadiness,
  createFormExport,
  createRemediationReport,
  exampleForms,
  filterForms,
  parseSavedNotes,
  serializeSavedNotes
} from './forms.js';

const mount = document.querySelector('#forms');
const filtersMount = document.querySelector('#form-filters');
const notesStorageKey = 'open-access-uk.form-review-notes';
let savedNotes = loadSavedNotes();

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function renderField(field) {
  const hint = field.hint ? `<p class="hint" id="${field.id}-hint">${escapeHtml(field.hint)}</p>` : '';
  const error = field.error ? `<p class="error" id="${field.id}-error">${escapeHtml(field.error)}</p>` : '';
  const describedBy = [field.hint && `${field.id}-hint`, field.error && `${field.id}-error`].filter(Boolean).join(' ');
  const required = field.required ? ' required aria-required="true"' : '';
  const ariaDescribedBy = describedBy ? ` aria-describedby="${describedBy}"` : '';

  if (field.type === 'radio' || field.type === 'checkbox') {
    return `<fieldset class="field-group" aria-describedby="${field.id}-error">
      <legend>${escapeHtml(field.legend || field.label)}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</legend>
      ${error}
      <div class="choices">
        ${(field.options || []).map((option, index) => {
          const optionId = `${field.id}-${index}`;
          return `<label class="choice" for="${optionId}"><input id="${optionId}" name="${field.id}" type="${field.type}"${required}>${escapeHtml(option)}</label>`;
        }).join('')}
      </div>
    </fieldset>`;
  }

  if (field.type === 'textarea' || field.type === 'address') {
    return `<div class="field">
      <label for="${field.id}">${escapeHtml(field.label)}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label>
      ${hint}${error}
      <textarea id="${field.id}" name="${field.id}"${required}${ariaDescribedBy}></textarea>
    </div>`;
  }

  return `<div class="field">
    <label for="${field.id}">${escapeHtml(field.label)}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label>
    ${hint}${error}
    <input id="${field.id}" name="${field.id}" type="${field.type}"${required}${ariaDescribedBy}>
  </div>`;
}

function renderForm(form) {
  const readiness = assessFormReadiness(form);
  const remediation = createRemediationReport(form);
  const noteId = `notes-${form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return `<article class="card form-card">
    <div class="card-header">
      <div>
        <h2>${escapeHtml(form.title)}</h2>
        <p>${escapeHtml(form.description)}</p>
      </div>
      <p class="tag">${readiness.score}% ${readiness.status}</p>
    </div>
    <dl class="meta-list">
      <div><dt>Topic</dt><dd>${escapeHtml(form.topic)}</dd></div>
      <div><dt>Complexity</dt><dd>${escapeHtml(form.complexity)}</dd></div>
    </dl>
    <form novalidate>
      ${form.fields.map(renderField).join('')}
      <button type="button">Preview local submission</button>
    </form>
    <div class="export-actions" aria-label="Export ${escapeHtml(form.title)} spec">
      <button type="button" class="secondary copy-spec" data-form-title="${escapeHtml(form.title)}">Copy spec</button>
      <button type="button" class="secondary copy-report" data-form-title="${escapeHtml(form.title)}">Copy remediation report</button>
      <button type="button" class="secondary download-spec" data-form-title="${escapeHtml(form.title)}">Download JSON</button>
    </div>
    <div class="review-notes">
      <label for="${noteId}">Review notes</label>
      <textarea id="${noteId}" data-note-title="${escapeHtml(form.title)}" placeholder="Add local notes before reusing this form.">${escapeHtml(savedNotes[form.title] || '')}</textarea>
    </div>
    <details>
      <summary>Readiness checklist and issues</summary>
      <ul>
        ${readiness.checklist.map((item) => `<li><strong>${item.passed ? 'Pass' : 'Review'}:</strong> ${escapeHtml(item.label)}</li>`).join('')}
      </ul>
      ${readiness.issues.length ? `<h3>Issues to fix</h3><ul>${readiness.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join('')}</ul>` : '<p>Visible labels, hints, errors, and grouped-control semantics are present.</p>'}
    </details>
    <details>
      <summary>Remediation report preview</summary>
      ${remediation.groups.length ? remediation.groups.map((group) => `<section class="report-group" aria-label="${escapeHtml(group.severity)} remediation actions">
        <h3>${escapeHtml(group.severity.charAt(0).toUpperCase() + group.severity.slice(1))}</h3>
        <ul>
          ${group.items.map((item) => `<li><strong>${escapeHtml(item.category)}:</strong> ${escapeHtml(item.action)} <span class="hint">${escapeHtml(item.evidence)}</span></li>`).join('')}
        </ul>
      </section>`).join('') : '<p>No remediation actions found. Keep test evidence with the reused form.</p>'}
    </details>
  </article>`;
}

function loadSavedNotes() {
  try {
    return parseSavedNotes(localStorage.getItem(notesStorageKey));
  } catch {
    return {};
  }
}

function saveNotes() {
  try {
    localStorage.setItem(notesStorageKey, serializeSavedNotes(savedNotes));
  } catch {
    // Local notes are best-effort when private browsing or storage policy blocks writes.
  }
}

function findForm(title) {
  return exampleForms.find((form) => form.title === title);
}

function downloadJson(filename, json) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.left = '-9999px';
  document.body.append(field);
  field.select();
  document.execCommand('copy');
  field.remove();
}

function renderFilters() {
  const topics = ['all', ...new Set(exampleForms.map((form) => form.topic))];
  const complexities = ['all', ...new Set(exampleForms.map((form) => form.complexity))];

  filtersMount.innerHTML = `<div class="filter-row">
    <label for="topic-filter">Topic</label>
    <select id="topic-filter" name="topic-filter">
      ${topics.map((topic) => `<option value="${topic}">${escapeHtml(topic === 'all' ? 'All topics' : topic)}</option>`).join('')}
    </select>
    <label for="complexity-filter">Complexity</label>
    <select id="complexity-filter" name="complexity-filter">
      ${complexities.map((complexity) => `<option value="${complexity}">${escapeHtml(complexity === 'all' ? 'All complexity levels' : complexity)}</option>`).join('')}
    </select>
  </div>`;
}

function renderForms() {
  const topic = document.querySelector('#topic-filter')?.value || 'all';
  const complexity = document.querySelector('#complexity-filter')?.value || 'all';
  const filtered = filterForms(exampleForms, { topic, complexity });
  mount.innerHTML = filtered.length
    ? filtered.map(renderForm).join('')
    : '<p class="panel">No forms match these filters.</p>';
}

renderFilters();
renderForms();
filtersMount.addEventListener('change', renderForms);
mount.addEventListener('input', (event) => {
  const notesField = event.target.closest('[data-note-title]');
  if (!notesField) return;

  savedNotes = { ...savedNotes, [notesField.dataset.noteTitle]: notesField.value };
  saveNotes();
});

mount.addEventListener('click', async (event) => {
  const copyButton = event.target.closest('.copy-spec');
  const reportButton = event.target.closest('.copy-report');
  const downloadButton = event.target.closest('.download-spec');
  const button = copyButton || reportButton || downloadButton;
  if (!button) return;

  const form = findForm(button.dataset.formTitle);
  if (!form) return;

  const exported = createFormExport(form);
  if (copyButton) {
    await copyText(exported.json);
    copyButton.textContent = 'Copied';
  } else if (reportButton) {
    await copyText(createRemediationReport(form).markdown);
    reportButton.textContent = 'Copied';
  } else {
    downloadJson(exported.filename, exported.json);
  }
});
