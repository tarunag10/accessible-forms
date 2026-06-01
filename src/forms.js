const complexFieldTypes = new Set(['date', 'file', 'textarea', 'address', 'postcode', 'tel']);
const groupedFieldTypes = new Set(['checkbox', 'radio']);

export function validateFormSpec(spec) {
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

export function assessFormReadiness(form) {
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

export function filterForms(forms, filters = {}) {
  const topic = filters.topic && filters.topic !== 'all' ? filters.topic : null;
  const complexity = filters.complexity && filters.complexity !== 'all' ? filters.complexity : null;

  return forms.filter((form) => {
    const matchesTopic = !topic || form.topic === topic;
    const matchesComplexity = !complexity || form.complexity === complexity;
    return matchesTopic && matchesComplexity;
  });
}

export const exampleForms = [
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
