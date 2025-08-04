import { WHITESPACE_CHARS, type Line, type MdToken } from "../utils"
import { type Lexer } from "../lexer"
import {
    checkListExtractor,
    closeFenceCodeBlockCount,
    cutCharFollowedByWhitespace,
    extractCodeBlock,
    extractHeadingId,
    extractOrderedListItem,
    extractUnorderedListItem,
    findOrderedListStartAt,
    flattenJSONintoMap,
    isBlockquote,
    isDefinitionList,
    isFenceCodeBlock,
    isFootnoteRef,
    isHashHeading,
    isHorizontal,
    isHtml,
    isInclude,
    isIncludeCode,
    isMaybeTable,
    isOrderedListItem,
    isRefLink,
    isTable,
    isUnderlineHeading,
    isUnorderedListItem,
    openFenceCodeBlockCount,
    processAlignTable,
    quoteLength,
    rebuildLineWhitespace,
    stripTableBorder,
    tableLineToCells,
} from "./utils"
import { htmlPatterns } from "../html"

interface HeadingToken {
    type: "heading"
    id: string | undefined
    isUnderline: boolean
    headingIndex: string
    depth: number
    tokens: MdToken[]
}

interface CodeBlockToken {
    type: "codeblock"
    from: number | undefined
    to: number | undefined
    lang: string | undefined
    content: string
}

interface HorizontalToken {
    type: "horizontal"
    character: string
}

interface ParagraphToken {
    type: "paragraph"
    lines: number
    tokens: MdToken[]
}

interface BlockQuoteToken {
    type: "blockquote"
    tokens: MdToken[]
}

interface ListItemToken {
    type: "listItem"
    task: boolean
    checked: boolean
    tokens: MdToken[]
}

interface ListToken {
    type: "list"
    startAt: string | undefined
    ordered: boolean
    items: ListItemToken[]
}

interface TableCellToken {
    type: "cell"
    header: boolean
    align: "default" | "left" | "center" | "right"
    tokens: MdToken[]
}

interface TableToken {
    type: "table"
    header: TableCellToken[]
    rows: TableCellToken[][]
}

interface DefinitionListItemToken {
    type: "definitionListItem"
    term: MdToken[]
    definitions: MdToken[][]
}

interface DefinitionListToken {
    type: "definitionList"
    items: DefinitionListItemToken[]
}

interface TexToken {
    type: "tex"
    text: string
    inline: boolean
    displayMode: boolean
}

interface SpoilerToken {
    type: "spoiler"
    title: MdToken[]
    inline: boolean
    tokens: MdToken[]
}

interface IncludeToken {
    type: "include"
    tokens: MdToken[]
}

export interface HTMLToken {
    type: "html"
    content: string
}

interface FootnoteEndToken {
    type: "footnoteEnd"
}

export type MdBlockToken =
    | HeadingToken
    | CodeBlockToken
    | HorizontalToken
    | BlockQuoteToken
    | ListToken
    | ListItemToken
    | TableToken
    | TableCellToken
    | DefinitionListToken
    | DefinitionListItemToken
    | TexToken
    | SpoilerToken
    | IncludeToken
    | HTMLToken
    | ParagraphToken
    | FootnoteEndToken

export interface BlockTokenizerOptions {
    lexer: Lexer
    lines: Line[]
}

const dashMatch = /^-{3,}$/

