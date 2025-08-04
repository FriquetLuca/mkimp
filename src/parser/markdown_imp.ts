import type { RootToken } from "./utils"
import { type EmojiRecord, Lexer } from "./lexer"
import { Renderer } from "./renderer"

export interface MarkdownImpOptions {
    tabulation?: number
    metadata?: Map<string, string>
    emojis?: Record<string, EmojiRecord>
    frontMatter?: (content: string) => unknown
    include?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => string
    includeCode?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => string | undefined
}

export class MarkdownImp {
    tabulation: number
    metadata: Map<string, string>
    emojis: Record<string, EmojiRecord>
    frontMatter?: (content: string) => unknown
    include?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => string
    includeCode?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => string | undefined
    constructor(options: MarkdownImpOptions = {}) {
        this.tabulation = options?.tabulation ?? 4
        this.metadata = options?.metadata ?? new Map()
        this.emojis = options?.emojis ?? {}
        this.frontMatter = options?.frontMatter
        this.include = options?.include
        this.includeCode = options?.includeCode
    }
    ast(markdown: string): RootToken {
        return Lexer.lex(markdown, {
            tabulation: this.tabulation,
            metadata: this.metadata,
            emojis: this.emojis,
            frontMatter: this.frontMatter,
            include: this.include,
            includeCode: this.includeCode,
        })
    }
    render(root: RootToken) {
        const render = new Renderer(root)
        return render.render()
    }
    parse(markdown: string) {
        const ast = this.ast(markdown)
        return this.render(ast)
    }
}
