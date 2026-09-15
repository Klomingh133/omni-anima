---
name: opencode-context-manager
description: Search-first codebase exploration and context management strategy to navigate large repositories efficiently before reading full files.
license: MIT
compatibility: opencode
metadata:
  category: architecture
  focus: context-efficiency
---

# OpenCode Context Manager Skill

This skill enforces a **Search-First, Read-Targeted** methodology for navigating codebases in OpenCode. It prevents context bloat, reduces token waste, avoids hallucinations, and speeds up multi-file workflows.

## Golden Rules: Search-First Workflow

1. **Locate Before Reading**: Never blindly read entire files or speculative directories. Always run targeted searches (`grep`, symbol lookup, or file finders) to find the exact file and line range first.
2. **Read Slices, Not Wholes**: When inspecting large files (>100 lines), request only the specific function, type definition, or component block using start/end line offsets.
3. **Trace Architectural Edges**:
   - Trace imports and exports from entry points (`package.json`, `index.ts`, `app/page.tsx`, `routes.ts`).
   - Use grep to identify all call-sites and consumers of a function before modifying its signature.
4. **Prune Noise from Context**:
   - Immediately exclude generated assets, lockfiles, build outputs, and vendor trees (`node_modules`, `dist`, `.next`, `.git`, `.turbo`, `build`).

---

## Codebase Exploration Workflow

```
1. DISCOVERY    --> List directories & find filenames matching the feature keyword.
2. GREP LOCATE  --> Find exact symbol definitions, hooks, API routes, or handlers.
3. TARGET READ  --> Read only the lines implementing the behavior (StartLine -> EndLine).
4. EDIT SLICE   --> Make precise, surgical modifications.
5. VERIFY       --> Run lint or test specifically covering the modified module.
```

---

## Context Management Patterns

### 1. Ingesting New Features
When asked to add a feature to an existing project:
1. Search for existing similar features to adopt established architectural conventions.
2. Check schemas, types, or models (`types/`, `schema.prisma`, `db/schema.ts`) to understand data shapes.
3. Locate where state is stored (Zustand, Redux, React Context, URL search params).
4. Follow existing conventions for styling (Tailwind classes, CSS modules, design tokens).

### 2. Debugging Errors
When presented with an error stack trace:
1. Jump directly to the file and line indicated in the stack trace.
2. Read 20 lines before and after the failure site.
3. Trace variable provenance backwards rather than reading the entire module.

### 3. Preserving Token Budget
- Do not repeat file contents back to the user in full text responses.
- Summarize changes concisely with line references and diff highlights.
