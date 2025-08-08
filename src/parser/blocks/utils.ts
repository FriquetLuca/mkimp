import { htmlPatterns } from "../html"
import { WHITESPACE_CHARS, type Line } from "../utils"

export const DIGIT_CHARS = new Set([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
])

export function flattenJSONintoMap(
    obj: any,
    map: Map<string, string | number | boolean | BigInt>,
    prefix = ""
) {
    if (typeof obj !== "object" || obj === null) {
        const isCorrectType =
            typeof obj === "bigint" ||
            typeof obj === "boolean" ||
            typeof obj === "number" ||
            typeof obj === "string"
        map.set(prefix, isCorrectType ? obj : String(obj))
        return
    }

    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            flattenJSONintoMap(
                item,
                map,
                `${prefix}${prefix ? "." : ""}${index}`
            )
        })
    } else {
        for (const key in obj) {
            flattenJSONintoMap(
                obj[key],
                map,
                `${prefix}${prefix ? "." : ""}${key}`
            )
        }
    }
}

export function rebuildLineWhitespace(content: string, tabSpace: number): Line {
    let i = 0
    let whitespaceCount = 0
    let startWs = ""
    while (i < content.length && WHITESPACE_CHARS.has(content[i])) {
        const ws = content[i]
        if (ws === "\t") {
            whitespaceCount += tabSpace
            startWs += ws
        } else if (ws !== "\r") {
            whitespaceCount++
            startWs += ws
        }
        i++
    }
    return {
        level: Math.floor(whitespaceCount / tabSpace),
        startWs, // Useful to reconstruct code block later on
        content: content.slice(i, content.length),
    }
}

export function cutCharFollowedByWhitespace(
    character: string,
    content: string
) {
    if (content.length > 0 && content[0] === character) {
        if (content.length > 1) {
            if (WHITESPACE_CHARS.has(content[1])) {
                return content.slice(2, content.length)
            } else {
                return content.slice(1, content.length)
            }
        }
    }
    return ""
}

export function extractHeadingId(content: string) {
    let text = content.trim()
    let id: string | undefined = undefined
    if (text.length >= 2) {
        const searchIndex = text[text.length - 1] === "}"
        let i = text.length - 2 // reuse i to iterate for the id search
        while (searchIndex && i >= 0) {
            if (text[i] === "{" && text[i + 1] === "#") {
                id = text.slice(i + 2, text.length - 1)
                text = text.slice(0, i).trimEnd()
                break
            }
            i--
        }
    }
    return {
        id,
        text,
    }
}

export function extractCodeBlock(removeSpaces: number, line: Line) {
    const space = line.startWs.slice(removeSpaces, line.startWs.length)
    return `${space}${line.content}`
}

export function openFenceCodeBlockCount(text: string) {
    let fenceCount = 0
    let isFenceStart = false
    let fenceFound = false
    for (let i = 0; i < text.length; i++) {
        if (i === 0 && text[i] === "`") {
            // Start with a backtick?
            isFenceStart = true
        }
        if (isFenceStart && text[i] === "`") {
            // Count backticks
            fenceCount++
            if (fenceFound) {
                // We already found a fence, this is not a correct fence then
                isFenceStart = false
                break
            }
            continue
        }
        if (isFenceStart && fenceCount < 3) {
            // We start with 2 or less backticks, this is not a fence
            isFenceStart = false
            break
        } else if (fenceCount >= 3) {
            // We found a fence
            fenceFound = true
        }
    }
    if (!isFenceStart || fenceCount < 3) {
        return undefined
    }
    return fenceCount
}

export function closeFenceCodeBlockCount(text: string) {
    let fenceCount = 0
    let fullFence = true
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "`") {
            // Count backticks
            fenceCount++
        } else {
            fullFence = false
        }
    }
    if (!fullFence || fenceCount < 3) {
        return undefined
    }
    return fenceCount
}

export function findOrderedListStartAt(content: string) {
    let digits = false
    let i = 0
    while (i < content.length) {
        if (DIGIT_CHARS.has(content[i])) {
            digits = true
        } else {
            break
        }
        i++
    }
    if (digits) {
        return content.slice(0, i)
    }
    return undefined
}

export function extractOrderedListItem(content: string, tabSpace: number) {
    let digits = false
    let i = 0
    while (i < content.length) {
        if (DIGIT_CHARS.has(content[i])) {
            digits = true
        } else {
            break
        }
        i++
    }
    if (digits && i < content.length && content[i] === ".") {
        i++
        if (i < content.length && WHITESPACE_CHARS.has(content[i])) {
            return rebuildLineWhitespace(
                content.slice(i + 1, content.length),
                tabSpace
            )
        }
    }
    return undefined
}

