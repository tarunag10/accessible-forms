import { assessFormReadiness, exampleForms, filterForms } from './forms.js';

const mount = document.querySelector('#forms');
const filtersMount = document.querySelector('#form-filters');

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
    <details>
      <summary>Readiness checklist and issues</summary>
      <ul>
        ${readiness.checklist.map((item) => `<li><strong>${item.passed ? 'Pass' : 'Review'}:</strong> ${escapeHtml(item.label)}</li>`).join('')}
      </ul>
      ${readiness.issues.length ? `<h3>Issues to fix</h3><ul>${readiness.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join('')}</ul>` : '<p>Visible labels, hints, errors, and grouped-control semantics are present.</p>'}
    </details>
  </article>`;
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