export class BlockTokenizer {
    lexer: Lexer
    level: number = 0
    line: number = 0
    content: Line[]
    private blockTokens: MdToken[] = []
    constructor(options: BlockTokenizerOptions) {
        this.lexer = options.lexer
        this.content = options.lines
    }
    async initialize(): Promise<this> {
        if (!this.lexer.started) {
            if (this.line < this.content.length) {
                const start = this.content[this.line].content.trimEnd()
                const dashes = dashMatch.exec(start)
                if (dashes !== null) {
                    const [rowDashes] = dashes
                    let line = this.line + 1
                    const startIndex = this.line
                    let endIndex: number | undefined = undefined
                    while (line < this.content.length) {
                        const maybeEnd = this.content[line].content.trimEnd()
                        const dashEnd = dashMatch.exec(maybeEnd)
                        if (
                            dashEnd !== null &&
                            dashEnd[0].length === rowDashes.length
                        ) {
                            endIndex = line
                            break
                        }
                        line++
                    }
                    if (endIndex) {
                        const meta = this.content
                            .slice(startIndex + 1, endIndex)
                            .map((l) => l.content)
                            .join("\n")
                        try {
                            if (this.lexer.frontMatter) {
                                const json = await this.lexer.frontMatter(meta)
                                flattenJSONintoMap(json, this.lexer.metadata)
                                this.line = line
                            } else {
                                const json = JSON.parse(meta)
                                flattenJSONintoMap(json, this.lexer.metadata)
                                this.line = line
                            }
                        } catch (_) {
                            this.line = startIndex
                        }
                    }
                }
            }
        }
        this.lexer.started = true
        return this
    }
    async getBlock(pskip = false): Promise<MdToken | undefined> {
        let token: MdToken | undefined = this.hashHeading()
        if (token) {
            return token
        }
        token = await this.blockQuote()
        if (token) {
            return token
        }
        token = await this.orderedList()
        if (token) {
            return token
        }
        token = this.tex()
        if (token) {
            return token
        }
        token = await this.unorderedList(pskip)
        if (token) {
            return token
        }
        token = this.fenceCodeBlock()
        if (token) {
            return token
        }
        token = this.table()
        if (token) {
            return token
        }
        token = await this.spoiler()
        if (token) {
            return token
        }
        token = await this.include()
        if (token) {
            return token
        }
        token = await this.includeCode()
        if (token) {
            return token
        }
        token = this.html()
        if (token) {
            return token
        }
        token = this.horizontal(pskip)
        if (token) {
            return token
        }
        if (!pskip) {
            token = this.codeBlock()
            if (token) {
                return token
            }
        }
        return undefined
    }
    async tokenize(): Promise<this> {
        while (
            this.line < this.content.length &&
            this.level <= this.content[this.line].level
        ) {
            if (await this.footnoteDef()) {
                continue
            }
            if (this.reflink()) {
                continue
            }
            const token = await this.getBlock()
            if (token) {
                this.addToken(token)
                continue
            } else {
                await this.paragraph()
            }
        }
        return this
    }
    getBlocks() {
        return this.blockTokens
    }
    hashHeading(): HeadingToken | undefined {
        if (this.level < this.content[this.line].level) {
            return undefined
        }
        const content = this.content[this.line].content
        let i = 0
        let hashes = 0
        while (i < content.length && content[i] === "#") {
            hashes++
            i++
        }
        if (hashes > 6 || hashes === 0) {
            return undefined
        }
        const isIndexed = i < content.length && content[i] === "!"
        if (isIndexed) {
            i++
        }
        if (i < content.length && WHITESPACE_CHARS.has(content[i])) {
            const { id, text } = extractHeadingId(
                content.slice(i, content.length)
            )
            this.line++
            const depth = Math.max(
                1,
                Math.min(hashes + this.lexer.headingShift, 6)
            )
            const headingIndex = isIndexed ? this.lexer.newHeading(depth) : ""
            return {
                type: "heading",
                id: id !== undefined ? id : this.lexer.slugger.slug(text),
                isUnderline: false,
                headingIndex,
                depth,
                tokens: this.lexer.inlineLex(text),
            }
        } else if (i === content.length) {
            this.line++
            const depth = Math.max(
                1,
                Math.min(hashes + this.lexer.headingShift, 6)
            )
            const headingIndex = isIndexed ? this.lexer.newHeading(depth) : ""
            return {
                type: "heading",
                id: undefined,
                isUnderline: false,
                headingIndex,
                depth,
                tokens: [],
            }
        }
        return undefined
    }
    codeBlock(): CodeBlockToken | undefined {
        if (this.level < this.content[this.line].level) {
            const removeSpaces = (this.level + 1) * this.lexer.tabulation
            const content = [
                extractCodeBlock(removeSpaces, this.content[this.line++]),
            ]
            while (
                this.line < this.content.length &&
                this.content[this.line].level > this.level
            ) {
                content.push(
                    extractCodeBlock(removeSpaces, this.content[this.line++])
                )
            }
            return {
                type: "codeblock",
                lang: undefined,
                from: undefined,
                to: undefined,
                content: content.join("\r\n"),
            }
        }
        return undefined
    }
    fenceCodeBlock(): CodeBlockToken | undefined {
        const currentToken = this.content[this.line]
        if (this.level < currentToken.level) {
            return undefined
        }
        const fenceStartLine = currentToken.content.trimEnd()
        const fenceCount = openFenceCodeBlockCount(fenceStartLine)
        if (!fenceCount) {
            return undefined
        }
        const lang =
            fenceStartLine.length !== fenceCount
                ? fenceStartLine.slice(fenceCount, fenceStartLine.length)
                : undefined
        const startIndex = ++this.line
        let foundEnd = false
        while (
            this.line < this.content.length &&
            this.level <= this.content[this.line].level
        ) {
            const fc = closeFenceCodeBlockCount(
                this.content[this.line].content.trimEnd()
            )
            if (fc && fc >= fenceCount) {
                foundEnd = true
                this.line++
                break
            }
            this.line++
        }
        const wsCount = currentToken.level * this.lexer.tabulation
        const content = this.content
            .slice(startIndex, foundEnd ? this.line - 1 : this.line)
            .map((l) => extractCodeBlock(wsCount, l))
            .join("\r\n")
        return {
            type: "codeblock",
            lang,
            from: undefined,
            to: undefined,
            content,
        }
    }
    async spoiler(): Promise<SpoilerToken | undefined> {
        const currentToken = this.content[this.line]
        if (this.level < currentToken.level) {
            return undefined
        }
        const opening = currentToken.content.trimEnd()
        if (opening.length > 1 && opening[0] === "!" && opening[1] === ">") {
            const title =
                opening.length > 2
                    ? opening.slice(2, opening.length).trimStart()
                    : ""
            const startIndex = ++this.line
            while (this.line < this.content.length) {
                if (this.content[this.line].content.trimEnd() === "<!") {
                    break
                }
                this.line++
            }
            const tokens = await new BlockTokenizer({
                lexer: this.lexer,
                lines: this.content.slice(startIndex, this.line),
            }).tokenize()
            this.line++
            return {
                type: "spoiler",
                title: this.lexer.inlineLex(title),
                inline: false,
                tokens: tokens.getBlocks(),
            }
        }
        return undefined
    }
    tex(): TexToken | undefined {
        const currentLine = this.content[this.line]
        if (this.level < currentLine.level) {
            return undefined
        }
        if (
            currentLine.content.trimEnd().length == 2 &&
            currentLine.content[0] === "$" &&
            currentLine.content[1] === "$"
        ) {
            this.line++
            const result: string[] = []
            while (this.line < this.content.length) {
                const line = this.content[this.line++].content.trimEnd()
                if (line === "$$") {
                    break
                }
                if (line.length === 0) {
                    continue
                }
                result.push(line)
            }
            return {
                type: "tex",
                text: result.join("\n").trim(),
                inline: false,
                displayMode: true,
            }
        }
        return undefined
    }
    horizontal(pskip = false): HorizontalToken | undefined {
        const currentToken = this.content[this.line]
        if (this.level < currentToken.level) {
            return undefined
        }
        const content = currentToken.content.trimEnd()
        let occurences = 0
        let character: string | undefined = undefined
        for (let i = 0; i < content.length; i++) {
            const currChar = content[i]
            if (i !== 0) {
                if (character !== currChar) {
                    character = undefined
                    break
                }
                occurences++
            } else {
                if (
                    currChar === "*" ||
                    (!pskip && currChar === "-") ||
                    currChar === "_"
                ) {
                    character = currChar
                    occurences++
                } else {
                    break
                }
            }
        }
        if (character === undefined || occurences < 3) {
            return undefined
        }
        this.line++
        return {
            type: "horizontal",
            character,
        }
    }
    async blockQuote(): Promise<BlockQuoteToken | undefined> {
        const firstLine = this.content[this.line]
        if (this.level < firstLine.level) {
            return undefined
        }
        // Not blockquote, skip it
        if (!(firstLine.content.length > 0 && firstLine.content[0] === ">")) {
            return undefined
        }
        const lines: Line[] = []
        let skipLastElement = false
        while (this.line < this.content.length) {
            const currentLine = this.content[this.line]
            const currentContent = currentLine.content.trimEnd()
            if (currentContent.length === 0) {
                // 3.
                this.line++
                break
            }
            if (
                isOrderedListItem(currentContent) ||
                isUnorderedListItem(currentContent) ||
                isFenceCodeBlock(this.level, this.line, this.content) ||
                isHashHeading(this.level, this.line, this.content) ||
                isHorizontal(this.level, this.line, this.content) ||
                isTable(this.level, this.line, this.content) ||
                isRefLink(this.level, this.line, this.content) ||
                (this.lexer.includeCode !== undefined &&
                    isIncludeCode(this.level, this.line, this.content)) ||
                (this.lexer.include !== undefined &&
                    isInclude(this.level, this.line, this.content)) ||
                isHtml(this.level, this.line, this.content) ||
                isFootnoteRef(this.level, this.line, this.content)
            ) {
                // Skip blocks
                break
            }
            if (currentContent[0] === ">") {
                // direct blockquote
                if (currentLine.level > firstLine.level) {
                    break
                }
                const reformat = rebuildLineWhitespace(
                    cutCharFollowedByWhitespace(">", currentContent),
                    this.lexer.tabulation
                )
                const fenceCount = openFenceCodeBlockCount(reformat.content)
                const listItem =
                    isOrderedListItem(reformat.content) ||
                    isUnorderedListItem(reformat.content)
                // The following lines won't be the continued paragraph, so we can skip them if needed
                skipLastElement =
                    reformat.level > 0 ||
                    listItem ||
                    fenceCount !== undefined ||
                    quoteLength(reformat.content) === 0
                lines.push(reformat)
            } else if (skipLastElement) {
                // The last part was a blockquote, skip
                break
            } else {
                // This is the ending lines
                const lastLine = lines[lines.length - 1]
                lines[lines.length - 1].content =
                    `${lastLine.content}\n${currentLine.content}`
            }
            this.line++
        }
        const blocks = await new BlockTokenizer({
            lexer: this.lexer,
            lines,
        }).tokenize()
        return {
            type: "blockquote",
            tokens: blocks.getBlocks(),
        }
    }
    async orderedList(): Promise<ListToken | undefined> {
        if (this.level < this.content[this.line].level) {
            return undefined
        }
        const items: ListItemToken[] = []
        const startAt = findOrderedListStartAt(this.content[this.line].content)
        while (this.line < this.content.length) {
            const currentLine = this.content[this.line]
            const currentItem = extractOrderedListItem(
                currentLine.content.trimEnd(),
                this.lexer.tabulation
            )
            if (currentItem) {
                let lines = [currentItem]
                this.line++
                let previousIsEmpty = false
                while (this.line < this.content.length) {
                    const item = this.content[this.line]
                    const itemContent = item.content.trimEnd()
                    if (previousIsEmpty && itemContent.length === 0) {
                        this.line++
                        continue
                    }
                    const isBlock =
                        isOrderedListItem(itemContent) ||
                        isUnorderedListItem(itemContent) ||
                        isFenceCodeBlock(this.level, this.line, this.content) ||
                        isBlockquote(this.level, this.line, this.content) ||
                        isHashHeading(this.level, this.line, this.content) ||
                        isHorizontal(this.level, this.line, this.content) ||
                        isTable(this.level, this.line, this.content) ||
                        isRefLink(this.level, this.line, this.content) ||
                        (this.lexer.includeCode !== undefined &&
                            isIncludeCode(
                                this.level,
                                this.line,
                                this.content
                            )) ||
                        (this.lexer.include !== undefined &&
                            isInclude(this.level, this.line, this.content)) ||
                        isHtml(this.level, this.line, this.content) ||
                        isFootnoteRef(this.level, this.line, this.content)
                    if (
                        (!isBlock &&
                            item.level === this.level &&
                            !previousIsEmpty) ||
                        item.level > this.level ||
                        itemContent.length === 0
                    ) {
                        previousIsEmpty = itemContent.length === 0
                        const removeSpaces =
                            (this.level + 1) * this.lexer.tabulation
                        lines.push({
                            startWs: item.startWs.slice(
                                removeSpaces,
                                item.startWs.length
                            ),
                            level: Math.max(0, item.level - 1),
                            content: item.content,
                        })
                    } else {
                        break
                    }
                    this.line++
                }
                const _tokens = await new BlockTokenizer({
                    lexer: this.lexer,
                    lines,
                }).tokenize()
                const tokens = _tokens.getBlocks()
                if (tokens.length > 0 && tokens[0].type === "paragraph") {
                    const first = tokens.shift()! as ParagraphToken
                    items.push({
                        type: "listItem",
                        task: false,
                        checked: false,
                        tokens: [...first.tokens, ...tokens],
                    })
                } else {
                    items.push({
                        type: "listItem",
                        task: false,
                        checked: false,
                        tokens,
                    })
                }
            } else {
                break
            }
        }
        if (items.length === 0) {
            return undefined
        }
        return {
            type: "list",
            startAt,
            ordered: true,
            items,
        }
    }
    async unorderedList(pskip = false): Promise<ListToken | undefined> {
        const firstElement = this.content[this.line]
        if (this.level < firstElement.level) {
            return undefined
        }
        const symbol =
            firstElement.content.length > 0
                ? firstElement.content[0]
                : undefined
        if (
            symbol === undefined ||
            (symbol !== "-" && symbol !== "*" && symbol !== "+")
        ) {
            return undefined
        }
        const items: ListItemToken[] = []
        while (this.line < this.content.length) {
            const currentLine = this.content[this.line]
            const currentItem = extractUnorderedListItem(
                symbol,
                currentLine.content.trimEnd(),
                this.lexer.tabulation,
                pskip
            )
            if (currentItem) {
                const checkListItem = checkListExtractor(
                    currentItem.content,
                    symbol
                )
                currentItem.content = checkListItem.content
                let lines = [currentItem]
                this.line++
                let previousIsEmpty = false
                while (this.line < this.content.length) {
                    const item = this.content[this.line]
                    const itemContent = item.content.trimEnd()
                    if (previousIsEmpty && itemContent.length === 0) {
                        this.line++
                        continue
                    }
                    const isBlock =
                        isOrderedListItem(itemContent) ||
                        isUnorderedListItem(itemContent) ||
                        isFenceCodeBlock(this.level, this.line, this.content) ||
                        isBlockquote(this.level, this.line, this.content) ||
                        isHashHeading(this.level, this.line, this.content) ||
                        isHorizontal(this.level, this.line, this.content) ||
                        isTable(this.level, this.line, this.content) ||
                        isRefLink(this.level, this.line, this.content) ||
                        (this.lexer.includeCode !== undefined &&
                            isIncludeCode(
                                this.level,
                                this.line,
                                this.content
                            )) ||
                        (this.lexer.include !== undefined &&
                            isInclude(this.level, this.line, this.content)) ||
                        isHtml(this.level, this.line, this.content) ||
                        isFootnoteRef(this.level, this.line, this.content)
                    if (
                        (!isBlock &&
                            item.level === this.level &&
                            !previousIsEmpty) ||
                        item.level > this.level ||
                        itemContent.length === 0
                    ) {
                        previousIsEmpty = itemContent.length === 0
                        const removeSpaces =
                            (this.level + 1) * this.lexer.tabulation
                        lines.push({
                            startWs: item.startWs.slice(
                                removeSpaces,
                                item.startWs.length
                            ),
                            level: Math.max(0, item.level - 1),
                            content: item.content,
                        })
                    } else {
                        break
                    }
                    this.line++
                }
                const _tokens = await new BlockTokenizer({
                    lexer: this.lexer,
                    lines,
                }).tokenize()
                const tokens = _tokens.getBlocks()
                if (tokens.length > 0 && tokens[0].type === "paragraph") {
                    const first = tokens.shift()! as ParagraphToken
                    items.push({
                        type: "listItem",
                        task: checkListItem.todo,
                        checked: checkListItem.checked,
                        tokens: [...first.tokens, ...tokens],
                    })
                } else {
                    items.push({
                        type: "listItem",
                        task: checkListItem.todo,
                        checked: checkListItem.checked,
                        tokens,
                    })
                }
            } else {
                break
            }
        }
        if (items.length === 0) {
            return undefined
        }
        return {
            type: "list",
            startAt: undefined,
            ordered: false,
            items,
        }
    }
    table(): TableToken | undefined {
        const firstElement = this.content[this.line]
        if (
            this.level < firstElement.level ||
            this.line + 1 >= this.content.length
        ) {
            return undefined
        }
        const secondElement = this.content[this.line + 1]
        if (this.level < secondElement.level) {
            return undefined
        }
        const tableAlign = processAlignTable(
            tableLineToCells(stripTableBorder(secondElement.content))
        )
        if (tableAlign !== undefined && isMaybeTable(secondElement.content)) {
            // There is an alignment for table
            const headerCells = tableLineToCells(
                stripTableBorder(firstElement.content)
            )
            if (tableAlign.length === headerCells.length) {
                // Alignment and table are the same
                const header: TableCellToken[] = headerCells.map(
                    (content, i) => ({
                        type: "cell",
                        header: true,
                        align: tableAlign[i],
                        tokens: this.lexer.inlineLex(content),
                    })
                )
                this.line += 2
                const rows: TableCellToken[][] = []
                while (this.line < this.content.length) {
                    const currentItem = this.content[this.line]
                    if (
                        // Shouldn't be one of the following
                        this.level < currentItem.level || // blockcode
                        currentItem.content.trimEnd().length === 0 ||
                        isOrderedListItem(currentItem.content) ||
                        isUnorderedListItem(currentItem.content) ||
                        isFenceCodeBlock(this.level, this.line, this.content) ||
                        isBlockquote(this.level, this.line, this.content) ||
                        isHashHeading(this.level, this.line, this.content) ||
                        isHorizontal(this.level, this.line, this.content) ||
                        isTable(this.level, this.line, this.content) ||
                        isRefLink(this.level, this.line, this.content) ||
                        (this.lexer.includeCode !== undefined &&
                            isIncludeCode(
                                this.level,
                                this.line,
                                this.content
                            )) ||
                        (this.lexer.include !== undefined &&
                            isInclude(this.level, this.line, this.content)) ||
                        isHtml(this.level, this.line, this.content) ||
                        isFootnoteRef(this.level, this.line, this.content)
                    ) {
                        break
                    }
                    const row = tableLineToCells(
                        stripTableBorder(currentItem.content)
                    )
                    // Normalize table
                    while (row.length > header.length) {
                        row.pop()
                    }
                    while (row.length < header.length) {
                        row.push("")
                    }
                    rows.push(
                        row.map((content, i) => ({
                            type: "cell",
                            header: false,
                            align: tableAlign[i],
                            tokens: this.lexer.inlineLex(content),
                        }))
                    )
                    this.line++
                }
                return {
                    type: "table",
                    header,
                    rows,
                }
            }
        }
        return undefined
    }
    async footnoteDef(): Promise<boolean> {
        const currentItem = this.content[this.line]
        if (this.level < currentItem.level) {
            return false
        }
        const match = /^\[\^([^\]]+)\]:\s+(.+)/.exec(currentItem.content)
        if (match) {
            const [_, ref, content] = match
            this.line++
            let lines = [rebuildLineWhitespace(content, this.lexer.tabulation)]
            let previousIsEmpty = false
            while (this.line < this.content.length) {
                const item = this.content[this.line]
                const itemContent = item.content.trimEnd()
                if (previousIsEmpty && itemContent.length === 0) {
                    this.line++
                    continue
                }
                const isBlock =
                    isOrderedListItem(itemContent) ||
                    isUnorderedListItem(itemContent) ||
                    isFenceCodeBlock(this.level, this.line, this.content) ||
                    isBlockquote(this.level, this.line, this.content) ||
                    isHashHeading(this.level, this.line, this.content) ||
                    isHorizontal(this.level, this.line, this.content) ||
                    isTable(this.level, this.line, this.content) ||
                    isRefLink(this.level, this.line, this.content) ||
                    (this.lexer.includeCode !== undefined &&
                        isIncludeCode(this.level, this.line, this.content)) ||
                    (this.lexer.include !== undefined &&
                        isInclude(this.level, this.line, this.content)) ||
                    isHtml(this.level, this.line, this.content) ||
                    isFootnoteRef(this.level, this.line, this.content)
                if (
                    (!isBlock &&
                        item.level === this.level &&
                        !previousIsEmpty) ||
                    item.level > this.level ||
                    itemContent.length === 0
                ) {
                    previousIsEmpty = itemContent.length === 0
                    const removeSpaces =
                        (this.level + 1) * this.lexer.tabulation
                    lines.push({
                        startWs: item.startWs.slice(
                            removeSpaces,
                            item.startWs.length
                        ),
                        level: Math.max(0, item.level - 1),
                        content: item.content,
                    })
                } else {
                    break
                }
                this.line++
            }
            if (!this.lexer.footnoteDefs.has(ref)) {
                const _tokens = await new BlockTokenizer({
                    lexer: this.lexer,
                    lines,
                }).tokenize()
                const tokens = _tokens.getBlocks()
                this.lexer.footnoteDefs.set(ref, tokens)
            }
            return true
        }
        return false
    }
    async include(): Promise<IncludeToken | undefined> {
        const currentItem = this.content[this.line]
        if (
            this.level < currentItem.level ||
            this.lexer.include === undefined ||
            currentItem.content.length < 11
        ) {
            return undefined
        }
        const match =
            /^!INCLUDE\s+(?:['"](.+?)['"]|\((.+?)\))(?:,\s*(?:l\s*(?:(\d+)?(?::(\d+))?)?)?(?:\s*s\s*(\d+))?)?\s*$/i.exec(
                currentItem.content
            )
        if (match) {
            const [_, loc1, loc2, fromStr, toStr, hShift] = match
            const includeLocation = loc1 ?? loc2
            if (this.lexer.includedLocations.has(includeLocation)) {
                return {
                    type: "include",
                    tokens: [],
                }
            }
            let from: number | undefined,
                to: number | undefined,
                headingShifter: number
            try {
                from = fromStr ? Math.max(parseInt(fromStr, 10), 1) : undefined
            } catch (_) {}
            try {
                to = toStr ? Math.max(parseInt(toStr, 10), 1) : undefined
            } catch (_) {}
            try {
                headingShifter = hShift ? parseInt(hShift, 10) : 0
            } catch (_) {
                headingShifter = 0
            }
            this.lexer.includedLocations.add(includeLocation)
            const currentHeadingShift = this.lexer.headingShift
            this.lexer.headingShift = Math.max(
                -6,
                Math.min(currentHeadingShift + headingShifter, 6)
            )
            this.lexer.started = false
            const content = await this.lexer.include(includeLocation, from, to)
            const tokens = content ? await this.lexer.lex(content) : []
            this.lexer.headingShift = currentHeadingShift
            this.lexer.includedLocations.delete(includeLocation)
            this.line++
            return {
                type: "include",
                tokens,
            }
        }
        return undefined
    }
    async includeCode(): Promise<CodeBlockToken | undefined> {
        const currentItem = this.content[this.line]
        if (
            this.level < currentItem.level ||
            this.lexer.includeCode === undefined ||
            currentItem.content.length < 15
        ) {
            return undefined
        }
        const match =
            /^!INCLUDECODE\s+(?:["'](.+?)["']|\((.+?)\))(?:\s*\((\w+)\))?(?:\s*,\s*(?:(\d+)?(?::(\d+))?))?\s*$/i.exec(
                currentItem.content
            )
        if (match) {
            const [raw, includePath, lang, fromStr, toStr] = match
            let from: number | undefined, to: number | undefined
            try {
                from = fromStr ? Math.max(parseInt(fromStr, 10), 1) : undefined
            } catch (_) {}
            try {
                to = toStr ? Math.max(parseInt(toStr, 10), 1) : undefined
            } catch (_) {}
            const content =
                (await this.lexer.includeCode(includePath, from, to)) ?? raw
            this.line++
            return {
                type: "codeblock",
                from,
                to,
                lang,
                content: content ?? undefined,
            }
        }
        return undefined
    }
    html(): HTMLToken | undefined {
        const currentLine = this.content[this.line]
        if (this.level < currentLine.level) {
            return undefined
        }

        const lineText = currentLine.content
        if (!lineText.trim().startsWith("<")) return undefined

        let matchedSeq = null

        for (const seq of htmlPatterns) {
            if (seq.open.test(lineText)) {
                matchedSeq = seq
                break
            }
        }

        if (!matchedSeq) return undefined

        const start = this.line
        let end = this.line + 1

        // If it's not closed on the first line, search for the closing condition
        if (!matchedSeq.close.test(lineText)) {
            while (end < this.content.length) {
                const next = this.content[end]
                if (matchedSeq.close.test(next.content)) {
                    if (next.content.trim().length !== 0) {
                        end += 1
                    }
                    break
                }
                end += 1
            }
        }

        // Join the lines into a single string of HTML content
        const htmlLines = this.content.slice(start, end).map((l) => l.content)
        const content = htmlLines.join("\n")

        this.line = end // Advance the tokenizer's cursor

        return {
            type: "html",
            content,
        }
    }
    async paragraph(): Promise<void> {
        let paragraphLines: Line[] = []
        let tokenFound: MdToken | undefined = undefined
        while (
            this.line < this.content.length &&
            this.level <= this.content[this.line].level
        ) {
            const currentLine = this.content[this.line]
            if (
                this.level > currentLine.level ||
                isRefLink(this.level, this.line, this.content) ||
                isFootnoteRef(this.level, this.line, this.content)
            ) {
                break
            }
            const maybeToken = await this.getBlock(true)
            if (maybeToken) {
                tokenFound = maybeToken
                break
            }
            const content = currentLine.content.trimEnd()
            if (content === "") {
                this.line++
                break
            }
            if (paragraphLines.length > 0) {
                const maybeHeading = isUnderlineHeading(this.level, currentLine)
                if (maybeHeading) {
                    const depth =
                        maybeHeading === "="
                            ? Math.max(
                                  Math.min(this.lexer.headingShift + 1, 6),
                                  1
                              )
                            : Math.max(
                                  Math.min(this.lexer.headingShift + 2, 6),
                                  1
                              )
                    const text = paragraphLines.map((p) => p.content).join(" ")
                    tokenFound = {
                        type: "heading",
                        id: this.lexer.slugger.slug(text),
                        isUnderline: true,
                        headingIndex: "",
                        depth,
                        tokens: this.lexer.inlineLex(text),
                    }
                    paragraphLines = []
                    this.line++
                    break
                }
                const maybeDefinitionList = isDefinitionList(
                    this.level,
                    currentLine
                )
                if (maybeDefinitionList) {
                    const term = paragraphLines.map((p) => p.content).join("\n")
                    const definitions: MdToken[][] = []
                    while (this.line < this.content.length) {
                        const newDefStart = this.content[this.line]
                        const isNewDef = isDefinitionList(
                            this.level,
                            newDefStart
                        )
                        if (isNewDef) {
                            const fistLine = rebuildLineWhitespace(
                                newDefStart.content.slice(
                                    2,
                                    newDefStart.content.length
                                ),
                                this.lexer.tabulation
                            )
                            this.line++
                            const newDef = [fistLine]
                            while (this.line < this.content.length) {
                                const newCurrentLine = this.content[this.line]
                                const currentContent =
                                    newCurrentLine.content.trimEnd()
                                if (
                                    currentContent.length !== 0 &&
                                    this.level >= newCurrentLine.level
                                ) {
                                    break
                                } else if (currentContent.length === 0) {
                                    this.line++
                                    continue
                                }
                                const removeSpaces =
                                    (this.level + 1) * this.lexer.tabulation
                                newDef.push({
                                    startWs: newCurrentLine.startWs.slice(
                                        removeSpaces,
                                        newCurrentLine.startWs.length
                                    ),
                                    level: Math.max(
                                        0,
                                        newCurrentLine.level - 1
                                    ),
                                    content: newCurrentLine.content,
                                })
                                this.line++
                            }
                            const item = await new BlockTokenizer({
                                lexer: this.lexer,
                                lines: newDef,
                            }).tokenize()
                            definitions.push(item.getBlocks())
                        } else {
                            break
                        }
                    }
                    tokenFound = {
                        type: "definitionListItem",
                        term: this.lexer.inlineLex(term),
                        definitions,
                    }
                    paragraphLines = []
                    break
                }
            }
            paragraphLines.push({
                level: this.content[this.line].level,
                startWs: this.content[this.line].startWs,
                content,
            })
            this.line++
        }
        if (paragraphLines.length === 0) {
            this.addToken(tokenFound)
            return
        }
        this.blockTokens.push({
            type: "paragraph",
            lines: paragraphLines.length,
            tokens: this.lexer.inlineLex(
                paragraphLines.map((p) => p.content).join("\n")
            ),
        })
        this.addToken(tokenFound)
    }
    reflink(): boolean {
        const currentItem = this.content[this.line]
        if (this.level < currentItem.level) {
            return false
        }
        const match =
            /^\[([^\]]+)\]:\s+(?:<(\S+)>|(\S+))(?:\s+(?:"([^"]+)"|'([^']+)'|\(([^)]+)\)))?$/.exec(
                currentItem.content
            )
        if (match) {
            const [_, ref, linkA, linkB, titleA, titleB, titleC] = match
            const link = linkA || linkB
            const title: string | undefined =
                titleA ?? titleB ?? titleC ?? undefined
            this.line++
            if (!this.lexer.reflinks.has(ref)) {
                this.lexer.reflinks.set(ref, {
                    link,
                    title,
                })
            }
            return true
        }
        return false
    }
    addToken(tokenFound: MdToken | undefined) {
        if (tokenFound) {
            if (tokenFound.type === "definitionListItem") {
                if (this.blockTokens.length > 0) {
                    const lastToken =
                        this.blockTokens[this.blockTokens.length - 1]
                    if (lastToken.type === "definitionList") {
                        lastToken.items.push(tokenFound)
                    } else {
                        this.blockTokens.push({
                            type: "definitionList",
                            items: [tokenFound],
                        })
                    }
                } else {
                    this.blockTokens.push({
                        type: "definitionList",
                        items: [tokenFound],
                    })
                }
            } else {
                this.blockTokens.push(tokenFound)
            }
        }
    }
}
