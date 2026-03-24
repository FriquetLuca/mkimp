import type { RenderTarget, RootToken, TokenRendering } from './utils';
import type { TexToken } from './blocks';
import { type EmojiRecord, Lexer } from './lexer';
import { Renderer } from './renderer';
import type { HLJSApi } from 'highlight.js';

export interface MkImpOptions {
  tabulation?: number;
  metadata?: Map<string, string | number | boolean | bigint>;
  emojis?: Record<string, EmojiRecord>;
  frontMatter?: (content: string) => Promise<unknown>;
  include?: (
    location: string,
    from: number | undefined,
    to: number | undefined
  ) => Promise<string | undefined>;
  includeCode?: (
    location: string,
    from: number | undefined,
    to: number | undefined
  ) => Promise<string | undefined>;
  latex?: (token: TexToken) => Promise<string>;
  withSection?: boolean;
  renderTarget?: RenderTarget;
  useLatex?: boolean;
  useHLJS?: boolean;
  hljs?: () => HLJSApi;
  overrideRenderer?: Partial<TokenRendering<string>>;
  articleWrapper?: (content: string) => Promise<string>;
  sectionWrapper?: (
    content: string,
    headingId: string | undefined
  ) => Promise<string>;
}

export class MkImp {
  tabulation: number;
  metadata: Map<string, string | number | boolean | bigint>;
  emojis: Record<string, EmojiRecord>;
  frontMatter?: (content: string) => Promise<unknown>;
  include?: (
    location: string,
    from: number | undefined,
    to: number | undefined
  ) => Promise<string | undefined>;
  includeCode?: (
    location: string,
    from: number | undefined,
    to: number | undefined
  ) => Promise<string | undefined>;
  latex?: (token: TexToken) => Promise<string>;
  withSection: boolean;
  renderTarget: RenderTarget;
  useLatex: boolean;
  useHLJS: boolean;
  hljs?: () => HLJSApi;
  overrideRenderer?: Partial<TokenRendering<string>>;
  articleWrapper?: (content: string) => Promise<string>;
  sectionWrapper?: (
    content: string,
    headingId: string | undefined
  ) => Promise<string>;
  constructor(options: MkImpOptions = {}) {
    this.tabulation = options?.tabulation ?? 4;
    this.metadata = options?.metadata ?? new Map();
    this.emojis = options?.emojis ?? {};
    this.frontMatter = options?.frontMatter;
    this.include = options?.include;
    this.includeCode = options?.includeCode;
    this.latex = options?.latex;
    this.withSection = options?.withSection ?? false;
    this.renderTarget = options?.renderTarget ?? 'raw';
    this.useLatex = options?.useLatex ?? true;
    this.useHLJS = options?.useHLJS ?? true;
    this.hljs = options?.hljs;
    this.overrideRenderer = options?.overrideRenderer;
    this.articleWrapper = options?.articleWrapper;
    this.sectionWrapper = options?.sectionWrapper;
  }
  async ast(markdown: string): Promise<RootToken> {
    return await Lexer.lex(markdown, {
      tabulation: this.tabulation,
      metadata: this.metadata,
      emojis: this.emojis,
      frontMatter: this.frontMatter,
      include: this.include,
      includeCode: this.includeCode,
    });
  }
  async render(root: RootToken): Promise<string> {
    const render = new Renderer(root, {
      latex: this.latex,
      withSection: this.withSection,
      renderTarget: this.renderTarget,
      useHLJS: this.useHLJS,
      useLatex: this.useLatex,
      overrideRenderer: this.overrideRenderer,
      articleWrapper: this.articleWrapper,
      sectionWrapper: this.sectionWrapper,
    });
    return await render.render();
  }
  async parse(markdown: string): Promise<string> {
    const ast = await this.ast(markdown);
    return await this.render(ast);
  }
}
