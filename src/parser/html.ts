import type { HTMLToken } from "./blocks"
import type { InlineTokenizer } from "./inlines"

const attrName = /[a-zA-Z_:][a-zA-Z0-9:._-]*/.source
const unquoted = /[^"'=<>`\x00-\x20]+/.source
const singleQuoted = /'[^']*'/.source
const doubleQuoted = /"[^"]*"/.source
const attrValue = `(?:${unquoted}|${singleQuoted}|${doubleQuoted})`
const attribute = `(?:\\s+${attrName}(?:\\s*=\\s*${attrValue})?)`

const openTag = `<[A-Za-z][A-Za-z0-9\\-]*${attribute}*\\s*/?>`
const closeTag = `</[A-Za-z][A-Za-z0-9\\-]*\\s*>`
const comment = `<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->`
const processing = `<[?][\\s\\S]*?[?]>`
const declaration = `<![A-Z]+\\s+[^>]*>`
const cdata = `<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`

const HTML_TAG_RE = new RegExp(
    `^(?:${openTag}|${closeTag}|${comment}|${processing}|${declaration}|${cdata})`
)

const HTML_OPEN_CLOSE_TAG_RE = new RegExp(`^(?:${openTag}|${closeTag})\\s*$`)

const HTML_LINK_OPEN = /^<a[>\s]/i
const HTML_LINK_CLOSE = /^<\/a\s*>/i

function editRegex(regex: string | RegExp, opt = "") {
    let source = typeof regex === "string" ? regex : regex.source
    const obj = {
        replace: (name: string | RegExp, val: string | RegExp) => {
            let valSource = typeof val === "string" ? val : val.source
            valSource = valSource.replace(/(^|[^\[])\^/g, "$1")
            source = source.replace(name, valSource)
            return obj
        },
        getRegex: () => {
            return new RegExp(source, opt)
        },
    }
    return obj
}

const HTML_BLOCKS = [
    "address",
    "article",
    "aside",
    "base",
    "basefont",
    "blockquote",
    "body",
    "caption",
    "center",
    "col",
    "colgroup",
    "dd",
    "details",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hr",
    "html",
    "iframe",
    "legend",
    "li",
    "link",
    "main",
    "menu",
    "menuitem",
    "nav",
    "noframes",
    "ol",
    "optgroup",
    "option",
    "p",
    "param",
    "section",
    "source",
    "summary",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "title",
    "tr",
    "track",
    "ul",
].join("|")

export const htmlPatterns: {
    open: RegExp
    close: RegExp
    canInterrupt: boolean
}[] = [
    // Type 1: <script>, <pre>, <style>, <textarea>, <svg>
    {
        open: /^<(script|pre|style|svg|textarea)(\s|>|$)/i,
        close: /<\/(script|pre|style|svg|textarea)>/i,
        canInterrupt: true,
    },
    // Type 2: <!--
    {
        open: /^<!--/,
        close: /-->/,
        canInterrupt: true,
    },
    // Type 3: <?
    {
        open: /^<\?/,
        close: /\?>/,
        canInterrupt: true,
    },
    // Type 4: <!A-Z
    {
        open: /^<![A-Z]/,
        close: />/,
        canInterrupt: true,
    },
    // Type 5: <![CDATA[
    {
        open: /^<!\[CDATA\[/,
        close: /\]\]>/,
        canInterrupt: true,
    },
    // Type 6: block-level tag open/close
    {
        open: editRegex(/^<\/?(block_names)(\s|\/?>|$)/i)
            .replace("block_names", HTML_BLOCKS)
            .getRegex(),
        close: /^$/, // blank line
        canInterrupt: true,
    },
    // Type 7: any open/close tag
    {
        open: HTML_OPEN_CLOSE_TAG_RE,
        close: /^$/, // blank line
        canInterrupt: false,
    },
    {
        open: /^([ \t]*<\/?[a-zA-Z][\w:-]*(\s[^<>]*?)?>[ \t]*)+$/,
        close: /^.*$/,
        canInterrupt: true,
    },
]

export function parseHtmlInline(
    src: string,
    start: number,
    tokenizer: InlineTokenizer
): HTMLToken | null {
    if (src[start] !== "<") return null
    const second = src[start + 1]
    if (!second || !/[!/?A-Za-z]/.test(second)) return null

    const match = HTML_TAG_RE.exec(src.slice(start))
    if (!match) return null

    const tag = match[0]

    // Update link level (needed to correctly nest <a>)
    if (HTML_LINK_OPEN.test(tag)) {
        tokenizer.addLinkLevel(1)
    } else if (HTML_LINK_CLOSE.test(tag)) {
        tokenizer.addLinkLevel(-1)
    }

    return {
        type: "html",
        content: tag,
    }
}
