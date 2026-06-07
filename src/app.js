// ===== src/theme.js =====
const __m1__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_accessible_forms_src_theme_js = (() => {
// <app>/src/theme.js

function readStored() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    /* private mode: theme still applies for this session */
  }
}

function apply(theme, toggle) {
  document.documentElement.setAttribute('data-theme', theme);
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    toggle.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
  }
}

function initTheme(toggleSelector = '#theme-toggle') {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const toggle = document.querySelector(toggleSelector);
  let theme = resolveInitialTheme({ stored: readStored(), prefersDark });
  apply(theme, toggle);

  toggle?.addEventListener('click', () => {
    theme = nextTheme(theme);
    apply(theme, toggle);
    writeStored(theme);
  });
}

return { initTheme };
})();

// ===== ../shared/theme/index.mjs =====
const __m2__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_shared_theme_index_mjs = (() => {
// shared/theme/index.mjs
const THEME_STORAGE_KEY = 'open-access-uk:theme';

const VALID = new Set(['light', 'dark']);

function resolveInitialTheme({ stored, prefersDark } = {}) {
  if (VALID.has(stored)) return stored;
  return prefersDark ? 'dark' : 'light';
}

function nextTheme(current) {
  return current === 'dark' ? 'light' : 'dark';
}

return { THEME_STORAGE_KEY, resolveInitialTheme, nextTheme };
})();

