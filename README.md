# Accessible Public Forms

Accessible GOV.UK-style public-service form examples for civic and advice workflows.

## Included examples

- Council housing repair request
- Benefits evidence upload
- Freedom Pass issue report
- Social care callback request
- Exam adjustment request

Each example is static and browser-only. The demo renders realistic labels, hints, required-field error text, fieldsets, legends, and local-only preview buttons without sending data anywhere.

## Validation and review tools

`src/forms.js` exports `validateFormSpec(spec)`, which checks for:

- missing field IDs or visible labels
- missing error text for required fields
- missing hints on complex fields such as uploads, dates, telephone numbers, addresses, and textareas
- missing fieldset and legend text for grouped radio or checkbox controls

The repository also includes:

- `assessFormReadiness(form)`: returns a percentage score, pass/review checklist, status, and issues for each form
- `filterForms(forms, { topic, complexity })`: filters static form specs by public-service topic and complexity
- demo filters for topic and complexity, with per-form readiness issues shown in expandable details
- `createFormExport(form)`: returns a reusable JSON form schema, safe filename, and formatted JSON string
- `safeFormFilename(title)`: creates download-safe `.json` filenames from form titles
- `serializeSavedNotes(notes)` and `parseSavedNotes(value)`: localStorage-safe review note helpers
- per-form `Copy spec`, `Download JSON`, and local review note controls in the static demo

## Demo

Open `index.html` in a browser. This repository is intentionally no-backend and keeps user data local to the browser.

## Open-source basics

- Code: MIT licence
- Content/templates: use with attribution under CC BY 4.0 where marked
- Accessibility target: WCAG 2.2 AA
- Contributions: start with issues labelled `good first issue`

## Safety note

This project provides information and drafting support, not legal advice. Users should check deadlines, local rules, and professional advice where needed.
