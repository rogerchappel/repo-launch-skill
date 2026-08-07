# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Changed

- Installation guidance now uses the currently supported packed-tarball path
  and labels npm registry installation as dependent on a future publication.
- Plans and CLI validation now treat every unresolved safety finding as
  blocking, including unverified claims and missing manifest verification.
- Validation output identifies its classification and blocking findings, and
  manifest verification must contain a non-empty exact command.

### Added

- Initial release-candidate surface for the local-first repository launch
  planning CLI.
- Fixture-backed validation, smoke, package dry-run, and release-check scripts.
- Safety notes documenting that generated launch copy requires human review and
  does not publish releases or post externally.
- Package smoke now asserts the CLI entrypoint, reusable skill file, fixtures,
  examples, support docs, changelog, bin metadata, and npm allowlist before
  packing, installing, and running `repo-launch-skill --help` from the tarball.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/repo-launch-skill/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/repo-launch-skill/releases/latest`

Replace placeholder links once the first release tag exists.
