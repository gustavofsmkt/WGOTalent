---
name: layer-skills
description: >-
  Guides creating or updating layer-* skill files (.claude/skills/layer-*/SKILL.md
  and references/*.md). Load when asked to add a new layer skill, update an
  existing one, standardize skill structure, or verify skill consistency.
  Trigger terms: "create a skill", "update the skill", "add to skill", "skill
  structure", "layer skill", "SKILL.md", "references/*.md", "skill consistency".
---

# Maintain Layer Skills

This skill defines the canonical structure for every `layer-*` skill under `.claude/skills/`. Load it before creating a new layer skill or editing an existing one. Follow the structures and conventions here exactly.

## Skill directory layout

```
.claude/skills/layer-<name>/
  SKILL.md             # layer overview: responsibilities, building blocks, hard rules, workflow
  references/          # one file per artifact the layer owns
    <artifact>.md
    ...
```

Both `SKILL.md` and every `references/*.md` follow fixed structures below. Do not add new section headings; do not rename existing ones.

---

## Structure — SKILL.md

```markdown
---
name: layer-<name>
description: >-
  <One long paragraph used by the skill loader to decide when to invoke this
  skill. Include: what the layer does, file path patterns, trigger terms (both
  Portuguese and English as relevant), and when NOT to load it.>
---

# <Layer Name> Layer

<Two to four sentences: what this layer does, where it sits in the
dependency chain, what it does NOT own.>

## Responsibilities

<Paragraph: what the layer actively does. Then a "Not responsible for:"
line listing items with arrows pointing to the correct layer.>

### Where does it live?

<Bullet list of folder paths with a one-line description of each.>

### Building blocks

<Bullet list — one entry per artifact the layer owns. Each entry:
  - **Name** — one sentence description. See [Reference](references/<file>.md).
Use the same name as the corresponding references/*.md title.>

### Hard rules

<Bullet list mixing positive ("Always X") and negative ("Never Y") rules.
Decision rules that used to live in a separate section go here too.>

---

## Workflow

<One sentence: when to work in this layer. Then a numbered, step-by-step
guide for adding a feature in this layer. Each step references the relevant
reference file where depth is needed.>

---

## References

<One link per file in references/, matching the titles used in SKILL.md
Building blocks. No orphaned or missing links.>
```

---

## Structure — references/\<artifact\>.md

```markdown
# <Artifact Name>

<Two to four sentences: what this artifact is, why it exists, what
problem it solves. No heading — this is the opening paragraph.>

## Responsibilities

<Paragraph: what the artifact does and what it explicitly does NOT do
("Not responsible for: X (→ other layer/artifact)").>

### Where does it live?

<File path pattern(s). Mention abstract base classes or shared files
where relevant.>

### Building blocks

<Bullet list of sub-artifacts that compose this artifact.
  - For atomic artifacts: state "No sub-artifacts." and list related
    artifacts with links instead.
  - For composite artifacts: brief description + link to each sub-artifact's
    reference file if one exists.>

### Structural convention

<How it is shaped: typical class/interface structure, method signatures,
naming conventions. Include a concise code example when one is worth more
than prose. Cross-reference real source files by path at the bottom.>

### Hard rules

<Bullet list: non-negotiable positive ("Always X") and negative
("Never Y") rules specific to this artifact.>

---

## Workflow

<One sentence on when to work with this artifact. Then a numbered,
step-by-step guide for adding/modifying it.>

---

## References

<Links to directly related reference files — same layer or cross-layer
(use relative paths: ../../layer-<other>/references/<file>.md).
Include real source file paths as plain text (not links) for the
"Real implementations" block.>
```

---

## Terminology — locked in

Use these terms consistently across all layer-* skills. Do not introduce synonyms.

| Concept | Use this term | Avoid |
|---|---|---|
| Section: duties | `## Responsibilities` | "Responsabilities", "Duties", "What it does" |
| Section: path | `### Where does it live?` | "Where it lives", "Where it leaves?", "Location" |
| Section: artifacts | `### Building blocks` | "Artifacts", "Components", "When to use each" |
| Section: pattern | `### Structural convention` | "Shape", "Real code conventions", "Pattern" |
| Section: rules | `### Hard rules` | "Rules & conventions", "Anti-patterns", "Decision rules", "Project Rules" |
| Step-by-step | `## Workflow` | "Steps", "Add a use case", "How to" |
| Links | `## References` | "Related", "Real Repository References", "See also" |
| Sub-file separator | `---` before `## Workflow` and before `## References` | nothing, `***` |

---

## Hard rules

- **Never** invent architectural rules not implied by the existing code — flag ambiguities instead.
- **Never** duplicate content between SKILL.md and references/*.md — SKILL.md is the index (one line per artifact), references/*.md hold depth.
- **Every** file in `references/` must be linked from its layer's `SKILL.md` `## References` section and vice versa (no orphaned or missing links).
- **Cross-layer links** in references/*.md use relative paths: `../../layer-<other>/references/<file>.md`.
- **Real source file paths** in references/*.md go under `## References` as plain text ("Real implementations:" block), not as markdown links.
- **Tone**: concise and instructional, written for an AI coding agent — not for human onboarding docs. No padding, no "in conclusion".
- **Code examples**: keep them short (show the pattern, not a full implementation); place under `### Structural convention`.
- **Opening paragraph** of each file replaces the old `## Goal` heading — no `## Goal` section.

---

## Workflow

Load this skill before touching any `layer-*` skill file.

### Creating a new layer skill

1. Create `.claude/skills/layer-<name>/SKILL.md` following the SKILL.md structure above.
2. Create `.claude/skills/layer-<name>/references/` and one `<artifact>.md` per artifact the layer owns, following the reference structure above.
3. Register the skill in the system prompt / CLAUDE.md skill table if the repo uses one.
4. Verify: every reference file is linked from SKILL.md `## References`, and every SKILL.md link points to an existing file.

### Updating an existing layer skill

1. Read the file to update first.
2. Make changes within the existing section headings — do not rename or reorder sections.
3. If adding a new artifact: add one bullet to SKILL.md `### Building blocks`, create `references/<artifact>.md`, add a link in SKILL.md `## References`.
4. If removing an artifact: remove its bullet from `### Building blocks`, delete the reference file, remove its link from `## References`.
5. Verify all links still resolve after the edit.

### Standardizing inconsistent skills (full normalization pass)

Follow the four-pass approach used in the 2026-08 standardization:

1. **Read pass** — read all SKILL.md and references/*.md files before writing anything.
2. **Decide pass** — write out explicit decisions on any terminology or depth inconsistencies before touching files.
3. **Write pass** — rewrite each file applying the locked decisions.
4. **Verify pass** — confirm all internal links resolve and terminology is consistent across all four layers.

---

## References

- Layer skills live under `.agents/skills/layer-*/` (`.claude/skills/` and `.github/skills/` are symlinks to the same directory)