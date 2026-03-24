/**
 * The CSS root definitions for all the variables used in the `defaultStyle` variable.

  The demo used theses root definition alongside it (not included):
  ```css
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  font-size: calc(0.8rem + 0.25vw);
  line-height: 1.6;
  ```
 */
export const rootStyle: string = `:root {
  --md-text-color: #000000;
  --md-border-color: #d1d9e0b3;
  --md-solid-border-color: #d1d9e0;
  --md-bg-color: #ffffff;
  --md-link-color: #096bda;
  --md-footnote-color: #59636e;
  --md-bg-code-color: #f6f8fa;
  --md-bg-highlight-color: #fdf5ce;
  --md-blockquote-color: #59636e;
  --md-blockquote-border-color: #d1d9e0;
  --md-table-nth-child-bg-color: #f6f8fa;
  --md-cspan-bg-color: #818b981f;
}

@media (prefers-color-scheme: dark) {
  :root {
    --md-text-color: #f0f6fc;
    --md-border-color: #3d444db3;
    --md-solid-border-color: #3d444d;
    --md-bg-color: #0d1117;
    --md-link-color: #4493f8;
    --md-footnote-color: #9198a1;
    --md-bg-code-color: #151b23;
    --md-bg-highlight-color: #fcf8e3;
    --md-blockquote-color: #a8a095;
    --md-blockquote-border-color: #756d60;
    --md-table-nth-child-bg-color: #11161c;
    --md-cspan-bg-color: #656c7633;
  }
}
`;

/**
 * The CSS scrollbar style used in the demo MkImp.

  The demo also used this (not included):
  ```css
 ** {
    scrollbar-color: var(--md-border-color) var(--md-bg-color);
    scrollbar-width: thin;
  }
  ```
 */
export const scrollbarStyle: string = `::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--md-border-color);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--md-solid-border-color);
}

::-webkit-scrollbar-track {
  border-radius: 5px;
}`;

/**
 * The default CSS scrollbar width and color from MkImp demo applied on every single MkImp items that may overflow.
 */
export const scrollbarOnAllStyle: string = `.md-page,
.md-precode,
.md-code,
.md-table,
.md-fnlist,
.md-spoiler-content
{
  scrollbar-color: var(--md-border-color) var(--md-bg-color);
  scrollbar-width: thin;
}

`;

/**
 * The default CSS style used in MkImp demo.
 * The demo also defined the following (not included):
 *  ```css
    html,
    body {
        color: var(--md-text-color);
        background-color: var(--md-bg-color);
        height: 100%;
        overflow: hidden;
    }
    ```
 * But since you may not want to apply the style everywhere, we defined the class `.md-page` that only apply the color and the background color in the container you choose.
 */
