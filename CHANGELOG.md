# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.6] - 2025-08-09

- Remove `/*` comment style since `*` can be found in URL.

## [4.0.5] - 2025-08-09

- Remove single line comment causing issues with URL.

## [4.0.4] - 2025-08-09

- Patch spoiler block input missing an index to make it unique.

## [4.0.3] - 2025-08-08

- Patch failed build.

## [4.0.2] - 2025-08-08

- Correct the `LaTeX` display mode being baddly taken.

## [4.0.1] - 2025-08-08

- Remove the raw content from `includecode` in the case the result is `undefined`.
- Correcting list missing use in renderer of `startAt`.
- Add missing parenthesis include code path that was missing.

## [4.0.0] - 2025-08-08

- Add `abbreviation` syntax for abbreviation.

## [3.0.1] - 2025-08-08

- Correct the blocks for `blockquote`.
- Correct the blocks for `table of content`.

## [3.0.0] - 2025-08-08

- Add a scope for included `metadata`.
- Override metadata when importing `frontmatter` block.
- Correct the renderer for async.
- Correct the renderer test that was missing `await`.
- Add table of content block.
- Add inline commentary syntax (C like).

## [2.0.0] - 2025-08-05

- `render` is now asynchronous.
- `Renderer` is fully asynchronous.
- Add special `svg` HTML block handle.
- Add `latex` handler.
- Fix `LICENSE` year.
- Update `README`.

## [1.0.4] - 2025-08-05

- Add missing custom `frontmatter` in lexer.

## [1.0.3] - 2025-08-05

- Add `include` test.

## [1.0.2] - 2025-08-05

- Fix infinite loop in `include`.

## [1.0.1] - 2025-08-04

- Add prettier to the code.

## [1.0.0] - 2025-08-04

- `ast` and `parse` are now asynchronous.

## [0.0.1] - 2025-08-04

Initial release.