// ===== src/forms.js =====
const __m3__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_accessible_forms_src_forms_js = (() => {
const complexFieldTypes = new Set(['date', 'file', 'textarea', 'address', 'postcode', 'tel']);
const groupedFieldTypes = new Set(['checkbox', 'radio']);

function validateFormSpec(spec) {
  const issues = [];

  for (const field of spec.fields || []) {
    const name = field.id || 'unknown';

    if (!field.id) issues.push('Every field needs an id.');
    if (!field.label) issues.push(`Field ${name} needs a visible label.`);
    if (field.required && !field.error) issues.push(`Required field ${name} needs error text.`);
    if (complexFieldTypes.has(field.type) && !field.hint) issues.push(`Field ${name} needs hint text for the expected format or evidence.`);
    if (groupedFieldTypes.has(field.type) && (!field.fieldset || !field.legend)) {
      issues.push(`Field ${name} needs fieldset and legend text for grouped controls.`);
    }
  }

  return { valid: issues.length === 0, issues };
}

const readinessChecks = [
  {
    key: 'visible-labels',
    label: 'Every field has a stable id and visible label.',
    test: (form) => (form.fields || []).every((field) => field.id && field.label)
  },
  {
    key: 'required-errors',
    label: 'Required fields include clear error text.',
    test: (form) => (form.fields || []).every((field) => !field.required || field.error)
  },
  {
    key: 'complex-hints',
    label: 'Complex fields explain format, evidence, or contact expectations.',
    test: (form) => (form.fields || []).every((field) => !complexFieldTypes.has(field.type) || field.hint)
  },
  {
    key: 'grouped-controls',
    label: 'Radio and checkbox groups use fieldsets and legends.',
    test: (form) => (form.fields || []).every((field) => !groupedFieldTypes.has(field.type) || (field.fieldset && field.legend))
  },
  {
    key: 'plain-language',
    label: 'The form has a plain-English title and description.',
    test: (form) => Boolean(form.title && form.description)
  }
];

const currentGuidance = [
  {
    title: 'WCAG 2.2 AA is the public-sector benchmark',
    detail: 'GOV.UK accessibility guidance says public sector websites and apps should meet WCAG 2.2 level AA unless a valid exception applies, and publish an accessibility statement.',
    source: 'GOV.UK accessibility requirements',
    url: 'https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps'
  },
  {
    title: 'Errors need a page-level summary and field-level messages',
    detail: 'The GOV.UK Design System error summary pattern says to show an error summary at the top of the page and an error message next to each affected answer.',
    source: 'GOV.UK Design System error summary',
    url: 'https://design-system.service.gov.uk/components/error-summary/'
  },
  {
    title: 'Accessible formats should not be online-only',
    detail: 'Government inclusive communication guidance notes that online-only information can exclude people, and alternative formats such as Easy Read, large print, audio and Braille may be needed.',
    source: 'GOV.UK accessible communication formats',
    url: 'https://www.gov.uk/government/publications/inclusive-communication/accessible-communication-formats/'
  }
];

function assessFormReadiness(form) {
  const validation = validateFormSpec(form);
  const checklist = readinessChecks.map((check) => ({
    key: check.key,
    label: check.label,
    passed: check.test(form)
  }));
  const passed = checklist.filter((item) => item.passed).length;
  const score = Math.round((passed / checklist.length) * 100);

  return {
    score,
    status: score === 100 ? 'Ready to reuse' : score >= 80 ? 'Nearly ready' : 'Needs review',
    checklist,
    issues: validation.issues
  };
}

function remediationItemsForField(field = {}) {
  const name = field.id || field.label || 'unknown field';
  const items = [];

  if (!field.id || !field.label) {
    items.push({
      severity: 'critical',
      category: 'Labels',
      action: `Add a stable id and visible label for ${name}.`,
      evidence: 'WCAG 2.2: labels and instructions; browser autofill and error linking need stable controls.'
    });
  }

  if (field.required && !field.error) {
    items.push({
      severity: 'critical',
      category: 'Validation',
      action: `Add clear error text for ${name} and link it with aria-describedby.`,
      evidence: 'Required fields need recovery text that names the problem and the expected correction.'
    });
  }

  if (complexFieldTypes.has(field.type) && !field.hint) {
    items.push({
      severity: 'warning',
      category: 'Guidance',
      action: `Add hint text for ${name} explaining format, evidence, or contact expectations.`,
      evidence: 'Complex inputs are easier to complete when the format and fallback route are available before submission.'
    });
  }

  if (groupedFieldTypes.has(field.type) && (!field.fieldset || !field.legend)) {
    items.push({
      severity: 'critical',
      category: 'Semantics',
      action: `Wrap ${name} in a fieldset with a descriptive legend.`,
      evidence: 'Grouped radio and checkbox controls need a programmatic question so screen-reader users hear the context.'
    });
  }

  return items;
}

function remediationItemsForForm(form = {}) {
  const items = (form.fields || []).flatMap(remediationItemsForField);

  if (!form.title || !form.description) {
    items.push({
      severity: 'warning',
      category: 'Plain language',
      action: 'Add a plain-English title and description before reuse.',
      evidence: 'Users should understand the service, eligibility, and purpose before they start adding personal data.'
    });
  }

  return items;
}

function severityLabel(severity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function formatRemediationMarkdown(title, readiness, groups) {
  const lines = [
    `# ${title}`,
    '',
    `Readiness score: ${readiness.score}% (${readiness.status})`,
    ''
  ];

  if (!groups.length) {
    lines.push('No remediation actions found. Keep evidence of keyboard, screen-reader, and validation checks with the reused form.');
    return `${lines.join('\n')}\n`;
  }

  for (const group of groups) {
    lines.push(`## ${severityLabel(group.severity)}`);
    for (const item of group.items) {
      lines.push(`- [ ] **${item.category}**: ${item.action}`);
      lines.push(`  Evidence: ${item.evidence}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function formatRemediationPlain(title, readiness, groups) {
  const lines = [
    title,
    `Readiness score: ${readiness.score}% (${readiness.status})`,
    ''
  ];

  if (!groups.length) {
    lines.push('No remediation actions found. Keep evidence of keyboard, screen-reader, and validation checks with the reused form.');
    return `${lines.join('\n')}\n`;
  }

  for (const group of groups) {
    lines.push(severityLabel(group.severity));
    group.items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.category}: ${item.action}`);
      lines.push(`   Evidence: ${item.evidence}`);
    });
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function createRemediationReport(form = {}) {
  const readiness = assessFormReadiness(form);
  const severityOrder = ['critical', 'warning'];
  const title = `${form.title || 'Form'} remediation report`;
  const items = remediationItemsForForm(form);
  const groups = severityOrder
    .map((severity) => ({
      severity,
      items: items.filter((item) => item.severity === severity)
    }))
    .filter((group) => group.items.length);

  return {
    title,
    readiness,
    groups,
    markdown: formatRemediationMarkdown(title, readiness, groups),
    plain: formatRemediationPlain(title, readiness, groups)
  };
}

function filterForms(forms, filters = {}) {
  const topic = filters.topic && filters.topic !== 'all' ? filters.topic : null;
  const complexity = filters.complexity && filters.complexity !== 'all' ? filters.complexity : null;

  return forms.filter((form) => {
    const matchesTopic = !topic || form.topic === topic;
    const matchesComplexity = !complexity || form.complexity === complexity;
    return matchesTopic && matchesComplexity;
  });
}

function safeFormFilename(title = 'form-spec') {
  const slug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${slug || 'form-spec'}.json`;
}

function createFormExport(form) {
  const spec = {
    schemaVersion: 'open-access-uk.form.v1',
    title: form.title,
    description: form.description,
    topic: form.topic,
    complexity: form.complexity,
    fields: (form.fields || []).map((field) => ({ ...field }))
  };

  return {
    filename: safeFormFilename(form.title),
    spec,
    json: `${JSON.stringify(spec, null, 2)}\n`
  };
}

function createFormImplementationPack(form = {}) {
  const exported = createFormExport(form);
  const remediation = createRemediationReport(form);

  return {
    title: `${form.title || 'Form'} implementation pack`,
    markdown: [
      `# ${form.title || 'Form'} implementation pack`,
      '',
      'Generated locally in the browser. Nothing was sent to a server.',
      '',
      '## Readiness',
      `Score: ${remediation.readiness.score}%`,
      `Status: ${remediation.readiness.status}`,
      '',
      '## Remediation report',
      remediation.markdown.trim(),
      '',
      '## Implementation QA',
      '- [ ] Test keyboard-only completion.',
      '- [ ] Confirm visible labels, hints, and required-field error recovery.',
      '- [ ] Check grouped radio and checkbox controls with a screen reader.',
      '- [ ] Save evidence of contrast, focus, and validation checks.',
      '- [ ] Check against current WCAG 2.2 AA and public-sector accessibility statement expectations where applicable.',
      '',
      '## Current source notes',
      ...currentGuidance.map((item) => `- ${item.title}: ${item.detail} Source: ${item.url}`),
      '',
      '## JSON form spec',
      '```json',
      exported.json.trim(),
      '```'
    ].join('\n')
  };
}

function formatLocalActionPackMarkdown(title, readiness, sections) {
  const lines = [
    `# ${title}`,
    '',
    'Generated locally in the browser. Nothing was sent to a server.',
    '',
    `Readiness: ${readiness.score}% (${readiness.status})`,
    ''
  ];

  for (const section of sections) {
    lines.push(`## ${section.heading}`);
    section.items.forEach((item) => lines.push(`- [ ] ${item}`));
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function createLocalActionPack(form = {}, reviewNotes = '') {
  const remediation = createRemediationReport(form);
  const readiness = remediation.readiness;
  const priorityActions = remediation.groups.flatMap((group) => group.items.map((item) => item.action));
  const notes = typeof reviewNotes === 'string' ? reviewNotes.trim() : '';
  const beforePublishing = priorityActions.length
    ? priorityActions.slice(0, 5)
    : ['Keep the current labels, hints, grouped-control semantics, and error recovery with the reused form.'];
  const title = `${form.title || 'Form'} local action pack`;
  const sections = [
    {
      heading: 'Before publishing',
      items: beforePublishing
    },
    {
      heading: 'Local handoff',
      items: [
        'Service owner: confirm eligibility wording, offline route, and any regulated-advice boundary.',
        'Content or design reviewer: check plain-English labels, hint text, and error recovery with a real local scenario.',
        'Developer: connect exported JSON to the service route without removing labels, legends, hints, or aria-describedby links.',
        notes ? `Local review notes: ${notes}` : 'Local review notes: add the team-specific owner, deadline, and fallback contact before handoff.'
      ]
    },
    {
      heading: 'Review evidence',
      items: [
        'Keyboard-only completion from first field to final action.',
        'Screen-reader check for grouped choices, required errors, and complex-field hint text.',
        'Evidence that non-digital, phone, or adviser-assisted routes are available where the form collects important documents.'
      ]
    }
  ];

  return {
    title,
    readiness,
    sections,
    markdown: formatLocalActionPackMarkdown(title, readiness, sections)
  };
}

function serializeSavedNotes(notes = {}) {
  const safeNotes = Object.fromEntries(
    Object.entries(notes)
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([key, value]) => [key, value.trim()])
  );

  return JSON.stringify(safeNotes);
}

function parseSavedNotes(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, note]) => typeof note === 'string' && note.trim())
    );
  } catch {
    return {};
  }
}

