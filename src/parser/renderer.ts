import {
    cleanUrl,
    escapeText,
    renderTocNodes,
    type TOCNode,
    type MdToken,
    type RenderTarget,
    type RootToken,
    type TokenRendering,
    WHITESPACE_CHARS,
} from "./utils"
import type { AbbrToken, HeadingToken, TexToken } from "./blocks"
import type { EmojiRecord, LinkRef } from "./lexer"
import hljs from "highlight.js"
import katex from "katex"

const RENDERER_FNS: TokenRendering = {
    async emoji(token) {
        const emoji = this.emojis[token.name]
        if (emoji === undefined) {
            return `:${token.name}:`
        }
        switch (emoji.type) {
            case "img":
                return `<img alt="${emoji.alt ?? token.name}" src="${emoji.url}" class="md-emoji-image" width="${emoji.width ?? 20}" height="${emoji.height ?? 20}">`
            case "i":
                return `<i class="${emoji.className}"></i>`
            default:
                return emoji.char
        }
    },
    async definitionListItem(token) {
        let definitions = ""
        for (const def of token.definitions) {
            definitions += `<dd class="md-defdef">${await this.renderer(def)}</dd>`
        }
        const term = await this.renderer(token.term)
        return `<dt class="md-defterm">${term}</dt>${definitions}`
    },
    async heading(token) {
        const headingContent = await this.renderer(token.tokens)
        const id = token.id ? ` id="${token.id}"` : ""
        return token.isUnderline
            ? `<h${token.depth} class="md-heading md-h-underline" aria-level="${token.depth}">${token.headingIndex}${headingContent}</h${token.depth}>`
            : `<h${token.depth}${id} class="md-heading" aria-level="${token.depth}">${token.headingIndex}${headingContent}</h${token.depth}>`
    },
    async codeblock(token) {
        if (token.from !== undefined || token.to !== undefined) {
            const from = token.from || 1
            let codeText = ""
            let lang = ""
            if (token.lang && hljs.getLanguage(token.lang)) {
                if (token.lang) lang = ` language-${token.lang}`
                codeText = hljs.highlight(token.content, {
                    language: token.lang,
                }).value
            } else {
                codeText = escapeText(token.content, true)
            }
            return `<pre role="region" aria-label="Code block" class="md-precode"><code aria-label="Code" class="md-code${lang}"><table class="md-code-table"><colgroup><col /><col class="md-table-line-space" /><col /></colgroup><tbody>${codeText
                .split(/\r?\n/)
                .map(
                    (c, i) =>
                        `<tr class="md-code-row"><td class="md-number-ln">${i + from}</td><td></td><td class="md-code-ln">${c}</td></tr>`
                )
                .join("")}</tbody></table></code></pre>`
        } else {
            if (token.lang && hljs.getLanguage(token.lang)) {
                const lang = token.lang ? `language-${token.lang}` : ""
                return `<pre role="region" aria-label="Code block" class="md-precode"><code aria-label="Code" class="md-code ${lang}">${hljs.highlight(token.content, { language: token.lang }).value}</code></pre>`
            } else if (token.lang === "mermaid") {
                return `<pre role="region" aria-label="Code block" class="md-mermaid mermaid">${escapeText(token.content, true)}</pre>`
            }
            return `<pre role="region" aria-label="Code block" class="md-precode"><code aria-label="Code" class="md-code">${escapeText(token.content, true)}</code></pre>`
        }
    },
    async horizontal(_) {
        return '<hr class="md-line" role="separator" aria-hidden="true">'
    },
    async blockquote(token) {
        return `<blockquote class="md-blockquote" role="note" aria-label="A quote from the author">${await this.renderer(token.tokens)}</blockquote>`
    },
    async list(token) {
        const type = token.ordered ? "ol" : "ul"
        const startAt = token.startAt ? ` start="${token.startAt}"` : ""
        return `<${type} role="list" class="md-${type}list"${startAt}>${await this.renderer(token.items)}</${type}>`
    },
    async listItem(token) {
        const head = token.task
            ? `<input class="md-checkbox" type="checkbox" disabled${token.checked === true ? " checked" : ""}> `
            : ""
        const body = await this.renderer(token.tokens)
        return `<li role="listitem" class="${token.task ? "md-taskitem" : "md-listitem"}">${head}${body}</li>`
    },
    async table(token) {
        const header = `<thead class="md-thead" role="rowgroup"><tr class="md-htablerow">${await this.renderer(token.header)}</tr></thead>`
        let body = `<tbody class="md-tbody" role="rowgroup">`
        for (const cells of token.rows) {
            body += `<tr class="md-tablerow">${await this.renderer(cells)}</tr>`
        }
        body += `</tbody>`
        return `<table class="md-table" role="table">${header}${body}</table>`
    },
    async cell(token) {
        const tag = token.header ? "th" : "td"
        if (token.header) {
            const style =
                token.align !== "default"
                    ? ` style="text-align:${token.align}"`
                    : ""
            return `<${tag} class="md-tablecell" ${style}>${await this.renderer(token.tokens)}</${tag}>`
        } else {
            const style =
                token.align !== "default"
                    ? ` style="text-align:${token.align}"`
                    : ""
            return `<${tag} class="md-tablecell" ${style}>${await this.renderer(token.tokens)}</${tag}>`
        }
    },
    async footnoteRef(token) {
        return `<sup id="fnref:${token.ref}"><a class="md-link" href="#fn:${token.ref}">[${this.footnoteIndexRefs.get(token.ref) ?? -1}]</a></sup>`
    },
    async footnoteEnd(_) {
        let result = ""
        const refSize = this.footnoteRefs.size
        for (let i = 1; i <= refSize; i++) {
            const ref = this.footnoteRefs.get(i)!
            const def = this.footnoteDefs.get(ref)
            if (def !== undefined) {
                result += `<li class="md-fnitem" id="fn:${ref}">${await this.renderer(def)}</li>`
            } else {
                result += `<li class="md-fnitem" id="fn:${ref}">[${ref}]</li>`
            }
        }
        return `<section class="md-footnotes"><ol class="md-fnlist" dir="auto">${result}</ol></section>`
    },
    async definitionList(token) {
        return `<dl class="md-deflist">${await this.renderer(token.items)}</dl>`
    },
    async tex(token) {
        return await this.latex(token)
    },
    async spoiler(token) {
        const spoilerContent = await this.renderer(token.tokens)
        if (token.inline) {
            return `<label class="md-spoiler"><input class="md-spoiltrigger" type="checkbox" hidden><span class="md-spoilertext">${spoilerContent}</span></label>`
        }
        return `<div class="md-spoiler-toggle"><input type="checkbox" id="md-spoiler-label-${token.index}" hidden><label for="md-spoiler-label-${token.index}" class="md-spoiler-header">${await this.renderer(token.title)}</label><div class="md-spoiler-content">${spoilerContent}</div></div>`
    },
    async include(token) {
        return await this.renderer(token.tokens)
    },
    async html(token) {
        return token.content
    },
    async paragraph(token) {
        return `<p class="md-paragraph">${await this.renderer(token.tokens)}</p>`
    },
    async overline(token) {
        return `<u class="md-overline">${await this.renderer(token.tokens)}</u>`
    },
    async newline(_) {
        return "<br/>"
    },
    async highlight(token) {
        return `<mark class="md-highlight">${await this.renderer(token.tokens)}</mark>`
    },
    async strikethrough(token) {
        return `<del class="md-strikethrough">${await this.renderer(token.tokens)}</del>`
    },
    async underline(token) {
        return `<u class="md-underline">${await this.renderer(token.tokens)}</u>`
    },
    async bold(token) {
        return `<strong class="md-bold">${await this.renderer(token.tokens)}</strong>`
    },
    async italic(token) {
        return `<em class="md-italic">${await this.renderer(token.tokens)}</em>`
    },
    async text(token) {
        if (!this.abbrs || this.abbrs.length === 0) {
            return escapeText(token.text)
        }
        let result = ""
        let i = 0
        while (i < token.text.length) {
            let found = false
            while (i < token.text.length) {
                // Consume whitespaces
                if (!WHITESPACE_CHARS.has(token.text[i])) {
                    break
                }
                result += token.text[i++]
            }
            for (const abbr of this.abbrs) {
                // Search abbr
                const sbr = token.text.slice(i, i + abbr.abbr.length)
                if (
                    sbr === abbr.abbr &&
                    (i + abbr.abbr.length === token.text.length ||
                        (i + abbr.abbr.length < token.text.length &&
                            WHITESPACE_CHARS.has(
                                token.text[i + abbr.abbr.length]
                            )))
                ) {
                    // If found, consume it
                    result += `<abbr title="${escapeText(abbr.title)}">${escapeText(sbr)}</abbr>`
                    found = true
                    i += abbr.abbr.length
                    break
                }
            }
            if (!found) {
                // if not found
                let startIndex = i
                while (i < token.text.length) {
                    // search next whitespace
                    if (WHITESPACE_CHARS.has(token.text[i])) {
                        break
                    }
                    i++
                }
                result += escapeText(token.text.slice(startIndex, i))
            }
        }
        return result
    },
    async codespan(token) {
        return `<code aria-label="Code" class="md-codespan">${escapeText(token.text, true)}</code>`
    },
    async youtubeEmbed(token) {
        const vid = token.attributes.vid
        const title = token.title || "YouTube"
        const width = token.attributes.width || "560"
        const height = token.attributes.height || "315"
        const start = token.attributes.start
        const allowfullscreen = token.attributes.allowfullscreen !== "false"

        const urlParams = new URLSearchParams()
        if (start) urlParams.set("start", start)

        const src = `https://www.youtube.com/embed/${vid}${urlParams.toString() ? "?" + urlParams.toString() : ""}`
        return `<div class="md-youtube"><iframe width="${width}" height="${height}" src="${src}" title="${title}" frameborder="0" ${allowfullscreen ? " allowfullscreen" : ""}></iframe></div>`
    },
    async metadata(token) {
        if (token.value) {
            return typeof token.value === "string"
                ? escapeText(token.value)
                : escapeText(token.value.toString())
        }
        return ""
    },
    async link(token) {
        const linkText = await this.renderer(token.label)
        const cleanHref = cleanUrl(token.href)
        if (cleanHref === null) {
            return linkText
        }
        const title = token.title ? ` title="${escapeText(token.title)}"` : ""
        const blank = cleanHref.startsWith("#")
            ? ""
            : ' target="_blank" rel="noopener"'
        return `<a class="md-link" href="${cleanHref}"${title}${blank}>${linkText}</a>`
    },
    async reflink(token) {
        const reflinkText = await this.renderer(token.label)
        const refLink = this.reflinks.get(token.ref)
        if (refLink) {
            const cleanHref = cleanUrl(refLink.link)
            if (cleanHref === null) {
                return reflinkText
            }
            const title = refLink.title
                ? ` title="${escapeText(refLink.title)}"`
                : ""
            const blank = cleanHref.startsWith("#")
                ? ""
                : ' target="_blank" rel="noopener"'
            return `<a class="md-link" href="${cleanHref}"${title}${blank}>${reflinkText}</a>`
        }
        return reflinkText
    },
    async image(token) {
        const imgcleanHref = cleanUrl(token.href)
        const alt = escapeText(token.alt)
        if (imgcleanHref === null) {
            return alt
        }
        const title = token.title ? ` title="${escapeText(token.title)}"` : ""
        return `<img src="${imgcleanHref}" alt="${alt}" class="md-image"${title}>`
    },
    async tableOfContent(_) {
        const root: TOCNode[] = []
        const stack: { depth: number; node: TOCNode }[] = []

        for (const token of this.tableOfContents) {
            const node: TOCNode = { token, children: [] }

            while (
                stack.length > 0 &&
                stack[stack.length - 1].depth >= token.depth
            ) {
                stack.pop()
            }

            if (stack.length === 0) {
                root.push(node)
            } else {
                stack[stack.length - 1].node.children.push(node)
            }

            stack.push({ depth: token.depth, node })
        }

        return await renderTocNodes.call(this, root)
    },
}