export function extractUnorderedListItem(
    symbol: string,
    content: string,
    tabSpace: number,
    pSkip = false
) {
    // Correct list item kind
    if (content.length > 0 && content[0] === symbol) {
        // Is really a list
        if (
            (!pSkip && content.length === 1) ||
            (content.length > 1 && WHITESPACE_CHARS.has(content[1]))
        ) {
            return rebuildLineWhitespace(
                content.slice(2, content.length),
                tabSpace
            )
        }
    }
    return undefined
}

export function checkListExtractor(content: string, symbol: string) {
    if (symbol !== "-") {
        return {
            todo: false,
            checked: false,
            content,
        }
    }
    if (content.length >= 3 && content[0] === "[" && content[2] === "]") {
        if (content.length > 3) {
            if (WHITESPACE_CHARS.has(content[3])) {
                return {
                    todo: true,
                    checked: content[1].toLowerCase() === "x",
                    content: content.slice(3, content.length).trimStart(),
                }
            }
        } else if (content.length === 3) {
            return {
                todo: true,
                checked: content[1].toLowerCase() === "x",
                content: "",
            }
        }
    }
    return {
        todo: false,
        checked: false,
        content,
    }
}

export function stripTableBorder(content: string) {
    let i = 0
    while (i < content.length) {
        if (content[i] !== "|" && !WHITESPACE_CHARS.has(content[i])) {
            break
        }
        i++
    }
    const halfTrimmedContent = content.slice(i, content.length)
    i = halfTrimmedContent.length - 1
    while (i >= 0) {
        if (
            halfTrimmedContent[i] !== "|" &&
            !WHITESPACE_CHARS.has(halfTrimmedContent[i])
        ) {
            break
        }
        i--
    }
    return halfTrimmedContent.slice(0, i + 1)
}

export function tableLineToCells(content: string) {
    const cells: string[] = []
    let i = 0
    let lastCell = 0
    while (i < content.length) {
        if (
            content[i] === "\\" &&
            i + 1 < content.length &&
            content[i + 1] === "|"
        ) {
            i++
        } else if (content[i] === "|") {
            cells.push(content.slice(lastCell, i).trim())
            lastCell = i + 1
        }
        i++
    }
    if (lastCell < content.length) {
        cells.push(content.slice(lastCell, content.length).trim())
    }
    return cells
}

export function processAlignTable(tableCells: string[]) {
    const alignCells: ("default" | "left" | "center" | "right")[] = []
    for (const cell of tableCells) {
        let isLeft = false
        let isRight = false
        for (let i = 0; i < cell.length; i++) {
            if (i === 0 && cell[i] === ":") {
                isLeft = true
            } else if (i === cell.length - 1 && cell[i] === ":") {
                isRight = true
            } else if (cell[i] !== "-") {
                return undefined
            }
        }
        if (isLeft === true && isRight === true) {
            alignCells.push("center")
        } else if (isRight) {
            alignCells.push("right")
        } else if (isLeft) {
            alignCells.push("left")
        } else {
            alignCells.push("default")
        }
    }
    return alignCells
}

export function quoteLength(content: string) {
    let i = 0
    while (i < content.length) {
        if (content[i] !== ">") {
            break
        }
        i++
    }
    return content.slice(i, content.length).trim().length
}

export function isOrderedListItem(content: string) {
    let digits = false
    let i = 0
    while (i < content.length) {
        if (DIGIT_CHARS.has(content[i])) {
            digits = true
        } else {
            break
        }
        i++
    }
    if (digits && i < content.length && content[i] === ".") {
        i++
        if (i < content.length && WHITESPACE_CHARS.has(content[i])) {
            return true
        }
    }
    return false
}

export function isUnorderedListItem(content: string, pskip = false) {
    // Correct list item kind
    if (
        content.length > 0 &&
        (content[0] === "*" || content[0] === "+" || content[0] === "-")
    ) {
        // Is really a list
        if (
            (!pskip && content.length === 1) ||
            (content.length > 1 && WHITESPACE_CHARS.has(content[1]))
        ) {
            return true
        }
    }
    return false
}

export function isFenceCodeBlock(level: number, line: number, lines: Line[]) {
    const currentToken = lines[line]
    if (level < currentToken.level) {
        return false
    }
    const fenceStartLine = currentToken.content.trimEnd()
    return openFenceCodeBlockCount(fenceStartLine) !== undefined
}

