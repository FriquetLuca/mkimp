import {
    cleanUrl,
    escapeText,
    type MdToken,
    type RenderTarget,
    type RootToken,
    type TokenRendering,
} from "./utils"
import type { TexToken } from "./blocks"
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
        const definitions = token.definitions
            .map((def) => `<dd class="md-defdef">${this.renderer(def)}</dd>`)
            .join("")
        return `<dt class="md-defterm">${this.renderer(token.term)}</dt>${definitions}`
    },
    async heading(token) {
        const headingContent = this.renderer(token.tokens)
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
        return `<blockquote class="md-blockquote" role="note" aria-label="A quote from the author">${this.renderer(token.tokens)}</blockquote>`
    },
    async list(token) {
        const type = token.ordered ? "ol" : "ul"
        return `<${type} role="list" class="md-${type}list">${this.renderer(token.items)}</${type}>`
    },
    async listItem(token) {
        const head = token.task
            ? `<input class="md-checkbox" type="checkbox" disabled${token.checked === true ? " checked" : ""}> `
            : ""
        const body = this.renderer(token.tokens)
        return `<li role="listitem" class="${token.task ? "md-taskitem" : "md-listitem"}">${head}${body}</li>`
    },
    async table(token) {
        const header = `<thead class="md-thead" role="rowgroup"><tr class="md-htablerow">${this.renderer(token.header)}</tr></thead>`
        const body = `<tbody class="md-tbody" role="rowgroup">${token.rows.map((cells) => `<tr class="md-tablerow">${this.renderer(cells)}</tr>`).join("")}</tbody>`
        return `<table class="md-table" role="table">${header}${body}</table>`
    },
    async cell(token) {
        const tag = token.header ? "th" : "td"
        if (token.header) {
            const style =
                token.align !== "default"
                    ? ` style="text-align:${token.align}"`
                    : ""
            return `<${tag} class="md-tablecell" ${style}>${this.renderer(token.tokens)}</${tag}>`
        } else {
            const style =
                token.align !== "default"
                    ? ` style="text-align:${token.align}"`
                    : ""
            return `<${tag} class="md-tablecell" ${style}>${this.renderer(token.tokens)}</${tag}>`
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
                result += `<li class="md-fnitem" id="fn:${ref}">${this.renderer(def)}</li>`
            } else {
                result += `<li class="md-fnitem" id="fn:${ref}">[${ref}]</li>`
            }
        }
        return `<section class="md-footnotes"><ol class="md-fnlist" dir="auto">${result}</ol></section>`
    },
    async definitionList(token) {
        return `<dl class="md-deflist">${this.renderer(token.items)}</dl>`
    },
    async tex(token) {
        return await this.latex(token)
    },
    async spoiler(token) {
        const spoilerContent = this.renderer(token.tokens)
        if (token.inline) {
            return `<label class="md-spoiler"><input class="md-spoiltrigger" type="checkbox" hidden><span class="md-spoilertext">${spoilerContent}</span></label>`
        }
        return `<div class="md-spoiler-toggle"><input type="checkbox" id="md-spoiler-label" hidden><label for="md-spoiler-label" class="md-spoiler-header">${this.renderer(token.title)}</label><div class="md-spoiler-content">${spoilerContent}</div></div>`
    },
    async include(token) {
        return this.renderer(token.tokens)
    },
    async html(token) {
        return token.content
    },
    async paragraph(token) {
        return `<p class="md-paragraph">${this.renderer(token.tokens)}</p>`
    },
    async overline(token) {
        return `<u class="md-overline">${this.renderer(token.tokens)}</u>`
    },
    async newline(_) {
        return "<br/>"
    },
    async highlight(token) {
        return `<mark class="md-highlight">${this.renderer(token.tokens)}</mark>`
    },
    async strikethrough(token) {
        return `<del class="md-strikethrough">${this.renderer(token.tokens)}</del>`
    },
    async underline(token) {
        return `<u class="md-underline">${this.renderer(token.tokens)}</u>`
    },
    async bold(token) {
        return `<strong class="md-bold">${this.renderer(token.tokens)}</strong>`
    },
    async italic(token) {
        return `<em class="md-italic">${this.renderer(token.tokens)}</em>`
    },
    async text(token) {
        return escapeText(token.text)
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
            return typeof token.value === "string" ? escapeText(token.value) : escapeText(token.value.toString())
        }
        return ""
    },
    async link(token) {
        const linkText = this.renderer(token.label)
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
        const reflinkText = this.renderer(token.label)
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
    metadata: Map<string, string|number|boolean|BigInt>
    emojis: Record<string, EmojiRecord>
    reflinks: Map<string, LinkRef>
    footnoteDefs: Map<string, MdToken[]>
    footnoteIndexRefs: Map<string, number>
    footnoteRefs: Map<number, string>
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
            return tokens
                .map((token) =>
                    RENDERER_FNS[token.type].call(this, token as any)
                )
                .join("")
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
        return sections
            .map((sectionTokens) => {
                const headingToken = sectionTokens.find(
                    (t) => t.type === "heading"
                )
                const headingId = headingToken ? headingToken.id : undefined

                const inner = sectionTokens
                    .map((token) =>
                        RENDERER_FNS[token.type].call(this, token as any)
                    )
                    .join("")

                if (headingId) {
                    return `<section class="md-section" role="region" aria-labelledby="${headingId}">${inner}</section>`
                } else {
                    return `<section>${inner}</section>`
                }
            })
            .join("")
    }
}