const defaultLatex = async (token: TexToken) => {
    return katex.renderToString(token.text, {
        strict: false,
        throwOnError: false,
        output: "htmlAndMathml",
        displayMode: token.displayMode,
    })
}

export interface RendererOptions {
    withSection: boolean
    renderTarget: RenderTarget
    latex: (token: TexToken) => Promise<string>
}

export class Renderer {
    metadata: Map<string, string | number | boolean | BigInt>
    emojis: Record<string, EmojiRecord>
    reflinks: Map<string, LinkRef>
    footnoteDefs: Map<string, MdToken[]>
    footnoteIndexRefs: Map<string, number>
    footnoteRefs: Map<number, string>
    tableOfContents: HeadingToken[]
    abbrs: AbbrToken[]
    latex: (token: TexToken) => Promise<string>
    tokens: MdToken[]
    withSection: boolean
    renderTarget: RenderTarget
    constructor(root: RootToken, options: Partial<RendererOptions> = {}) {
        this.metadata = root.metadata
        this.emojis = root.emojis
        this.reflinks = root.reflinks
        this.footnoteDefs = root.footnoteDefs
        this.footnoteRefs = root.footnoteRefs
        this.tokens = root.tokens
        this.footnoteIndexRefs = root.footnoteIndexRefs
        this.tableOfContents = root.tableOfContents
        this.abbrs = root.abbrs
        this.withSection = options?.withSection ?? false
        this.renderTarget = options?.renderTarget ?? "raw"
        this.latex = options?.latex ?? defaultLatex
    }
    async render() {
        const content = await this.renderer(this.tokens)
        switch (this.renderTarget) {
            case "article":
                return `<article class="md-article" role="document" aria-label="Page content">${content}</article>`
            case "raw":
                return content
        }
    }
    async renderer(tokens: MdToken[]): Promise<string> {
        if (!this.withSection) {
            // Simple rendering without sections
            let result = ""
            for (const token of tokens) {
                result += await RENDERER_FNS[token.type].call(
                    this,
                    token as any
                )
            }
            return result
        }

        // Group tokens into sections based on headings
        const sections: MdToken[][] = []
        let currentSection: MdToken[] = []
        for (const token of tokens) {
            if (token.type === "heading") {
                if (currentSection.length > 0) {
                    sections.push(currentSection)
                }
                currentSection = [token]
            } else {
                currentSection.push(token)
            }
        }
        if (currentSection.length > 0) {
            sections.push(currentSection)
        }

        let result = ""
        for (const sectionTokens of sections) {
            const headingToken = sectionTokens.find((t) => t.type === "heading")
            const headingId = headingToken ? headingToken.id : undefined

            let inner = ""
            for (const token of sectionTokens) {
                inner += await RENDERER_FNS[token.type].call(this, token as any)
            }

            if (headingId) {
                result += `<section class="md-section" role="region" aria-labelledby="${headingId}">${inner}</section>`
            } else {
                result += `<section>${inner}</section>`
            }
        }

        return result
    }
}