export const defaultStyle: string = `.md-page {
  color: var(--md-text-color);
  background-color: var(--md-bg-color);
}

.md-table-line-space {
  width: 0.75rem;
}

.md-number-ln {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  text-align: right;
  border-right: 1px solid var(--md-border-color);
  color: #ddd;
  vertical-align: top;
  padding-right: 0.5rem;
  min-width: 1.5rem;
}

.md-h-underline {
  border-bottom: 1px solid var(--md-border-color);
}
.md-heading {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}
h1.md-heading {
  padding-bottom: 0.3em;
  font-size: 2em;
  font-weight: 600;
  line-height: 1.25;
}
h2.md-heading {
  padding-bottom: 0.3em;
  font-size: 1.5em;
  font-weight: 600;
  line-height: 1.25;
}
h3.md-heading {
  font-size: 1.25em;
}
h4.md-heading {
  font-size: 1em;
}
h5.md-heading {
  font-size: 0.875em;
}
h6.md-heading {
  color: var(--md-footnote-color);
  font-size: 0.85em;
}

.md-line {
  height: 0.25em;
  padding: 0;
  margin: 1.5rem;
  background-color: var(--md-solid-border-color);
  border: 0;
}

.md-tableofcontent {
  display: block;
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
}

.md-listitem .md-tableofcontent {
  padding-left: 1em;
}

.md-ullist {
  display: block;
  list-style: disc outside none;
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 1rem;
}

.md-ollist .md-ullist,
.md-ullist .md-ullist {
  list-style: circle outside none;
}
.md-ullist .md-ollist,
.md-ollist .md-ollist {
  list-style-type: lower-alpha outside none;
}
.md-ollist .md-ullist .md-ullist,
.md-ullist .md-ollist .md-ullist,
.md-ollist .md-ollist .md-ullist,
.md-ullist .md-ullist .md-ullist {
  list-style: square outside none;
}
.md-ullist .md-ollist .md-ollist,
.md-ollist .md-ullist .md-ollist,
.md-ullist .md-ullist .md-ollist,
.md-ollist .md-ollist .md-ollist {
  list-style-type: lower-roman outside none;
}

.md-ollist .md-ullist .md-ullist .md-ullist,
.md-ullist .md-ollist .md-ullist .md-ullist,
.md-ullist .md-ullist .md-ollist .md-ullist,
.md-ollist .md-ollist .md-ullist .md-ullist,
.md-ullist .md-ollist .md-ollist .md-ullist,
.md-ollist .md-ullist .md-ollist .md-ullist,
.md-ollist .md-ollist .md-ollist .md-ullist,
.md-ullist .md-ullist .md-ullist .md-ullist {
  list-style: disc outside none;
}
.md-ullist .md-ollist .md-ollist .md-ollist,
.md-ollist .md-ullist .md-ollist .md-ollist,
.md-ollist .md-ollist .md-ullist .md-ollist,
.md-ullist .md-ullist .md-ollist .md-ollist,
.md-ollist .md-ullist .md-ullist .md-ollist,
.md-ullist .md-ollist .md-ullist .md-ollist,
.md-ullist .md-ullist .md-ullist .md-ollist,
.md-ollist .md-ollist .md-ollist .md-ollist {
  list-style-type: upper-alpha outside none;
}

.md-ullist > .md-taskitem {
  list-style: none;
}

.md-checkbox {
  margin: 0 0.2em 0.25em -1.4em;
  vertical-align: middle;
}

.md-listitem + .md-listitem {
  margin-top: 0.25em;
}

.md-taskitem + .md-taskitem {
  margin-top: 0.25em;
}

.md-ollist {
  display: block;
  list-style: disc outside none;
  list-style-type: decimal;
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 1rem;
}

.md-listitem {
  display: list-item;
}

.md-listitem > .md-ullist {
  margin-bottom: 0;
}
.md-listitem > .md-ollist {
  margin-bottom: 0;
}
.md-taskitem > .md-ollist {
  margin-bottom: 0;
}

.md-link {
  color: var(--md-link-color);
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}
.md-precode {
  border-radius: 6px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  overflow: auto;
  line-height: 1.45;
  color: var(--md-text-color);
  background-color: var(--md-bg-code-color);
  padding: 1rem;
}
.md-code {
  border-radius: 6px;
  padding: 0.2em 0em;
  margin: 0;
  font-size: 85%;
  white-space: break-spaces;
}
.md-codespan {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  white-space: break-spaces;
  border-radius: 6px;
  background-color: var(--md-cspan-bg-color);
}
.md-table {
  display: block;
  width: -webkit-max-content;
  width: -moz-max-content;
  width: max-content;
  overflow: auto;
  margin-top: 0;
  margin-bottom: 1rem;
  border-collapse: collapse;
}
.md-tablerow {
  background-color: var(--md-bg-color);
  border-top: 1px solid var(--md-border-color);
}
.md-tablerow:nth-child(2n + 1) {
  background-color: var(--md-table-nth-child-bg-color);
}
th.md-tablecell {
  font-weight: 600;
  padding: 6px 13px;
  border: 1px solid var(--md-solid-border-color);
  border-collapse: collapse;
}
td.md-tablecell {
  padding: 6px 13px;
  border: 1px solid var(--md-solid-border-color);
  border-collapse: collapse;
}

.md-blockquote {
  color: var(--md-blockquote-color);
  border-left: 0.25em solid var(--md-blockquote-border-color);
  padding: 0 1em;
  margin-top: 0;
  margin-bottom: 1rem;
}
.md-blockquote > :first-child {
  margin-top: 0;
}
.md-blockquote > :last-child {
  margin-bottom: 0;
}

.md-paragraph {
  margin-top: 0;
  margin-bottom: 1rem;
}

.md-listitem > .md-paragraph:only-of-type {
  margin-bottom: 0;
}
.md-listitem > .md-paragraph:last-child {
  margin-bottom: 0;
}

.md-deflist {
  margin-top: 0;
  margin-bottom: 1rem;
}
.md-defterm {
  font-weight: 700;
}
.md-defdef {
  margin-left: 0;
  margin-bottom: 0.25rem;
}
.md-defdef:last-child {
  margin-bottom: 1rem;
}
.md-youtube {
  width: 100%;
  margin-bottom: 1rem;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
}

.md-youtube iframe[width] {
  width: min(100%, attr(width px));
  max-width: 100%;
}

.md-footnotes {
  font-size: 12px;
  color: var(--md-footnote-color);
  border-top: 1px solid var(--md-solid-border-color);
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.md-fnlist {
  padding-left: 1rem;
  margin-top: 0;
  list-style: disc outside none;
  list-style-type: decimal;
  line-height: 2;
}
.md-revfn {
  color: var(--md-link-color);
  text-decoration: none;
}
.md-footnotes .md-fnitem {
  position: relative;
}
.md-fnitem + .md-fnitem {
  margin-top: 0.25em;
}
.md-fnitem {
  display: list-item;
}

.md-spoiler {
  cursor: pointer;
}

.md-spoiler input:checked + .md-spoilertext {
  color: inherit;
  background: transparent;
}

.md-spoilertext {
  background: var(--md-bg-code-color);
  color: transparent;
  border-radius: 0.2em;
  -webkit-transition: color 0.2s;
  -o-transition: color 0.2s;
  transition: color 0.2s;
}

.md-spoiler-toggle {
  margin: 1em 0;
  overflow: hidden;
}

.md-spoiler-header {
  -ms-user-select: none;
  user-select: none;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  display: block;
  padding: 0.5em 0.5em 0.5em 1.5em;
  background: var(--md-bg-code-color);
  cursor: pointer;
  position: relative;
  user-select: none;
  border-top-left-radius: 0.3em;
  border-top-right-radius: 0.3em;
}

.md-spoiler-header::before {
  content: '+';
  position: absolute;
  left: 0.5em;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  font-weight: bold;
  -webkit-transition: -webkit-transform 0.3s ease;
  transition: -webkit-transform 0.3s ease;
  -o-transition: transform 0.3s ease;
  transition: transform 0.3s ease;
  transition:
    transform 0.3s ease,
    -webkit-transform 0.3s ease;
}

.md-spoiler-toggle input:checked + .md-spoiler-header::before {
  content: '−';
}

.md-spoiler-toggle input:not(input:checked) + .md-spoiler-header {
  border-bottom-right-radius: 0.3em;
  border-bottom-left-radius: 0.3em;
}
.md-spoiler-toggle input:checked + .md-spoiler-header {
  border-bottom-right-radius: 0em;
  border-bottom-left-radius: 0em;
}

.md-spoiler-content {
  max-height: 0;
  overflow: hidden;
  padding: 0;
  color: transparent;
  border-left: 1px solid var(--md-bg-code-color);
  border-right: 1px solid var(--md-bg-code-color);
  border-bottom: 1px solid var(--md-bg-code-color);
  border-bottom-right-radius: 0.3em;
  border-bottom-left-radius: 0.3em;
}

.md-spoiler-toggle input:checked ~ .md-spoiler-content {
  max-height: -webkit-max-content;
  max-height: -moz-max-content;
  max-height: max-content;
  padding: 0.5em;
  color: inherit;
  -webkit-transition: color 0.2s;
  -o-transition: color 0.2s;
  transition: color 0.2s;
}

.md-spoiler-toggle input:not(input:checked) ~ .md-spoiler-content {
  border: none;
}

.md-highlight {
  background-color: var(--md-bg-highlight-color);
}

.md-underline {
  text-decoration: underline;
}
.md-overline {
  text-decoration: overline;
}`;
