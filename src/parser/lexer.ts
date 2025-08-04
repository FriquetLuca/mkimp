import { BlockTokenizer } from "./blocks"
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
    metadata?: Map<string, string>
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
    metadata: Map<string, string>
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
    footnoteIndexMap: Map<string, number>
    footnoteRef: Map<number, string>
    footnoteDefs: Map<string, MdToken[]>
    slugger: Slugger
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
                include: options?.include,
                includeCode: options?.includeCode,
                includedLocations: options?.includedLocations,
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
                include: options?.include,
                includeCode: options?.includeCode,
                includedLocations: options?.includedLocations,
            })
        const inline = new InlineTokenizer({
            lexer,
            content,
        })
        return inline.tokenize()
    }
}
