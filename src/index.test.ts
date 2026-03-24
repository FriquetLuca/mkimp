import { MkImp } from '.';
import path from 'path';
import fs from 'fs';
import { expect, test } from 'vitest';
import jsyaml from 'js-yaml';

test('frontmatter should be found correctly', async () => {
  const mkimp = await new MkImp().ast(
    '----\n{\n"hello":"world"\n}\n----\nHello!'
  );
  expect(mkimp.metadata).toEqual(new Map([['hello', 'world']]));
});

test('frontmatter should not generate extra separator', async () => {
  const content =
    '---\nlang: en\ncompany_name: Some Company\ncompany_address_line1: Somewhere\njob_position: Developer\n---\n\nCurrently looking for a job my friend.';
  const mkimp = await new MkImp({
    async frontMatter(content) {
      return jsyaml.load(content, {});
    },
  }).ast(content);
  expect(mkimp.tokens[0].type).toEqual('paragraph');
});

test('the renderer for a specific token should have a way to override it', async () => {
  const content = 'This is a paragraph.';
  const result = await new MkImp({
    overrideRenderer: {
      async paragraph(token) {
        return `<p>${await this.renderer(token.tokens)}</p>`;
      },
    },
  }).parse(content);
  expect(result).toEqual('<p>This is a paragraph.</p>');
});

test('include', async () => {
  const mkimp = new MkImp({
    async include(location, from, to) {
      const fullPath = path.resolve(__dirname, '../examples', location);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      if (from === undefined && to === undefined) {
        return fileContent;
      }
      const filelines = fileContent.split(/\r?\n/);
      const newFrom = Math.max(
        0,
        Math.min(from ? from - 1 : 0, filelines.length - 1)
      );
      const newTo = Math.max(
        0,
        Math.min(to ? to - 1 : filelines.length - 1, filelines.length - 1)
      );
      return filelines.slice(newFrom, newTo).join('\n');
    },
  });
  const location = path.resolve(__dirname, '../examples/foo.md');
  const fileContent = fs.readFileSync(location, 'utf-8');
  const ast = await mkimp.ast(fileContent);
  const result = await mkimp.render(ast);
  expect(result.length).toBeGreaterThan(0);
});

test('heading table of content renderer', async () => {
  const mkimp = new MkImp();
  const result = await mkimp.render({
    type: 'root',
    metadata: new Map(),
    reflinks: new Map(),
    emojis: {},
    footnoteDefs: new Map(),
    footnoteIndexRefs: new Map(),
    footnoteRefs: new Map(),
    tableOfContents: [
      {
        type: 'heading',
        id: 'intro',
        depth: 1,
        tokens: [{ type: 'text', text: 'abcde1' }],
        isUnderline: false,
        headingIndex: '1.',
      },
      {
        type: 'heading',
        id: 'usage',
        depth: 2,
        tokens: [{ type: 'text', text: 'abcde2' }],
        isUnderline: false,
        headingIndex: '1.2.',
      },
      {
        type: 'heading',
        id: 'forgotten',
        depth: 4,
        tokens: [{ type: 'text', text: 'abcde3' }],
        isUnderline: false,
        headingIndex: '1.2.0.4.',
      },
      {
        type: 'heading',
        id: 'install',
        depth: 1,
        tokens: [{ type: 'text', text: 'abcde4' }],
        isUnderline: false,
        headingIndex: '1.',
      },
    ],
    abbrs: [],
    tokens: [{ type: 'tableOfContent' }],
  });
  expect(result).toBe(
    '<ul role="list" class="md-tableofcontent"><li role="listitem" class="md-listitem"><a class="md-link" href="#intro">1.abcde1</a><ul role="list" class="md-tableofcontent"><li role="listitem" class="md-listitem"><a class="md-link" href="#usage">1.2.abcde2</a><ul role="list" class="md-tableofcontent"><li role="listitem" class="md-listitem"><a class="md-link" href="#forgotten">1.2.0.4.abcde3</a></li></ul></li></ul></li><li role="listitem" class="md-listitem"><a class="md-link" href="#install">1.abcde4</a></li></ul>'
  );
});

