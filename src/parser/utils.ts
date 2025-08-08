import type { MdBlockToken } from "./blocks"
import type { MdInlineToken } from "./inlines"
import type { EmojiRecord, LinkRef } from "./lexer"
import type { Renderer } from "./renderer"

export interface Line {
    level: number
    startWs: string
    content: string
}

export type MdToken = MdBlockToken | MdInlineToken

export interface RootToken {
    type: "root"
    metadata: Map<string, string|number|boolean|BigInt>
    reflinks: Map<string, LinkRef>
    emojis: Record<string, EmojiRecord>
    footnoteDefs: Map<string, MdToken[]>
    footnoteIndexRefs: Map<string, number>
    footnoteRefs: Map<number, string>
    tokens: MdToken[]
}

type TokenType = MdToken["type"]
type ExtractToken<T extends TokenType> = Extract<MdToken, { type: T }>

export type TokenRendering = {
    [K in TokenType]: (
        this: Renderer,
        token: ExtractToken<K>
    ) => Promise<string>
}

export type RenderTarget = "raw" | "article"

export const WHITESPACE_CHARS = new Set([
    "\u0009", // Tab
    "\u000B", // Vertical Tab
    "\u000C", // Form Feed
    "\u000D", // Carriage Return
    "\u0020", // Space
    "\u00A0", // No-Break Space
    "\u1680", // Ogham Space Mark
    "\u2000", // En Quad
    "\u2001", // Em Quad
    "\u2002", // En Space
    "\u2003", // Em Space
    "\u2004", // Three-Per-Em Space
    "\u2005", // Four-Per-Em Space
    "\u2006", // Six-Per-Em Space
    "\u2007", // Figure Space
    "\u2008", // Punctuation Space
    "\u2009", // Thin Space
    "\u200A", // Hair Space
    "\u2028", // Line Separator
    "\u2029", // Paragraph Separator
    "\u202F", // Narrow No-Break Space
    "\u205F", // Medium Mathematical Space
    "\u3000", // Ideographic Space
])

export function stringToLines(content: string, tabSpace: number): Line[] {
    const lines: Line[] = []
    let i = 0

    while (i < content.length) {
        let line = ""
        let j = i

        let whitespaceCount = 0
        let startWs = ""
        // Count leading whitespace
        while (j < content.length && WHITESPACE_CHARS.has(content[j])) {
            const ws = content[j]
            if (ws === "\t") {
                whitespaceCount += tabSpace
                startWs += ws
            } else if (ws !== "\r") {
                whitespaceCount++
                startWs += ws
            }
            j++
        }

        // Build line content until newline
        while (j < content.length && content[j] !== "\n") {
            if (content[j] !== "\r") {
                line += content[j]
            }
            j++
        }

        lines.push({
            level: Math.floor(whitespaceCount / tabSpace),
            startWs, // Useful to reconstruct code block later on
            content: line,
        })

        i = j + 1 // Move past '\n'
    }

    return lines
}

const escapeReplacements: { [index: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
}
const getEscapeReplacement = (ch: string) => escapeReplacements[ch]

export function escapeText(html: string, encode?: boolean) {
    if (encode) {
        if (/[&<>"']/.test(html)) {
            return html.replace(/[&<>"']/g, getEscapeReplacement)
        }
    } else {
        if (/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/.test(html)) {
            return html.replace(
                /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
                getEscapeReplacement
            )
        }
    }

    return html
}

export function cleanUrl(href: string) {
    try {
        href = encodeURI(href).replace(/%25/g, "%")
    } catch {
        return null
    }
    return href
}
