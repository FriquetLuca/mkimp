import type { RenderTarget, RootToken } from "./utils"
import { type EmojiRecord, Lexer } from "./lexer"
import { Renderer } from "./renderer"

export interface MkImpOptions {
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
    withSection?: boolean
    renderTarget?: RenderTarget
}

export class MkImp {
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
    withSection: boolean
    renderTarget: RenderTarget
    constructor(options: MkImpOptions = {}) {
        this.tabulation = options?.tabulation ?? 4
        this.metadata = options?.metadata ?? new Map()
        this.emojis = options?.emojis ?? {}
        this.frontMatter = options?.frontMatter
        this.include = options?.include
        this.includeCode = options?.includeCode
        this.withSection = options?.withSection ?? false
        this.renderTarget = options?.renderTarget ?? "raw"
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
        const render = new Renderer(root, {
            withSection: this.withSection,
            renderTarget: this.renderTarget,
        })
        return render.render()
    }
    parse(markdown: string) {
        const ast = this.ast(markdown)
        return this.render(ast)
    }
}