export function isHashHeading(level: number, line: number, lines: Line[]) {
    if (level < lines[line].level) {
        return false
    }
    const content = lines[line].content
    let i = 0
    let hashes = 0
    while (i < content.length && content[i] === "#") {
        hashes++
        i++
    }
    return (
        !(hashes > 6 || hashes === 0) &&
        ((i < content.length && WHITESPACE_CHARS.has(content[i])) ||
            i === content.length ||
            (i < content.length &&
                content[i] === "!" &&
                ((i + 1 < content.length &&
                    WHITESPACE_CHARS.has(content[i + 1])) ||
                    i + 1 === content.length)))
    )
}

export function isHorizontal(level: number, line: number, lines: Line[]) {
    const currentToken = lines[line]
    if (level < currentToken.level) {
        return false
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
            if (currChar === "*" || currChar === "-" || currChar === "_") {
                character = currChar
                occurences++
            } else {
                break
            }
        }
    }
    return !(character === undefined || occurences < 3)
}

export function isMaybeTable(content: string) {
    for (let i = 0; i < content.length; i++) {
        if (content[i] === "\\" && content[i + 1] === "|") {
            i++
        } else if (content[i] === "|") {
            return true
        }
    }
    return false
}

export function isTable(level: number, line: number, lines: Line[]) {
    const firstElement = lines[line]
    if (level < firstElement.level || line + 1 >= lines.length) {
        return false
    }
    const secondElement = lines[line + 1]
    if (level < secondElement.level) {
        return false
    }
    const tableAlign = processAlignTable(
        tableLineToCells(stripTableBorder(secondElement.content))
    )
    if (tableAlign !== undefined && isMaybeTable(secondElement.content)) {
        // There is an alignment for table
        const headerCells = tableLineToCells(
            stripTableBorder(firstElement.content)
        )
        return tableAlign.length === headerCells.length
    }
    return false
}

export function isRefLink(level: number, line: number, lines: Line[]) {
    const item = lines[line]
    if (level < item.level) {
        return false
    }
    return (
        /^\[[^\]]+\]:\s+(?:<\S+>|\S+)(?:\s+(?:"[^"]+"|'[^']+'|\([^)]+\)))?$/.exec(
            item.content
        ) !== null
    )
}

export function isIncludeCode(level: number, line: number, lines: Line[]) {
    const item = lines[line]
    if (level < item.level) {
        return false
    }
    return (
        /^!INCLUDECODE\s+(?:["'].+?["']|\(.+?\))(?:\s*\(\w+\))?(?:\s*,\s*(?:(?:\d+)?(?::(?:\d+))?))?\s*$/i.exec(
            item.content
        ) !== null
    )
}

export function isInclude(level: number, line: number, lines: Line[]) {
    const item = lines[line]
    if (level < item.level) {
        return false
    }
    return (
        /^!INCLUDE\s+(?:['"].+?['"]|\(.+?\))(?:,\s*(?:l\s*(?:(?:\d+)?(?::(?:\d+))?)?)?(?:\s*s\s*\d+)?)?\s*$/i.exec(
            item.content
        ) !== null
    )
}

export function isHtml(level: number, line: number, lines: Line[]) {
    const currentLine = lines[line]
    if (level < currentLine.level) {
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

    return matchedSeq !== null
}

export function isFootnoteRef(level: number, line: number, lines: Line[]) {
    const item = lines[line]
    if (level < item.level) {
        return false
    }
    return /^\[\^(?:[^\]]+)\]:\s+.+/.exec(item.content) !== null
}

export function isBlockquote(level: number, line: number, lines: Line[]) {
    const firstLine = lines[line]
    return (
        !(level < firstLine.level) &&
        firstLine.content.length > 0 &&
        firstLine.content[0] === ">"
    )
}

export function isUnderlineHeading(level: number, currentLine: Line) {
    if (currentLine.level === level && currentLine.content.length > 0) {
        const underlineDepth = currentLine.content
        let previous: string | undefined = undefined
        let i = 0
        while (i < underlineDepth.length) {
            if (
                (underlineDepth[i] !== "=" && underlineDepth[i] !== "-") ||
                (previous && underlineDepth[i] !== previous)
            ) {
                previous = undefined
                break
            }
            previous = underlineDepth[i]
            i++
        }
        return previous
    }
}

export function isDefinitionList(level: number, currentLine: Line) {
    if (currentLine.level === level) {
        const content = currentLine.content.trimEnd()
        return (
            currentLine.level === level &&
            content.length > 1 &&
            content[0] === ":" &&
            WHITESPACE_CHARS.has(content[1])
        )
    }
    return false
}
