import type { MdToken, RootToken, TokenRendering } from "./utils"
import type { EmojiRecord, LinkRef } from "./lexer"
import hljs from "highlight.js"
import katex from "katex"

const escapeReplacements: { [index: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
}
const getEscapeReplacement = (ch: string) => escapeReplacements[ch]

function escape(html: string, encode?: boolean) {
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

function cleanUrl(href: string) {
    try {
        href = encodeURI(href).replace(/%25/g, "%")
    } catch {
        return null
    }
    return href
}

const RENDERER_FNS: TokenRendering = {
    emoji(token) {
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
    definitionListItem(token) {
        const definitions = token.definitions
            .map((def) => `<dd class="md-defdef">${this.renderer(def)}</dd>`)
            .join("")
        return `<dt class="md-defterm">${this.renderer(token.term)}</dt>${definitions}`
    },
    heading(token) {
        const headingContent = this.renderer(token.tokens)
        const id = token.id ? ` id="${token.id}"` : ""
        return token.isUnderline
            ? `<h${token.depth} class="md-heading md-h-underline">${token.headingIndex}${headingContent}</h${token.depth}>`
            : `<h${token.depth}${id} class="md-heading">${token.headingIndex}${headingContent}</h${token.depth}>`
    },
    codeblock(token) {
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
                codeText = escape(token.content, true)
            }
            return `<pre class="md-precode"><code class="md-code${lang}"><table class="md-code-table"><colgroup><col /><col class="md-table-line-space" /><col /></colgroup><tbody>${codeText
                .split(/\r?\n/)
                .map(
                    (c, i) =>
                        `<tr class="md-code-row"><td class="md-number-ln">${i + from}</td><td></td><td class="md-code-ln">${c}</td></tr>`
                )
                .join("")}</tbody></table></code></pre>`
        } else {
            if (token.lang && hljs.getLanguage(token.lang)) {
                const lang = token.lang ? `language-${token.lang}` : ""
                return `<pre class="md-precode"><code class="md-code ${lang}">${hljs.highlight(token.content, { language: token.lang }).value}</code></pre>`
            } else if (token.lang === "mermaid") {
                return `<pre class="md-mermaid mermaid">${escape(token.content, true)}</pre>`
            }
            return `<pre class="md-precode"><code class="md-code">${escape(token.content, true)}</code></pre>`
        }
    },
    horizontal(_) {
        return '<hr class="md-line">'
    },
    blockquote(token) {
        return `<blockquote class="md-blockquote">${this.renderer(token.tokens)}</blockquote>`
    },
    list(token) {
        const type = token.ordered ? "ol" : "ul"
        return `<${type} class="md-${type}list">${this.renderer(token.items)}</${type}>`
    },
    listItem(token) {
        const head = token.task
            ? `<input class="md-checkbox" type="checkbox" disabled${token.checked === true ? " checked" : ""}> `
            : ""
        const body = this.renderer(token.tokens)
        return `<li class="${token.task ? "md-taskitem" : "md-listitem"}">${head}${body}</li>`
    },
    table(token) {
        const header = `<thead class="md-thead"><tr class="md-htablerow">${this.renderer(token.header)}</tr></thead>`
        const body = `<tbody class="md-tbody">${token.rows.map((cells) => `<tr class="md-tablerow">${this.renderer(cells)}</tr>`).join("")}</tbody>`
        return `<table class="md-table" role="table">${header}${body}</table>`
    },
    cell(token) {
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
    footnoteRef(token) {
        return `<sup id="fnref:${token.ref}"><a class="md-link" href="#fn:${token.ref}">[${this.footnoteIndexRefs.get(token.ref) ?? -1}]</a></sup>`
    },
    footnoteEnd(_) {
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
    definitionList(token): string {
        return `<dl class="md-deflist">${this.renderer(token.items)}</dl>`
    },
    tex(token) {
        return katex.renderToString(token.text, {
            strict: false,
            throwOnError: false,
            output: "htmlAndMathml",
            displayMode: token.displayMode,
        })
    },
    spoiler(token) {
        const spoilerContent = this.renderer(token.tokens)
        if (token.inline) {
            return `<label class="md-spoiler"><input class="md-spoiltrigger" type="checkbox" hidden><span class="md-spoilertext">${spoilerContent}</span></label>`
        }
        return `<div class="md-spoiler-toggle"><input type="checkbox" id="md-spoiler-label" hidden><label for="md-spoiler-label" class="md-spoiler-header">${this.renderer(token.title)}</label><div class="md-spoiler-content">${spoilerContent}</div></div>`
    },
    include(token) {
        return this.renderer(token.tokens)
    },
    html(token) {
        return token.content
    },
    paragraph(token) {
        return `<p class="md-paragraph">${this.renderer(token.tokens)}</p>`
    },
    overline(token) {
        return `<u class="md-overline">${this.renderer(token.tokens)}</u>`
    },
    newline(_) {
        return "<br/>"
    },
    highlight(token) {
        return `<mark class="md-highlight">${this.renderer(token.tokens)}</mark>`
    },
    strikethrough(token) {
        return `<del class="md-strikethrough">${this.renderer(token.tokens)}</del>`
    },
    underline(token) {
        return `<u class="md-underline">${this.renderer(token.tokens)}</u>`
    },
    bold(token) {
        return `<strong class="md-bold">${this.renderer(token.tokens)}</strong>`
    },
    italic(token) {
        return `<em class="md-italic">${this.renderer(token.tokens)}</em>`
    },
    text(token) {
        return escape(token.text)
    },
    codespan(token) {
        return `<code class="md-codespan">${escape(token.text, true)}</code>`
    },
    youtubeEmbed(token) {
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
    metadata(token) {
        const metadata = this.metadata.get(token.name)
        if (metadata) {
            return escape(metadata)
        }
        return ""
    },
    link(token) {
        const linkText = this.renderer(token.label)
        const cleanHref = cleanUrl(token.href)
        if (cleanHref === null) {
            return linkText
        }
        const title = token.title ? ` title="${escape(token.title)}"` : ""
        const blank = cleanHref.startsWith("#")
            ? ""
            : ' target="_blank" rel="noopener"'
        return `<a class="md-link" href="${cleanHref}"${title}${blank}>${linkText}</a>`
    },
    reflink(token) {
        const reflinkText = this.renderer(token.label)
        const refLink = this.reflinks.get(token.ref)
        if (refLink) {
            const cleanHref = cleanUrl(refLink.link)
            if (cleanHref === null) {
                return reflinkText
            }
            const title = refLink.title
                ? ` title="${escape(refLink.title)}"`
                : ""
            const blank = cleanHref.startsWith("#")
                ? ""
                : ' target="_blank" rel="noopener"'
            return `<a class="md-link" href="${cleanHref}"${title}${blank}>${reflinkText}</a>`
        }
        return reflinkText
    },
    image(token) {
        const imgcleanHref = cleanUrl(token.href)
        const alt = escape(token.alt)
        if (imgcleanHref === null) {
            return alt
        }
        const title = token.title ? ` title="${escape(token.title)}"` : ""
        return `<img src="${imgcleanHref}" alt="${alt}" class="md-image"${title}>`
    },
}

export class Renderer {
    metadata: Map<string, string>
    emojis: Record<string, EmojiRecord>
    reflinks: Map<string, LinkRef>
    footnoteDefs: Map<string, MdToken[]>
    footnoteIndexRefs: Map<string, number>
    footnoteRefs: Map<number, string>
    tokens: MdToken[]
    withSection: boolean
    constructor(root: RootToken, withSection: boolean = false) {
        this.metadata = root.metadata
        this.emojis = root.emojis
        this.reflinks = root.reflinks
        this.footnoteDefs = root.footnoteDefs
        this.footnoteRefs = root.footnoteRefs
        this.tokens = root.tokens
        this.footnoteIndexRefs = root.footnoteIndexRefs
        this.withSection = withSection
    }
    render() {
        return `<article class="md-article" role="document" aria-label="Page content">${this.renderer(this.tokens)}</article>`
    }
    renderer(tokens: MdToken[]): string {
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
