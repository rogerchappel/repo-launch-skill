# Product Requirements: repo-launch-skill

## Goal
Give agents a grounded, local-first workflow for preparing repository launch material without publishing, tagging, or posting externally.

## Functional Requirements
- Read a repository manifest and optional README.
- Score readiness across facts, examples, verification, quickstart, and safety.
- Generate release notes, demo script steps, short and long post drafts, and gap lists.
- Flag unverifiable claims and external publishing language.

## Non-goals
- No GitHub release creation.
- No social posting.
- No package publishing.

## Success Metrics
- Fixture-backed tests cover readiness, generation, and safety.
- Smoke command produces markdown launch output.
- Another agent can run the workflow with only local files.