const exampleForms = [
  {
    title: 'Council housing repair request',
    description: 'For tenants reporting hazards, damp, heating failures, or essential repairs to a council or housing association.',
    topic: 'housing',
    complexity: 'standard',
    fields: [
      {
        id: 'repair-summary',
        label: 'What needs repairing?',
        type: 'textarea',
        required: true,
        hint: 'Include the room, how long it has been happening, and whether it is getting worse.',
        error: 'Describe the repair needed.'
      },
      {
        id: 'hazard-risk',
        label: 'Is there an immediate health or safety risk?',
        type: 'radio',
        fieldset: true,
        legend: 'Immediate risk',
        required: true,
        error: 'Choose whether there is an immediate risk.',
        options: ['Yes, urgent risk', 'No immediate risk', 'Not sure']
      },
      {
        id: 'access-notes',
        label: 'Access notes for the repair team',
        type: 'textarea',
        hint: 'For example, step-free access, preferred visit times, interpreter needs, or communication format.',
        required: false
      }
    ]
  },
  {
    title: 'Benefits evidence upload',
    description: 'A simple evidence hand-in pattern for benefit reviews, discretionary housing payments, or council tax support.',
    topic: 'benefits',
    complexity: 'standard',
    fields: [
      {
        id: 'claim-reference',
        label: 'Claim or case reference',
        type: 'text',
        required: true,
        error: 'Enter the claim or case reference.'
      },
      {
        id: 'evidence-type',
        label: 'What type of evidence are you sending?',
        type: 'radio',
        fieldset: true,
        legend: 'Evidence type',
        required: true,
        error: 'Choose an evidence type.',
        options: ['Bank statement', 'Rent proof', 'Medical evidence', 'Other supporting document']
      },
      {
        id: 'evidence-file',
        label: 'Upload evidence',
        type: 'file',
        required: true,
        hint: 'Accepted formats: PDF, JPG, PNG, or DOCX. Maximum 10 MB per file.',
        error: 'Upload at least one evidence file.'
      }
    ]
  },
  {
    title: 'Freedom Pass issue report',
    description: 'For residents reporting a lost, stolen, damaged, or non-working older person or disabled person Freedom Pass.',
    topic: 'transport',
    complexity: 'standard',
    fields: [
      {
        id: 'pass-holder-name',
        label: 'Pass holder full name',
        type: 'text',
        required: true,
        error: 'Enter the pass holder full name.'
      },
      {
        id: 'pass-issue',
        label: 'What happened to the pass?',
        type: 'radio',
        fieldset: true,
        legend: 'Freedom Pass issue',
        required: true,
        error: 'Choose the issue with the pass.',
        options: ['Lost', 'Stolen', 'Damaged', 'Card not working']
      },
      {
        id: 'replacement-address',
        label: 'Postal address for updates or replacement',
        type: 'address',
        required: true,
        hint: 'Use the address currently linked to the pass if you know it.',
        error: 'Enter a postal address.'
      }
    ]
  },
  {
    title: 'Social care callback request',
    description: 'A low-friction callback form for people who need help from adult social care, a carer team, or an advice worker.',
    topic: 'social-care',
    complexity: 'complex',
    fields: [
      {
        id: 'caller-name',
        label: 'Your name',
        type: 'text',
        required: true,
        error: 'Enter your name.'
      },
      {
        id: 'callback-number',
        label: 'Phone number for the callback',
        type: 'tel',
        required: true,
        hint: 'Include the full number. Say in the notes if voicemail is not safe.',
        error: 'Enter a phone number.'
      },
      {
        id: 'best-time',
        label: 'Best time to call',
        type: 'checkbox',
        fieldset: true,
        legend: 'Callback time',
        required: true,
        error: 'Choose at least one callback time.',
        options: ['Morning', 'Afternoon', 'Evening', 'Any time']
      },
      {
        id: 'communication-needs',
        label: 'Communication or accessibility needs',
        type: 'textarea',
        hint: 'For example, BSL, language interpreter, easy read, advocate present, or text relay.',
        required: false
      }
    ]
  },
  {
    title: 'Exam adjustment request',
    description: 'For learners requesting reasonable adjustments, exam access arrangements, or temporary support after illness or injury.',
    topic: 'education',
    complexity: 'complex',
    fields: [
      {
        id: 'course-name',
        label: 'Course, module, or exam name',
        type: 'text',
        required: true,
        error: 'Enter the course, module, or exam name.'
      },
      {
        id: 'exam-date',
        label: 'Exam date',
        type: 'date',
        required: true,
        hint: 'Use the date shown on your timetable. If there is more than one date, add the first date and explain below.',
        error: 'Enter the exam date.'
      },
      {
        id: 'adjustments',
        label: 'Adjustment requested',
        type: 'checkbox',
        fieldset: true,
        legend: 'Requested adjustments',
        required: true,
        error: 'Choose at least one requested adjustment.',
        options: ['Extra time', 'Separate room', 'Rest breaks', 'Assistive technology', 'Alternative format']
      },
      {
        id: 'supporting-evidence',
        label: 'Supporting evidence',
        type: 'file',
        required: false,
        hint: 'Upload evidence if you have it. You can still submit the request and provide evidence later.'
      }
    ]
  }
];

