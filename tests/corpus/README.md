# Corpus Regression Tests

These tests exercise the preprocessing layer against the project-local corpus fixtures.

## Commands

Run the regression tests:

```bash
npm run test:corpus
```

Dump a quick preprocess report for all corpus files:

```bash
npm run corpus:report
```

## Corpus location

By default the harness reads from:

```text
tests/fixtures/corpus
```

You can override that with:

```bash
CORPUS_DIR=/absolute/path/to/corpus npm run test:corpus
```

## Manifest strategy

`manifest.json` should only contain assertions you are confident about.

Good assertions:

- expected quality
- block count range
- specific required section labels

Avoid asserting the entire payload verbatim. That makes extractor tests brittle.
