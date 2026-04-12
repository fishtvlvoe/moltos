## ADDED Requirements

### Requirement: Directory names use ASCII-only kebab-case

All directories under `docs/` SHALL use ASCII-only kebab-case names with no spaces, no Chinese characters, and no numeric prefixes followed by a dash and Chinese text.

#### Scenario: CLI access without quoting

- **WHEN** a developer runs `ls docs/dev` in a shell
- **THEN** the command succeeds without requiring quoted path strings

#### Scenario: Glob pattern matching

- **WHEN** a tool uses the glob pattern `docs/dev/**/*.md`
- **THEN** all markdown files under `docs/dev/` are matched without escaping

---

### Requirement: Development docs and external docs are separated

The `docs/` directory SHALL contain exactly two top-level categories:
- `dev/` — technical documentation about how the system works
- `_external/` — reference materials not describing system behavior (competition entries, competitor analysis, archived prototypes)

#### Scenario: AI reads dev docs only

- **WHEN** an AI assistant is instructed to read `docs/dev/`
- **THEN** it receives only system architecture and development reference, not competition scripts or competitor analysis

#### Scenario: External materials are accessible but not primary

- **WHEN** a developer needs competitor analysis
- **THEN** they can find it under `docs/_external/competitors/`

---

### Requirement: docs/README.md exists as directory index

A `docs/README.md` file SHALL exist and list every top-level directory under `docs/` with a one-line description of its purpose.

#### Scenario: New contributor orientation

- **WHEN** a new contributor (human or AI) enters the repository for the first time
- **THEN** reading `docs/README.md` tells them what each docs subdirectory contains and what to look for where

---

### Requirement: docs/dev/architecture.md exists

A `docs/dev/architecture.md` file SHALL exist and describe:
- System overview (what Moltos is)
- Major modules and their responsibilities
- Data flow between frontend, backend, and external APIs (ElevenLabs, Gemini)
- Technology stack summary

#### Scenario: AI session cold start

- **WHEN** an AI assistant starts a new session and reads `docs/dev/architecture.md`
- **THEN** it can answer questions about the system's major components without reading additional files

---

### Requirement: decisions/ directory contains ADR files

A `docs/dev/decisions/` directory SHALL exist. Any architectural decision that is non-obvious or has lasting impact SHALL be recorded as an ADR (Architecture Decision Record) file named `NNN-short-title.md`.

#### Scenario: Explaining why ElevenLabs was chosen

- **WHEN** a developer asks why ElevenLabs is used for TTS instead of alternatives
- **THEN** a corresponding ADR file exists in `docs/dev/decisions/` with the rationale

---

### Requirement: Existing docs content is preserved during restructure

All existing markdown files under `docs/` SHALL be moved (not deleted) to their new locations. No file content SHALL be modified during the restructure.

#### Scenario: Competition documents remain accessible

- **WHEN** the restructure is complete
- **THEN** the file previously at `docs/1-competition — 比賽資料/demo-script.md` is accessible at `docs/_external/competition/demo-script.md`

#### Scenario: Dev reference files remain accessible

- **WHEN** the restructure is complete
- **THEN** the file previously at `docs/3-dev — 開發文件/elevenlabs-api-reference.md` is accessible at `docs/dev/elevenlabs-api-reference.md`