return { validateFormSpec, currentGuidance, assessFormReadiness, createRemediationReport, filterForms, safeFormFilename, createFormExport, createFormImplementationPack, createLocalActionPack, serializeSavedNotes, parseSavedNotes, exampleForms };
})();

// ===== generated dependency bindings =====

const { initTheme: initTheme } = __m1__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_accessible_forms_src_theme_js;

const { THEME_STORAGE_KEY: THEME_STORAGE_KEY, resolveInitialTheme: resolveInitialTheme, nextTheme: nextTheme } = __m2__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_shared_theme_index_mjs;

const { validateFormSpec: validateFormSpec, currentGuidance: currentGuidance, assessFormReadiness: assessFormReadiness, createRemediationReport: createRemediationReport, filterForms: filterForms, safeFormFilename: safeFormFilename, createFormExport: createFormExport, createFormImplementationPack: createFormImplementationPack, createLocalActionPack: createLocalActionPack, serializeSavedNotes: serializeSavedNotes, parseSavedNotes: parseSavedNotes, exampleForms: exampleForms } = __m3__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_accessible_forms_src_forms_js;

// ===== src/app.js =====
// ===== src/app.js =====

// ===== src/app.js =====

// ===== src/app.js =====


const mount = document.querySelector('#forms');
const filtersMount = document.querySelector('#form-filters');
const currentGuidanceMount = document.querySelector('#current-guidance');
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
      <button type="button" class="secondary copy-implementation-pack" data-form-title="${escapeHtml(form.title)}">Copy implementation pack</button>
      <button type="button" class="secondary copy-local-action-pack" data-form-title="${escapeHtml(form.title)}">Copy local action pack</button>
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

