type InlineCharacter = "*" | "_" | "=" | ":" | "~" | "|" | "^"

export const ENDING_STARS = new Map<
    "double" | "single",
    (s: InlineCharacter) => (i: number, src: string) => boolean
>([
    [
        "double",
        (s: InlineCharacter) => (i: number, src: string) =>
            src[i] === "\n" ||
            (i + 1 < src.length && src[i] === s && src[i + 1] === s),
    ],
    [
        "single",
        (s: InlineCharacter) => (i: number, src: string) =>
            src[i] === "\n" || src[i] === s,
    ],
])

export const INLINE_KIND_CHARS = new Map<string, "double" | "single">([
    ["bold", "double"],
    ["underline", "double"],
    ["italic", "single"],
])

export const ESCAPING_CHARS = new Set([
    "\\",
    "`",
    "*",
    "_",
    "{",
    "}",
    "[",
    "]",
    "<",
    ">",
    "(",
    ")",
    "#",
    "+",
    "-",
    ".",
    "!",
    "|",
    "^",
    "$",
])

const AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)$/
const EMAIL_RE =
    /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/

function parseLinkDestination(
    src: string,
    start: number
): { href: string; end: number } | null {
    let i = start
    if (src[i] === "<") {
        i++
        let href = ""
        while (i < src.length) {
            const ch = src[i]
            if (ch === ">") return { href, end: i + 1 }
            if (ch === "\\" && i + 1 < src.length) {
                href += src[i + 1]
                i += 2
            } else if (ch === "\n" || ch === "<") {
                return null
            } else {
                href += ch
                i++
            }
        }
        return null
    } else {
        let href = ""
        let parens = 0
        while (i < src.length) {
            const ch = src[i]
            if (ch === " " || ch === "\n") break
            if (ch === "\\") {
                if (i + 1 < src.length) {
                    href += src[i + 1]
                    i += 2
                } else {
                    break
                }
            } else {
                if (ch === "(") parens++
                if (ch === ")") {
                    if (parens === 0) break
                    parens--
                }
                href += ch
                i++
            }
        }
        if (parens !== 0) return null
        return { href, end: i }
    }
}

function parseLinkLabel(
    src: string,
    start: number
): { label: string; end: number } | null {
    if (src[start] !== "[") return null
    let i = start + 1
    let depth = 1
    let label = ""

    while (i < src.length) {
        const ch = src[i]
        if (ch === "\\" && i + 1 < src.length) {
            label += src[i + 1]
            i += 2
            continue
        }
        if (ch === "[") depth++
        if (ch === "]") {
            depth--
            if (depth === 0) return { label, end: i + 1 }
        }
        if (depth > 0) label += ch
        i++
    }
    return null
}

function parseLinkTitle(
    src: string,
    start: number
): { title: string; end: number } | null {
    const quote = src[start]
    if (!["'", '"', "("].includes(quote)) return null
    const closing = quote === "(" ? ")" : quote

    let i = start + 1
    let title = ""
    while (i < src.length) {
        const ch = src[i]
        if (ch === closing) return { title, end: i + 1 }
        if (ch === "\\" && i + 1 < src.length) {
            title += src[i + 1]
            i += 2
        } else {
            title += ch
            i++
        }
    }
    return null
}

interface LinkMatch {
    label: string
    href?: string
    title?: string
    end: number
}
export function matchLink(src: string, start: number = 0): LinkMatch | null {
    let i = start

    // Check prefix
    if (src[i] !== "[") return null

    // Parse label
    const labelRes = parseLinkLabel(src, i)
    if (!labelRes) return null
    const { label, end: labelEnd } = labelRes
    i = labelEnd

    // Require opening "("
    while (i < src.length && /\s/.test(src[i])) i++
    if (src[i] !== "(") return null
    i++

    // Parse href
    while (i < src.length && /\s/.test(src[i])) i++
    const hrefRes = parseLinkDestination(src, i)
    if (!hrefRes) return null
    const { href, end: hrefEnd } = hrefRes
    i = hrefEnd

    // Optional title
    let title: string | undefined
    while (i < src.length && /\s/.test(src[i])) i++
    const titleRes = parseLinkTitle(src, i)
    if (titleRes) {
        title = titleRes.title
        i = titleRes.end
    }

    while (i < src.length && /\s/.test(src[i])) i++
    if (src[i] !== ")") return null
    i++

    return { label, href, title, end: i }
}

interface ReferenceLinkMatch {
    footnote: boolean
    label: string
    ref: string // the reference label (could be empty or same as label)
    end: number
}
export function matchReferenceLink(
    src: string,
    start: number
): ReferenceLinkMatch | null {
    if (src[start] !== "[") return null

    // First label: [label]
    const label1 = parseLinkLabel(src, start)
    if (!label1) return null

    const labelText = label1.label
    let i = label1.end

    // Full reference: [label][ref]
    if (src[i] === "[") {
        const label2 = parseLinkLabel(src, i)
        if (!label2) return null

        return {
            footnote: false,
            label: labelText,
            ref: label2.label.trim(),
            end: label2.end,
        }
    }

    // Collapsed reference: [label][]
    if (src[i] === "]") {
        return {
            footnote: false,
            label: labelText,
            ref: labelText.trim(),
            end: i + 1,
        }
    }

    // Shortcut reference: [label]
    const tLabel = labelText.trim()
    if (tLabel.startsWith("^")) {
        const cutLabel = tLabel.slice(1, tLabel.length)
        return {
            footnote: true,
            label: cutLabel,
            ref: cutLabel,
            end: label1.end,
        }
    }
    return {
        footnote: false,
        label: labelText,
        ref: tLabel,
        end: label1.end,
    }
}

interface AutolinkNode {
    type: "autolink"
    url: string
    content: string
    end: number
}
export function parseAutolink(src: string, start: number): AutolinkNode | null {
    if (src[start] !== "<") return null

    let pos = start + 1
    while (pos < src.length && src[pos] !== ">" && src[pos] !== "<") {
        pos++
    }

    if (src[pos] !== ">") return null

    const rawUrl = src.slice(start + 1, pos)

    const isAutolink = AUTOLINK_RE.test(rawUrl)
    const isEmail = EMAIL_RE.test(rawUrl)

    if (!isAutolink && !isEmail) return null

    const href = isAutolink ? rawUrl : `mailto:${rawUrl}`
    const content = rawUrl

    return {
        type: "autolink",
        url: href,
        content,
        end: pos + 1,
    }
}