test('abbr rendering', async () => {
  const mkimp = new MkImp();
  const result = await mkimp.render({
    type: 'root',
    metadata: new Map(),
    reflinks: new Map(),
    emojis: {},
    footnoteDefs: new Map(),
    footnoteIndexRefs: new Map(),
    footnoteRefs: new Map(),
    tableOfContents: [],
    abbrs: [
      { type: 'abbr', abbr: 'HTML', title: 'Hyper Text Markup Language' },
      { type: 'abbr', abbr: 'W3C', title: 'World Wide Web Consortium' },
      { type: 'abbr', abbr: 'N.M.W.', title: 'Not My Wallet' },
    ],
    tokens: [
      {
        type: 'text',
        text: 'The HTML spec by W3C is part of the N.M.W. series.',
      },
    ],
  });
  expect(result).toBe(
    'The <abbr title="Hyper Text Markup Language">HTML</abbr> spec by <abbr title="World Wide Web Consortium">W3C</abbr> is part of the <abbr title="Not My Wallet">N.M.W.</abbr> series.'
  );
});

test('url should be left as is', async () => {
  const mkimp = await new MkImp().parse('http://www.example.com');
  expect(mkimp).toEqual('<p class="md-paragraph">http://www.example.com</p>');
});

test('abbr parsing should be rendered', async () => {
  const mkimp = await new MkImp().parse(
    'NASA and CERN do science.\n\n*[NASA]: National Aeronautics and Space Administration\n*[CERN]: Centre Européen de Recherche Nucléaire'
  );
  expect(mkimp).toEqual(
    '<p class="md-paragraph"><abbr title="National Aeronautics and Space Administration">NASA</abbr> and <abbr title="Centre Européen de Recherche Nucléaire">CERN</abbr> do science.</p>'
  );
});

test('sub should be found', async () => {
  const content = '~This is sub.~';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><sub class="md-sub">This is sub.</sub></p>'
  );
});

test('sup should be found', async () => {
  const content = '^This is sup.^';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><sup class="md-sup">This is sup.</sup></p>'
  );
});

test('overline should be found', async () => {
  const content = '^^This is sub.^^';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><u class="md-overline">This is sub.</u></p>'
  );
});

test('strikethrough should be found', async () => {
  const content = '~~This is sup.~~';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><del class="md-strikethrough">This is sup.</del></p>'
  );
});

test('sup and overline overlapping should be detected 1', async () => {
  const content = '^^^This is^^ sup.^';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><sup class="md-sup"><u class="md-overline">This is</u> sup.</sup></p>'
  );
});

test('sup and overline overlapping should be detected 2', async () => {
  const content = '^^^This is^ sup.^^';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><u class="md-overline"><sup class="md-sup">This is</sup> sup.</u></p>'
  );
});

test('sup and overline overlapping should be detected 3', async () => {
  const content = '^^^This is sup.^^^';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><sup class="md-sup"><u class="md-overline">This is sup.</u></sup></p>'
  );
});

test('sub and strikethrough overlapping should be detected 1', async () => {
  const content = '~~~This is~~ sup.~';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><sub class="md-sub"><del class="md-strikethrough">This is</del> sup.</sub></p>'
  );
});

test('sub and strikethrough overlapping should be detected 2', async () => {
  const content = '~~~This is~ sup.~~';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><del class="md-strikethrough"><sub class="md-sub">This is</sub> sup.</del></p>'
  );
});

test('sub and strikethrough overlapping should be detected 3', async () => {
  const content = '~~~This is sup.~~~';
  const result = await new MkImp().parse(content);
  expect(result).toEqual(
    '<p class="md-paragraph"><sub class="md-sub"><del class="md-strikethrough">This is sup.</del></sub></p>'
  );
});
