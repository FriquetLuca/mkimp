import { type AbbrToken, BlockTokenizer, type HeadingToken } from "./blocks"
import { InlineTokenizer } from "./inlines"
import { Slugger } from "./slugger"
import { type MdToken, type RootToken, stringToLines } from "./utils"

export type EmojiRecord =
    | { type: "char"; char: string }
    | {
          type: "img"
          url: string
          alt?: string
          width?: number
          height?: number
      }
    | { type: "i"; className: string }

export interface LinkRef {
    link: string
    title: string | undefined
}

interface LexerOptions {
    tabulation?: number
    metadata?: Map<string, string | number | boolean | BigInt>
    emojis?: Record<string, EmojiRecord>
    frontMatter?: (content: string) => Promise<unknown>
    include?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => Promise<string | undefined>
    includeCode?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => Promise<string | undefined>
    includedLocations?: Set<string>
    tableOfContents?: HeadingToken[]
    abbrs?: AbbrToken[]
    spoilerCount?: number
}

interface StaticLexerOptions {
    lexer: Lexer
}

export class Lexer {
    headingIndex: [
        h1: number,
        h2: number,
        h3: number,
        h4: number,
        h5: number,
        h6: number,
    ]
    headingShift: number
    started: boolean
    metadata: Map<string, string | number | boolean | BigInt>
    emojis: Record<string, EmojiRecord>
    tabulation: number
    frontMatter?: (content: string) => Promise<unknown>
    include?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => Promise<string | undefined>
    includeCode?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => Promise<string | undefined>
    includedLocations: Set<string>
    reflinks: Map<string, LinkRef>
    abbrs: AbbrToken[]
    footnoteIndexMap: Map<string, number>
    footnoteRef: Map<number, string>
    footnoteDefs: Map<string, MdToken[]>
    tableOfContents: HeadingToken[]
    slugger: Slugger
    spoilerCount: number
    constructor(options: Partial<LexerOptions> = {}) {
        this.headingIndex = [0, 0, 0, 0, 0, 0]
        this.tabulation = options?.tabulation ?? 4
        this.started = false
        this.metadata = options?.metadata ?? new Map()
        this.frontMatter = options?.frontMatter
        this.include = options?.include
        this.includeCode = options?.includeCode
        this.includedLocations = options?.includedLocations ?? new Set()
        this.headingShift = 0
        this.reflinks = new Map()
        this.footnoteDefs = new Map()
        this.footnoteRef = new Map()
        this.footnoteIndexMap = new Map()
        this.emojis = options?.emojis ?? {}
        this.slugger = new Slugger()
        this.tableOfContents = options?.tableOfContents ?? []
        this.abbrs = options?.abbrs ?? []
        this.spoilerCount = options?.spoilerCount ?? 0
    }
    newHeading(depth: number) {
        switch (depth) {
            case 1:
                this.headingIndex[0] += 1
                this.headingIndex[1] = 0
                this.headingIndex[2] = 0
                this.headingIndex[3] = 0
                this.headingIndex[4] = 0
                this.headingIndex[5] = 0
                return `${this.headingIndex[0]}. `
            case 2:
                this.headingIndex[1] += 1
                this.headingIndex[2] = 0
                this.headingIndex[3] = 0
                this.headingIndex[4] = 0
                this.headingIndex[5] = 0
                return `${this.headingIndex[0]}.${this.headingIndex[1]}. `
            case 3:
                this.headingIndex[2] += 1
                this.headingIndex[3] = 0
                this.headingIndex[4] = 0
                this.headingIndex[5] = 0
                return `${this.headingIndex[0]}.${this.headingIndex[1]}.${this.headingIndex[2]}. `
            case 4:
                this.headingIndex[3] += 1
                this.headingIndex[4] = 0
                this.headingIndex[5] = 0
                return `${this.headingIndex[0]}.${this.headingIndex[1]}.${this.headingIndex[2]}.${this.headingIndex[3]}. `
            case 5:
                this.headingIndex[4] += 1
                this.headingIndex[5] = 0
                return `${this.headingIndex[0]}.${this.headingIndex[1]}.${this.headingIndex[2]}.${this.headingIndex[3]}.${this.headingIndex[4]}. `
            default:
                this.headingIndex[5] += 1
                return `${this.headingIndex[0]}.${this.headingIndex[1]}.${this.headingIndex[2]}.${this.headingIndex[3]}.${this.headingIndex[4]}.${this.headingIndex[5]}. `
        }
    }
    async lex(content: string): Promise<MdToken[]> {
        const _blocks = await new BlockTokenizer({
            lexer: this,
            lines: stringToLines(content, this.tabulation),
        }).initialize()
        const blocks = await _blocks.tokenize()
        return blocks.getBlocks()
    }
    inlineLex(content: string): MdToken[] {
        const inline = new InlineTokenizer({
            lexer: this,
            content,
        })
        return inline.tokenize()
    }
    static async lex(
        content: string,
        options: LexerOptions & Partial<StaticLexerOptions> = {}
    ): Promise<RootToken> {
        const lexer =
            options.lexer ??
            new Lexer({
                metadata: options?.metadata,
                tabulation: options?.tabulation,
                emojis: options?.emojis,
                frontMatter: options?.frontMatter,
                include: options?.include,
                includeCode: options?.includeCode,
                includedLocations: options?.includedLocations,
                tableOfContents: options?.tableOfContents,
                abbrs: options?.abbrs,
                spoilerCount: options?.spoilerCount,
            })
        const _blocks = await new BlockTokenizer({
            lexer,
            lines: stringToLines(content, lexer.tabulation),
        }).initialize()
        const blocks = await _blocks.tokenize()
        const tokens = blocks.getBlocks()
        if (lexer.footnoteDefs.size > 0 && lexer.footnoteIndexMap.size > 1) {
            tokens.push({
                type: "footnoteEnd",
            })
        }
        return {
            type: "root",
            metadata: lexer.metadata,
            reflinks: lexer.reflinks,
            footnoteDefs: lexer.footnoteDefs,
            footnoteRefs: lexer.footnoteRef,
            footnoteIndexRefs: lexer.footnoteIndexMap,
            tableOfContents: lexer.tableOfContents,
            abbrs: lexer.abbrs.sort((a, b) => b.abbr.length - a.abbr.length),
            emojis: lexer.emojis,
            tokens,
        }
    }
    static inlineLex(
        content: string,
        options: LexerOptions & Partial<StaticLexerOptions> = {}
    ): MdToken[] {
        const lexer =
            options.lexer ??
            new Lexer({
                metadata: options?.metadata,
                tabulation: options?.tabulation,
                frontMatter: options?.frontMatter,
                include: options?.include,
                includeCode: options?.includeCode,
                includedLocations: options?.includedLocations,
                tableOfContents: options?.tableOfContents,
                abbrs: options?.abbrs,
                spoilerCount: options?.spoilerCount,
            })
        const inline = new InlineTokenizer({
            lexer,
            content,
        })
        return inline.tokenize()
    }
}
