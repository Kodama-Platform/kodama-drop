export type NoteTemplate = {
  id: string;
  label: string;
  description: string;
  markdown: string;
};

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "blank",
    label: "Blank",
    description: "Empty sheet",
    markdown: "",
  },
  {
    id: "meeting",
    label: "Meeting notes",
    description: "Agenda, notes, and actions",
    markdown: `# Meeting notes

**Date:**
**Attendees:**

## Agenda
- Topic

## Notes
- 

## Action items
- [ ] Follow up
`,
  },
  {
    id: "journal",
    label: "Daily journal",
    description: "Intentions and reflection",
    markdown: `# Daily journal

## Today
- 

## Wins
- 

## Tomorrow
- [ ] Next step
`,
  },
  {
    id: "checklist",
    label: "Checklist",
    description: "Simple task list",
    markdown: `# Checklist

- [ ] First item
- [ ] Second item
- [ ] Third item
`,
  },
  {
    id: "decision",
    label: "Decision log",
    description: "Context, options, and outcome",
    markdown: `# Decision

## Context


## Options
1. 
2. 

## Decision


## Follow-up
- [ ] Next action
`,
  },
];

export function getNoteTemplate(id: string): NoteTemplate | undefined {
  return NOTE_TEMPLATES.find((t) => t.id === id);
}
