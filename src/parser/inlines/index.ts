import { type Lexer } from "../lexer"
import { type MdToken } from "../utils"
import { parseHtmlInline } from "../html"
import {
    ENDING_STARS,
    ESCAPING_CHARS,
    INLINE_KIND_CHARS,
    matchLink,
    matchReferenceLink,
    parseAutolink,
} from "./utils"

interface TextToken {
    type: "text"
    text: string
}

interface BoldToken {
    type: "bold"
    tokens: MdToken[]
}

interface UnderlineToken {
    type: "underline"
    tokens: MdToken[]
}

interface ItalicToken {
    type: "italic"
    tokens: MdToken[]
}

interface HighlightToken {
    type: "highlight"
    tokens: MdToken[]
}

interface StrikethroughToken {
    type: "strikethrough"
    tokens: MdToken[]
}

interface OverlineToken {
    type: "overline"
    tokens: MdToken[]
}

interface EmojiToken {
    type: "emoji"
    name: string
}

interface NewLineToken {
    type: "newline"
}

interface FootnoteRefToken {
    type: "footnoteRef"
    ref: string
}

interface ImageToken {
    type: "image"
    alt: string
    href: string
    title: string | undefined
}

interface LinkToken {
    type: "link"
    label: MdToken[]
    href: string
    title: string | undefined
}

interface RefLinkToken {
    type: "reflink"
    label: MdToken[]
    ref: string
}

interface CodespanToken {
    type: "codespan"
    text: string
}

interface MetadataToken {
    type: "metadata"
    name: string
    value: string | number | boolean | BigInt | undefined
}

interface YoutubeToken {
    type: "youtubeEmbed"
    title: string
    attributes: Record<string, string>
}

export type MdInlineToken =
    | TextToken
    | YoutubeToken
    | OverlineToken
    | MetadataToken
    | CodespanToken
    | LinkToken
    | RefLinkToken
    | ImageToken
    | FootnoteRefToken
    | NewLineToken
    | HighlightToken
    | StrikethroughToken
    | EmojiToken
    | UnderlineToken
    | BoldToken
    | ItalicToken

export interface InlineTokenizerOptions {
    parent?: InlineTokenizer
    lexer: Lexer
    content: string
    linkLevel?: number
}