function renderCurrentGuidance() {
  if (!currentGuidanceMount) return;
  currentGuidanceMount.innerHTML = currentGuidance.map((item) => `<article class="card">
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.detail)}</p>
    <a href="${escapeHtml(item.url)}" rel="noreferrer">${escapeHtml(item.source)}</a>
  </article>`).join('');
}

renderFilters();
renderForms();
renderCurrentGuidance();
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
  const packButton = event.target.closest('.copy-implementation-pack');
  const actionPackButton = event.target.closest('.copy-local-action-pack');
  const downloadButton = event.target.closest('.download-spec');
  const button = copyButton || reportButton || packButton || actionPackButton || downloadButton;
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
  } else if (packButton) {
    await copyText(createFormImplementationPack(form).markdown);
    packButton.textContent = 'Copied';
  } else if (actionPackButton) {
    await copyText(createLocalActionPack(form, savedNotes[form.title]).markdown);
    actionPackButton.textContent = 'Copied';
  } else {
    downloadJson(exported.filename, exported.json);
  }
});

initTheme('#theme-toggle');

const linterMount = document.querySelector('#linter');

function renderLinter() {
  if (!linterMount) return;
  const topic = document.querySelector('#topic-filter')?.value || 'all';
  const complexity = document.querySelector('#complexity-filter')?.value || 'all';
  const filtered = filterForms(exampleForms, { topic, complexity });
  const rows = filtered.map((form) => {
    const readiness = assessFormReadiness(form);
    const issues = readiness.issues.length ? readiness.issues.join('; ') : 'No blocking accessibility issues found.';
    return `<li><strong>${escapeHtml(form.title)} — ${readiness.score}%:</strong> ${escapeHtml(issues)}</li>`;
  });
  linterMount.innerHTML = `<h2>Accessibility linter</h2><ul>${rows.join('')}</ul>`;
}

renderLinter();
filtersMount.addEventListener('change', renderLinter);

const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('#primary-nav');
navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  primaryNav?.classList.toggle('is-open', open);
});