export class InlineTokenizer {
    lexer: Lexer
    parent: InlineTokenizer | undefined
    index: number = 0
    content: string
    textBuffer: string = ""
    linkLevel: number
    constructor(options: InlineTokenizerOptions) {
        this.content = options.content
        this.lexer = options.lexer
        this.linkLevel = options?.linkLevel ?? 0
    }
    addLinkLevel(n: number) {
        this.linkLevel += n
        if (this.parent !== undefined) {
            this.parent.addLinkLevel(n)
        }
    }
    #cleanBuffer(result: MdToken[]) {
        if (this.textBuffer.length > 0) {
            result.push({
                type: "text",
                text: this.textBuffer,
            })
            this.textBuffer = ""
        }
    }
    #extractBuffer() {
        const buffer = this.textBuffer
        this.textBuffer = ""
        return buffer
    }
    #symbolCounter(currentSymbol: string, maxCount: number) {
        let count = 0
        while (count < maxCount && this.index < this.content.length) {
            if (this.content[this.index] !== currentSymbol) {
                break
            }
            count++
            this.index++
        }
        return count
    }
    tokenize(stop?: (i: number, src: string) => boolean): MdToken[] {
        const result: MdToken[] = []
        while (this.index < this.content.length) {
            if (
                this.content[this.index] === "\\" &&
                this.index + 1 < this.content.length &&
                ESCAPING_CHARS.has(this.content[this.index + 1])
            ) {
                this.textBuffer += this.content[this.index + 1]
                this.index += 2
                continue
            }
            if (stop && stop(this.index, this.content)) {
                break
            }
            const currentSymbol = this.content[this.index]
            switch (currentSymbol) {
                case "\r":
                    this.index++
                    break
                case "\n":
                    this.#cleanBuffer(result)
                    this.index++
                    result.push({
                        type: "newline",
                    })
                    break
                case "/":
                    if (
                        this.index + 1 < this.content.length &&
                        this.content[this.index + 1] === "/"
                    ) {
                        this.#cleanBuffer(result)
                        this.index += 2
                        while (this.index < this.content.length) {
                            if (this.content[this.index] === "\n") {
                                break
                            }
                            this.index++
                        }
                    } else if (
                        this.index + 1 < this.content.length &&
                        this.content[this.index + 1] === "*"
                    ) {
                        this.#cleanBuffer(result)
                        this.index += 2
                        while (this.index < this.content.length) {
                            if (
                                this.content[this.index] === "\\" &&
                                this.index + 1 < this.content.length &&
                                ESCAPING_CHARS.has(this.content[this.index + 1])
                            ) {
                                this.index += 2
                                continue
                            }
                            if (
                                this.content[this.index] === "*" &&
                                this.index + 1 < this.content.length &&
                                this.content[this.index] === "/"
                            ) {
                                this.index += 2
                                break
                            }
                            this.index++
                        }
                    } else {
                        this.textBuffer += currentSymbol
                        this.index++
                    }
                    break
                case "{":
                    if (
                        this.index + 1 < this.content.length &&
                        this.content[this.index + 1] === "{"
                    ) {
                        const lastIndex = this.index + 1
                        this.index += 2
                        let endMeta = false
                        while (this.index < this.content.length) {
                            if (
                                this.content[this.index] === "\n" ||
                                (this.content[this.index] === "}" &&
                                    this.index + 1 < this.content.length &&
                                    this.content[this.index + 1] === "}")
                            ) {
                                endMeta = this.content[this.index] !== "\n"
                                break
                            }
                            this.index++
                        }
                        if (endMeta) {
                            this.#cleanBuffer(result)
                            const name = this.content.slice(
                                lastIndex + 1,
                                this.index
                            )
                            result.push({
                                type: "metadata",
                                name,
                                value: this.lexer.metadata.get(name),
                            })
                            this.index += 2
                        } else {
                            this.textBuffer += currentSymbol
                            this.index = lastIndex
                        }
                    } else {
                        this.textBuffer += currentSymbol
                        this.index++
                    }
                    break
                case "`":
                    let backtickCount = 0
                    while (this.index < this.content.length) {
                        if (this.content[this.index] !== "`") {
                            break
                        }
                        backtickCount++
                        this.index++
                    }
                    const startBackticksContent = this.index
                    let closeBackticksCount = backtickCount
                    while (this.index < this.content.length) {
                        if (this.content[this.index] === "\n") {
                            break
                        }
                        if (this.content[this.index] === "`") {
                            while (this.index < this.content.length) {
                                if (this.content[this.index] !== "`") {
                                    break
                                }
                                closeBackticksCount--
                                this.index++
                            }
                            if (closeBackticksCount === 0) {
                                break
                            } else {
                                closeBackticksCount = backtickCount
                                continue
                            }
                        }
                        this.index++
                    }
                    if (closeBackticksCount === 0) {
                        this.#cleanBuffer(result)
                        const content = this.content.slice(
                            startBackticksContent,
                            this.index - backtickCount
                        )
                        result.push({
                            type: "codespan",
                            text: content,
                        })
                    } else {
                        ;((this.textBuffer += this.content.slice(
                            startBackticksContent - backtickCount,
                            startBackticksContent
                        )),
                            (this.index = startBackticksContent))
                    }
                    break
                case "!":
                    if (
                        this.index + 1 < this.content.length &&
                        this.content[this.index + 1] === "["
                    ) {
                        const link = matchLink(this.content, ++this.index)
                        if (link !== null) {
                            this.#cleanBuffer(result)
                            result.push({
                                type: "image",
                                alt: link.label,
                                href: link.href ?? "",
                                title: link.title,
                            })
                            this.index = link.end
                        } else {
                            this.textBuffer += "!"
                        }
                    } else {
                        const match = /^!YOUTUBE\[(.*?)\]\{(.*?)\}/.exec(
                            this.content.slice(this.index)
                        )
                        if (match !== null) {
                            const [raw, text, attrString] = match
                            const attrs: Record<string, string> = {}

                            // Parse key="value" pairs
                            attrString
                                .match(/(\w+)="(.*?)"/g)
                                ?.forEach((pair) => {
                                    const [key, val] = pair.split("=")
                                    if (key && val) {
                                        attrs[key] = val.replace(/^"|"$/g, "")
                                    }
                                })

                            if (!attrs.vid) {
                                this.textBuffer += currentSymbol
                                this.index++
                            } else {
                                this.#cleanBuffer(result)
                                result.push({
                                    type: "youtubeEmbed",
                                    title: text,
                                    attributes: attrs,
                                })
                                this.index += raw.length
                            }
                        } else {
                            this.textBuffer += currentSymbol
                            this.index++
                        }
                    }
                    break
                case "[":
                    if (this.linkLevel < 1) {
                        const link = matchLink(this.content, this.index)
                        if (link !== null) {
                            this.#cleanBuffer(result)
                            result.push({
                                type: "link",
                                label: this.lexer.inlineLex(link.label),
                                href: link.href ?? "",
                                title: link.title,
                            })
                            this.index = link.end
                        } else {
                            const refLink = matchReferenceLink(
                                this.content,
                                this.index
                            )
                            if (refLink) {
                                this.#cleanBuffer(result)
                                if (refLink.footnote) {
                                    result.push({
                                        type: "footnoteRef",
                                        ref: refLink.ref,
                                    })
                                    if (
                                        !this.lexer.footnoteIndexMap.has(
                                            refLink.ref
                                        )
                                    ) {
                                        const nextIndex =
                                            this.lexer.footnoteIndexMap.size + 1
                                        this.lexer.footnoteIndexMap.set(
                                            refLink.ref,
                                            nextIndex
                                        )
                                        this.lexer.footnoteRef.set(
                                            nextIndex,
                                            refLink.ref
                                        )
                                    }
                                } else {
                                    result.push({
                                        type: "reflink",
                                        label: this.lexer.inlineLex(
                                            refLink.label
                                        ),
                                        ref: refLink.ref,
                                    })
                                }
                                this.index = refLink.end
                            } else {
                                this.textBuffer += "["
                                this.index++
                            }
                        }
                    } else {
                        const refLink = matchReferenceLink(
                            this.content,
                            this.index
                        )
                        if (refLink !== null && refLink.footnote) {
                            this.#cleanBuffer(result)
                            result.push({
                                type: "footnoteRef",
                                ref: refLink.ref,
                            })
                            if (!this.lexer.footnoteIndexMap.has(refLink.ref)) {
                                const nextIndex =
                                    this.lexer.footnoteIndexMap.size + 1
                                this.lexer.footnoteIndexMap.set(
                                    refLink.ref,
                                    nextIndex
                                )
                                this.lexer.footnoteRef.set(
                                    nextIndex,
                                    refLink.ref
                                )
                            }
                            this.index = refLink.end
                        } else {
                            this.textBuffer += "["
                            this.index++
                        }
                    }
                    break
                case "$":
                    if (
                        this.index + 1 < this.content.length &&
                        this.content[this.index + 1] === "$"
                    ) {
                        this.index += 2
                        const startIndex = this.index
                        let hasEnd = false
                        while (this.index < this.content.length) {
                            if (
                                this.content[this.index] === "\\" &&
                                this.index + 1 < this.content.length &&
                                ESCAPING_CHARS.has(this.content[this.index + 1])
                            ) {
                                this.index += 2
                                continue
                            }
                            if (
                                this.content[this.index] === "$" &&
                                this.index + 1 < this.content.length &&
                                this.content[this.index + 1] === "$"
                            ) {
                                hasEnd = true
                                break
                            }
                            this.index++
                        }
                        if (hasEnd) {
                            this.#cleanBuffer(result)
                            result.push({
                                type: "tex",
                                inline: true,
                                displayMode: true,
                                text: this.content.slice(
                                    startIndex,
                                    this.index
                                ),
                            })
                            this.index += 2
                        } else {
                            this.textBuffer += currentSymbol
                            this.index = startIndex - 1
                        }
                    } else {
                        const startIndex = ++this.index
                        let hasEnd = false
                        while (this.index < this.content.length) {
                            if (
                                this.content[this.index] === "\\" &&
                                this.index + 1 < this.content.length &&
                                ESCAPING_CHARS.has(this.content[this.index + 1])
                            ) {
                                this.index += 2
                                continue
                            }
                            if (this.content[this.index] === "$") {
                                hasEnd = true
                                break
                            }
                            this.index++
                        }
                        if (hasEnd) {
                            this.#cleanBuffer(result)
                            result.push({
                                type: "tex",
                                inline: true,
                                displayMode: false,
                                text: this.content.slice(
                                    startIndex,
                                    this.index
                                ),
                            })
                            this.index++
                        } else {
                            this.textBuffer += currentSymbol
                            this.index = startIndex
                        }
                    }
                    break
                case "<":
                    if (this.linkLevel < 1) {
                        const autolink = parseAutolink(this.content, this.index)
                        if (autolink !== null) {
                            this.#cleanBuffer(result)
                            this.index = autolink.end
                            result.push({
                                type: "link",
                                label: [
                                    {
                                        type: "text",
                                        text: autolink.content,
                                    },
                                ],
                                href: autolink.url,
                                title: undefined,
                            })
                        } else {
                            const html = parseHtmlInline(
                                this.content,
                                this.index,
                                this
                            )
                            if (html !== null) {
                                this.#cleanBuffer(result)
                                result.push({
                                    type: "html",
                                    content: html.content,
                                })
                                this.index += html.content.length
                            } else {
                                this.textBuffer += currentSymbol
                                this.index++
                            }
                        }
                    } else {
                        const html = parseHtmlInline(
                            this.content,
                            this.index,
                            this
                        )
                        if (html !== null) {
                            this.#cleanBuffer(result)
                            result.push({
                                type: "html",
                                content: html.content,
                            })
                            this.index += html.content.length
                        } else {
                            this.textBuffer += currentSymbol
                            this.index++
                        }
                    }
                    break
                case ">":
                    if (
                        this.index + 1 < this.content.length &&
                        this.content[this.index + 1] === "!"
                    ) {
                        const buffer = this.#extractBuffer()
                        const nextIndex = this.index + 1
                        this.index += 2
                        const tokens = this.tokenize(
                            (i, src) =>
                                src[i] === "\n" ||
                                (i + 1 < src.length &&
                                    src[i] === "!" &&
                                    src[i + 1] === "<")
                        )
                        if (
                            this.index < this.content.length &&
                            this.content[this.index] === "!" &&
                            this.index + 1 < this.content.length &&
                            this.content[this.index + 1] === "<"
                        ) {
                            this.index += 2
                            this.textBuffer = buffer
                            this.#cleanBuffer(result)
                            result.push({
                                type: "spoiler",
                                index: -1,
                                title: [],
                                inline: true,
                                tokens,
                            })
                        } else {
                            this.index = nextIndex
                            this.textBuffer = `${buffer}>`
                        }
                    } else {
                        this.textBuffer += currentSymbol
                        this.index++
                    }
                    break
                case ":":
                    const from = ++this.index
                    let isFound = false
                    while (this.index < this.content.length) {
                        isFound = this.content[this.index] === currentSymbol
                        if (
                            isFound ||
                            this.content[this.index] === "\\" ||
                            this.content[this.index] === "\n"
                        ) {
                            break
                        }
                        this.index++
                    }
                    if (isFound) {
                        const name = this.content.slice(from, this.index)
                        if (this.lexer.emojis[name] !== undefined) {
                            this.#cleanBuffer(result)
                            result.push({
                                type: "emoji",
                                name,
                            })
                            this.index++
                        } else {
                            this.textBuffer += currentSymbol
                            this.index = from
                        }
                    } else {
                        this.textBuffer += currentSymbol
                        this.index = from
                    }
                    break
                case "=":
                case "~":
                case "|":
                case "^":
                    const startDualIndex = this.index + 1
                    if (this.#symbolCounter(currentSymbol, 2) === 2) {
                        const buffer = this.#extractBuffer()
                        const tokens = this.tokenize(
                            ENDING_STARS.get("double")!(currentSymbol)
                        )
                        if (
                            this.index < this.content.length &&
                            this.content[this.index] === currentSymbol &&
                            this.index + 1 < this.content.length &&
                            this.content[this.index + 1] === currentSymbol
                        ) {
                            this.textBuffer = buffer
                            this.#cleanBuffer(result)
                            if (currentSymbol === "|") {
                                result.push({
                                    type: "spoiler",
                                    index: -1,
                                    title: [],
                                    inline: true,
                                    tokens,
                                })
                            } else {
                                const type =
                                    currentSymbol === "~"
                                        ? "strikethrough"
                                        : currentSymbol === "="
                                          ? "highlight"
                                          : "overline"
                                result.push({
                                    type,
                                    tokens,
                                })
                            }
                            this.index += 2
                        } else {
                            this.textBuffer = `${buffer}${currentSymbol}`
                            this.index = startDualIndex
                        }
                    } else {
                        this.textBuffer += currentSymbol
                        this.index = startDualIndex
                    }
                    break
                case "_":
                case "*":
                    const startStarIndex = this.index + 1
                    const buffer = this.#extractBuffer()
                    let count = this.#symbolCounter(currentSymbol, 3)
                    if (count === 3) {
                        // bold italic
                        const tokens = this.tokenize(
                            (i, src) => src[i] === currentSymbol
                        )
                        while (count > 0 && this.index < this.content.length) {
                            if (this.content[this.index] !== currentSymbol) {
                                break
                            }
                            count--
                            this.index++
                        }
                        if (count === 0) {
                            this.textBuffer = buffer
                            this.#cleanBuffer(result)
                            result.push({
                                type:
                                    currentSymbol === "_"
                                        ? "underline"
                                        : "bold",
                                tokens: [
                                    {
                                        type: "italic",
                                        tokens,
                                    },
                                ],
                            })
                        } else if (count < 3) {
                            if (count === 2) {
                                // Bold / underline
                                const endingFn =
                                    currentSymbol === "_" ? "underline" : "bold"
                                const lastTokens = this.tokenize(
                                    ENDING_STARS.get(
                                        INLINE_KIND_CHARS.get(endingFn)!
                                    )!(currentSymbol)
                                )
                                if (
                                    this.index < this.content.length &&
                                    this.content[this.index] ===
                                        currentSymbol &&
                                    this.index + 1 < this.content.length &&
                                    this.content[this.index + 1] ===
                                        currentSymbol
                                ) {
                                    this.textBuffer = buffer
                                    this.#cleanBuffer(result)
                                    result.push({
                                        type:
                                            currentSymbol === "_"
                                                ? "underline"
                                                : "bold",
                                        tokens: [
                                            {
                                                type: "italic",
                                                tokens,
                                            },
                                            ...lastTokens,
                                        ],
                                    })
                                    this.index += count
                                } else {
                                    this.textBuffer = `${buffer}${currentSymbol}`
                                    this.index = startStarIndex
                                }
                            } else {
                                // Italic
                                const lastTokens = this.tokenize(
                                    ENDING_STARS.get(
                                        INLINE_KIND_CHARS.get("italic")!
                                    )!(currentSymbol)
                                )
                                if (
                                    this.index < this.content.length &&
                                    this.content[this.index] === currentSymbol
                                ) {
                                    this.textBuffer = buffer
                                    this.#cleanBuffer(result)
                                    result.push({
                                        type: "italic",
                                        tokens: [
                                            {
                                                type:
                                                    currentSymbol === "_"
                                                        ? "underline"
                                                        : "bold",
                                                tokens,
                                            },
                                            ...lastTokens,
                                        ],
                                    })
                                    this.index += count
                                } else {
                                    this.textBuffer = `${buffer}${currentSymbol}`
                                    this.index = startStarIndex
                                }
                            }
                        } else {
                            this.textBuffer = `${buffer}${currentSymbol}`
                            this.index = startStarIndex
                        }
                    } else {
                        // bold / underline or italic
                        if (count === 2) {
                            // Bold / underline
                            const endingFn =
                                currentSymbol === "_" ? "underline" : "bold"
                            const tokens = this.tokenize(
                                ENDING_STARS.get(
                                    INLINE_KIND_CHARS.get(endingFn)!
                                )!(currentSymbol)
                            )
                            if (
                                this.index < this.content.length &&
                                this.content[this.index] === currentSymbol &&
                                this.index + 1 < this.content.length &&
                                this.content[this.index + 1] === currentSymbol
                            ) {
                                this.textBuffer = buffer
                                this.#cleanBuffer(result)
                                result.push({
                                    type: endingFn,
                                    tokens,
                                })
                                this.index += count
                            } else {
                                this.textBuffer = `${buffer}${currentSymbol}`
                                this.index = startStarIndex
                            }
                        } else {
                            // Italic
                            const tokens = this.tokenize(
                                ENDING_STARS.get(
                                    INLINE_KIND_CHARS.get("italic")!
                                )!(currentSymbol)
                            )
                            if (
                                this.index < this.content.length &&
                                this.content[this.index] === currentSymbol
                            ) {
                                this.textBuffer = buffer
                                this.#cleanBuffer(result)
                                result.push({
                                    type: "italic",
                                    tokens,
                                })
                                this.index += count
                            } else {
                                this.textBuffer = `${buffer}${currentSymbol}`
                                this.index = startStarIndex
                            }
                        }
                    }
                    break
                default:
                    this.textBuffer += this.content[this.index++]
                    break
            }
        }
        this.#cleanBuffer(result)
        return result
    }
}
