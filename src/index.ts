// Match attribute values
const attrName = /[a-zA-Z_:][a-zA-Z0-9:._-]*/.source;
const unquoted = /[^"'=<>`\x00-\x20]+/.source;
const singleQuoted = /'[^']*'/.source;
const doubleQuoted = /"[^"]*"/.source;
const attrValue = `(?:${unquoted}|${singleQuoted}|${doubleQuoted})`;
const attribute = `(?:\\s+${attrName}(?:\\s*=\\s*${attrValue})?)`;

// Match HTML tags
const openTag = `<[A-Za-z][A-Za-z0-9\\-]*${attribute}*\\s*/?>`;
const closeTag = `</[A-Za-z][A-Za-z0-9\\-]*\\s*>`;
const comment = `<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->`;
const processing = `<[?][\\s\\S]*?[?]>`;
const declaration = `<![A-Z]+\\s+[^>]*>`;
const cdata = `<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`;

// Combined raw HTML pattern (start of string is assumed)
const HTML_TAG_RE = new RegExp(
  `^(?:${openTag}|${closeTag}|${comment}|${processing}|${declaration}|${cdata})`
);

// To detect link-related tags
const HTML_LINK_OPEN = /^<a[>\s]/i;
const HTML_LINK_CLOSE = /^<\/a\s*>/i;

interface Line {
    level: number;
    startWs: string;
    content: string;
}

interface LinkRef {
    link: string;
    title: string | undefined;
}

interface HeadingToken {
    type: "heading";
    id: string|undefined;
    isUnderline: boolean;
    headingIndex: string;
    depth: number;
    tokens: MdToken[];
}

interface CodeBlockToken {
    type: "codeblock";
    from: number|undefined;
    to: number|undefined;
    lang: string|undefined;
    content: string;
}

interface HorizontalToken {
    type: "horizontal";
    character: string;
}

interface ParagraphToken {
    type: "paragraph";
    lines: number;
    tokens: MdToken[];
}

interface TextToken {
    type: "text";
    text: string;
}

interface BlockQuoteToken {
    type: "blockquote";
    tokens: MdToken[];
}

interface ListItemToken {
    type: "listItem";
    task: boolean;
    checked: boolean;
    tokens: MdToken[],
}

interface ListToken {
    type: "list";
    startAt: string | undefined;
    ordered: boolean;
    items: ListItemToken[];
}

interface TableCellToken {
    type: "cell";
    header: boolean;
    align: "default" | "left" | "center" | "right";
    tokens: MdToken[];
}

interface TableToken {
    type: "table";
    header: TableCellToken[];
    rows: TableCellToken[][];
}

interface DefinitionListItemToken {
    type: "definitionListItem";
    term: MdToken[];
    definitions: MdToken[][];
}

interface DefinitionListToken {
    type: "definitionList";
    items: DefinitionListItemToken[];
}

interface TexToken {
    type: "tex";
    text: string;
    inline: boolean;
    displayMode: boolean;
}

interface SpoilerToken {
    type: "spoiler";
    title: MdToken[];
    inline: boolean;
    tokens: MdToken[];
}

interface IncludeToken {
    type: "include";
    tokens: MdToken[];
}

interface HTMLToken {
    type: "html";
    content: string;
}

interface FootnoteEndToken {
    type: "footnoteEnd";
}

export type MdBlockToken = HeadingToken
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
    | FootnoteEndToken;

interface BoldToken {
    type: "bold";
    tokens: MdToken[];
}

interface UnderlineToken {
    type: "underline";
    tokens: MdToken[];
}

interface ItalicToken {
    type: "italic";
    tokens: MdToken[];
}

interface HighlightToken {
    type: "highlight";
    tokens: MdToken[];
}

interface StrikethroughToken {
    type: "strikethrough";
    tokens: MdToken[];
}

interface OverlineToken {
    type: "overline";
    tokens: MdToken[];
}

interface EmojiToken {
    type: "emoji";
    name: string;
}

interface NewLineToken {
    type: "newline";
}

interface FootnoteRefToken {
    type: "footnoteRef";
    ref: string;
}

interface ImageToken {
    type: "image";
    alt: string;
    href: string;
    title: string | undefined;
}

interface LinkToken {
    type: "link";
    label: MdToken[];
    href: string;
    title: string | undefined;
}

interface RefLinkToken {
    type: "reflink";
    label: MdToken[];
    ref: string;
}

interface CodespanToken {
    type: "codespan";
    text: string;
}

interface MetadataToken {
    type: "metadata";
    name: string;
}

interface YoutubeToken {
    type: "youtubeEmbed";
    title: string;
    attributes: Record<string, string>;
}

export type MdInlineToken = TextToken | YoutubeToken | OverlineToken | MetadataToken | CodespanToken | LinkToken | RefLinkToken | ImageToken | FootnoteRefToken | NewLineToken | HighlightToken | StrikethroughToken | EmojiToken | UnderlineToken | BoldToken | ItalicToken;

export type MdToken = MdBlockToken | MdInlineToken;

interface RootToken {
    type: "root";
    metadata: Map<string, string>;
    reflinks: Map<string, LinkRef>;
    footnoteDefs: Map<string, MdToken[]>;
    footnoteIndexRefs: Map<string, number>;
    footnoteRefs: Map<number, string>;
    tokens: MdToken[];
}

const WHITESPACE_CHARS = new Set([
    '\u0009', // Tab
    '\u000B', // Vertical Tab
    '\u000C', // Form Feed
    '\u000D', // Carriage Return
    '\u0020', // Space
    '\u00A0', // No-Break Space
    '\u1680', // Ogham Space Mark
    '\u2000', // En Quad
    '\u2001', // Em Quad
    '\u2002', // En Space
    '\u2003', // Em Space
    '\u2004', // Three-Per-Em Space
    '\u2005', // Four-Per-Em Space
    '\u2006', // Six-Per-Em Space
    '\u2007', // Figure Space
    '\u2008', // Punctuation Space
    '\u2009', // Thin Space
    '\u200A', // Hair Space
    '\u2028', // Line Separator
    '\u2029', // Paragraph Separator
    '\u202F', // Narrow No-Break Space
    '\u205F', // Medium Mathematical Space
    '\u3000', // Ideographic Space
]);

const DIGIT_CHARS = new Set([
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9'
]);
const ESCAPING_CHARS = new Set([
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
]);

const htmlPatterns: {
    open: RegExp;
    close: RegExp;
    canInterrupt: boolean;
}[] = [
    // Type 1: <script>, <pre>, <style>, <textarea>
    {
        open: /^<(script|pre|style|textarea)(\s|>|$)/i,
        close: /<\/(script|pre|style|textarea)>/i,
        canInterrupt: true
    },
    // Type 2: <!--
    {
        open: /^<!--/,
        close: /-->/,
        canInterrupt: true
    },
    // Type 3: <?
    {
        open: /^<\?/,
        close: /\?>/,
        canInterrupt: true
    },
    // Type 4: <!A-Z
    {
        open: /^<![A-Z]/,
        close: />/,
        canInterrupt: true
    },
    // Type 5: <![CDATA[
    {
        open: /^<!\[CDATA\[/,
        close: /\]\]>/,
        canInterrupt: true
    },
    // Type 6: block-level tag open/close
    {
        open: /^<\/?(address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(\s|\/?>|$)/i,
        close: /^$/, // blank line
        canInterrupt: true
    },
    // Type 7: any open/close tag
    {
        open: /^[ \t]*<([a-zA-Z][^\s>/]*)\b[^>]*>?[ \t]*$/,
        close: /^$/, // blank line
        canInterrupt: false
    },
    {
        open: /^([ \t]*<\/?[a-zA-Z][\w:-]*(\s[^<>]*?)?>[ \t]*)+$/,
        close: /^.*$/,
        canInterrupt: true
    },
];

const escapeReplacements: { [index: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];

export function escape(html: string, encode?: boolean) {
  if (encode) {
    if (/[&<>"']/.test(html)) {
      return html.replace(/[&<>"']/g, getEscapeReplacement);
    }
  } else {
    if (/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/.test(html)) {
      return html.replace(/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, getEscapeReplacement);
    }
  }

  return html;
}

function cleanUrl(href: string) {
  try {
    href = encodeURI(href).replace(/%25/g, '%');
  } catch {
    return null;
  }
  return href;
}

function rebuildLineWhitespace(content: string, tabSpace: number): Line {
    let i = 0;
    let whitespaceCount = 0;
    let startWs = "";
    while (i < content.length && WHITESPACE_CHARS.has(content[i])) {
        const ws = content[i];
        if(ws === "\t") {
            whitespaceCount += tabSpace;
            startWs += ws;
        } else if(ws !== "\r") {
            whitespaceCount++;
            startWs += ws;
        }
        i++;
    }
    return {
        level: Math.floor(whitespaceCount / tabSpace),
        startWs, // Useful to reconstruct code block later on
        content: content.slice(i, content.length),
    };
}

function cutCharFollowedByWhitespace(character: string, content: string) {
    if(content.length > 0 && content[0] === character) {
        if(content.length > 1) {
            if(WHITESPACE_CHARS.has(content[1])) {
                return content.slice(2, content.length);
            } else {
                return content.slice(1, content.length);
            }
        }
    }
    return "";
}

function stringToLines(content: string, tabSpace: number): Line[] {
    const lines: Line[] = [];
    let i = 0;

    while (i < content.length) {
        let line = "";
        let j = i;

        let whitespaceCount = 0;
        let startWs = "";
        // Count leading whitespace
        while (j < content.length && WHITESPACE_CHARS.has(content[j])) {
            const ws = content[j];
            if(ws === "\t") {
                whitespaceCount += tabSpace;
                startWs += ws;
            } else if(ws !== "\r") {
                whitespaceCount++;
                startWs += ws;
            }
            j++;
        }

        // Build line content until newline
        while (j < content.length && content[j] !== "\n") {
            if (content[j] !== "\r") {
                line += content[j];
            }
            j++;
        }

        lines.push({
            level: Math.floor(whitespaceCount / tabSpace),
            startWs, // Useful to reconstruct code block later on
            content: line,
        });

        i = j + 1; // Move past '\n'
    }

    return lines;
}

function extractHeadingId(content: string) {
    let text = content.trim();
    let id: string|undefined = undefined;
    if(text.length >= 2) {
        const searchIndex = text[text.length - 1] === "}";
        let i = text.length - 2; // reuse i to iterate for the id search
        while(searchIndex && i >= 0) {
            if(text[i] === "{" && text[i + 1] === "#") {
                id = text.slice(i + 2, text.length - 1);
                text = text.slice(0, i).trimEnd();
                break;
            }
            i--;
        }
    }
    return {
        id,
        text,
    }
}

function extractCodeBlock(removeSpaces: number, line: Line) {
    const space = line.startWs.slice(removeSpaces, line.startWs.length);
    return `${space}${line.content}`;
}
function quoteLength(content: string) {
    let i = 0;
    while(i < content.length) {
        if(content[i] !== ">") {
            break;
        }
        i++;
    }
    return content
        .slice(i, content.length)
        .trim()
        .length;
}

function openFenceCodeBlockCount(text: string) {
    let fenceCount = 0;
    let isFenceStart = false;
    let fenceFound = false;
    for(let i = 0; i < text.length; i++) {
        if(i === 0 && text[i] === "`") { // Start with a backtick?
            isFenceStart = true;
        }
        if(isFenceStart && text[i] === "`") { // Count backticks
            fenceCount++;
            if(fenceFound) { // We already found a fence, this is not a correct fence then
                isFenceStart = false;
                break;
            }
            continue;
        }
        if(isFenceStart && fenceCount < 3) { // We start with 2 or less backticks, this is not a fence
            isFenceStart = false;
            break;
        } else if(fenceCount >= 3) { // We found a fence
            fenceFound = true;
        }
    }
    if(!isFenceStart || fenceCount < 3) {
        return undefined;
    }
    return fenceCount;
}

function closeFenceCodeBlockCount(text: string) {
    let fenceCount = 0;
    let fullFence = true;
    for(let i = 0; i < text.length; i++) {
        if(text[i] === "`") { // Count backticks
            fenceCount++;
        } else {
            fullFence = false;
        }
    }
    if(!fullFence || fenceCount < 3) {
        return undefined;
    }
    return fenceCount;
}

function isUnderlineHeading(level: number, currentLine: Line) {
    if(currentLine.level === level && currentLine.content.length > 0) {
        const underlineDepth = currentLine.content;
        let previous: string|undefined = undefined;
        let i = 0;
        while(i < underlineDepth.length) {
            if((underlineDepth[i] !== "=" && underlineDepth[i] !== "-") || (previous && underlineDepth[i] !== previous)) {
                previous = undefined;
                break;
            }
            previous = underlineDepth[i];
            i++;
        }
        return previous;
    }
}
function isOrderedListItem(content: string) {
    let digits = false;
    let i = 0;
    while(i < content.length) {
        if(DIGIT_CHARS.has(content[i])) {
            digits = true;
        } else {
            break;
        }
        i++;
    }
    if(digits && i < content.length && content[i] === ".") {
        i++;
        if(i < content.length && WHITESPACE_CHARS.has(content[i])) {
            return true;
        }
    }
    return false;
}
function findOrderedListStartAt(content: string) {
    let digits = false;
    let i = 0;
    while(i < content.length) {
        if(DIGIT_CHARS.has(content[i])) {
            digits = true;
        } else {
            break;
        }
        i++;
    }
    if(digits) {
        return content.slice(0, i);
    }
    return undefined;
}
function extractOrderedListItem(content: string, tabSpace: number) {
    let digits = false;
    let i = 0;
    while(i < content.length) {
        if(DIGIT_CHARS.has(content[i])) {
            digits = true;
        } else {
            break;
        }
        i++;
    }
    if(digits && i < content.length && content[i] === ".") {
        i++;
        if(i < content.length && WHITESPACE_CHARS.has(content[i])) {
            return rebuildLineWhitespace(content.slice(i + 1, content.length), tabSpace);
        }
    }
    return undefined;
}
function isUnorderedListItem(content: string, pskip = false) {
    // Correct list item kind
    if(content.length > 0 && (content[0] === "*" || content[0] === "+" || content[0] === "-")) {
        // Is really a list
        if((!pskip && content.length === 1) || (content.length > 1 && WHITESPACE_CHARS.has(content[1]))) {
            return true;
        }
    }
    return false;
}
function extractUnorderedListItem(symbol: string, content: string, tabSpace: number, pSkip = false) {
    // Correct list item kind
    if(content.length > 0 && content[0] === symbol) {
        // Is really a list
        if((!pSkip && content.length === 1) || (content.length > 1 && WHITESPACE_CHARS.has(content[1]))) {
            return rebuildLineWhitespace(content.slice(2, content.length), tabSpace);
        }
    }
    return undefined;
}

function stripTableBorder(content: string) {
    let i = 0;
    while(i < content.length) {
        if(content[i] !== "|" && !WHITESPACE_CHARS.has(content[i])) {
            break;
        }
        i++;
    }
    const halfTrimmedContent = content.slice(i, content.length);
    i = halfTrimmedContent.length - 1;
    while(i >= 0) {
        if(halfTrimmedContent[i] !== "|" && !WHITESPACE_CHARS.has(halfTrimmedContent[i])) {
            break;
        }
        i--;
    }
    return halfTrimmedContent.slice(0, i + 1);
}
function tableLineToCells(content: string) {
    const cells: string[] = [];
    let i = 0;
    let lastCell = 0;
    while(i < content.length) {
        if(content[i] === "\\" && i + 1 < content.length && content[i + 1] === "|") {
            i++;
        } else if(content[i] === "|") {
            cells.push(content.slice(lastCell, i).trim());
            lastCell = i + 1;
        }
        i++;
    }
    if(lastCell < content.length) {
        cells.push(content.slice(lastCell, content.length).trim());
    }
    return cells;
}
function processAlignTable(tableCells: string[]) {
    const alignCells: ("default"|"left"|"center"|"right")[] = [];
    for(const cell of tableCells) {
        let isLeft = false;
        let isRight = false;
        for(let i = 0; i < cell.length; i++) {
            if(i === 0 && cell[i] === ":") {
                isLeft = true;
            } else if(i === cell.length - 1 && cell[i] === ":") {
                isRight = true;
            } else if(cell[i] !== "-") {
                return undefined;
            }
        }
        if(isLeft === true && isRight === true) {
            alignCells.push("center");
        } else if(isRight) {
            alignCells.push("right");
        } else if(isLeft) {
            alignCells.push("left");
        } else {
            alignCells.push("default");
        }
    }
    return alignCells;
}

function isFenceCodeBlock(level: number, line: number, lines: Line[]) {
    const currentToken = lines[line];
    if(level < currentToken.level) {
        return false;
    }
    const fenceStartLine = currentToken.content.trimEnd();
    return openFenceCodeBlockCount(fenceStartLine) !== undefined;
}
function isBlockquote(level: number, line: number, lines: Line[]) {
    const firstLine = lines[line];
    return !(level < firstLine.level) && (firstLine.content.length > 0 && firstLine.content[0] === ">");
}
function isHashHeading(level: number, line: number, lines: Line[]) {
    if(level < lines[line].level) {
        return false;
    }
    const content = lines[line].content;
    let i = 0;
    let hashes = 0;
    while(i < content.length && content[i] === "#") {
        hashes++;
        i++;
    }
    return !(hashes > 6 || hashes === 0)
        && (
            (
                (i < content.length && WHITESPACE_CHARS.has(content[i]))
                || (i === content.length)
            )
            ||
            (
                i < content.length && content[i] === "!"
                && ((i + 1 < content.length && WHITESPACE_CHARS.has(content[i + 1]))
                || (i + 1 === content.length))
            )
        );
}
function isHorizontal(level: number, line: number, lines: Line[]) {
    const currentToken = lines[line];
    if(level < currentToken.level) {
        return false;
    }
    const content = currentToken.content.trimEnd();
    let occurences = 0;
    let character: string|undefined = undefined;
    for(let i = 0; i < content.length; i++) {
        const currChar = content[i];
        if(i !== 0) {
            if(character !== currChar) {
                character = undefined;
                break;
            }
            occurences++;
        } else {
            if(currChar === "*" || currChar === "-" || currChar === "_") {
                character = currChar;
                occurences++;
            } else {
                break;
            }
        }
    }
    return !(character === undefined || occurences < 3);
}
function isTable(level: number, line: number, lines: Line[]) {
    const firstElement = lines[line];
    if(level < firstElement.level || line + 1 >= lines.length) {
        return false;
    }
    const secondElement = lines[line + 1];
    if(level < secondElement.level) {
        return false;
    }
    const tableAlign = processAlignTable(tableLineToCells(stripTableBorder(secondElement.content)));
    if(tableAlign !== undefined && isMaybeTable(secondElement.content)) { // There is an alignment for table
        const headerCells = tableLineToCells(stripTableBorder(firstElement.content));
        return tableAlign.length === headerCells.length;
    }
    return false;
}
function isMaybeTable(content: string) {
    for(let i = 0; i < content.length; i++) {
        if(content[i] === '\\' && content[i + 1] === '|') {
            i++;
        } else if(content[i] === '|') {
            return true;
        }
    }
    return false;
}
function isDefinitionList(level: number, currentLine: Line) {
    if(currentLine.level === level) {
        const content = currentLine.content.trimEnd();
        return currentLine.level === level && content.length > 1 && content[0] === ":" && WHITESPACE_CHARS.has(content[1]);
    }
    return false;
}
function isRefLink(level: number, line: number, lines: Line[]) {
    const item = lines[line];
    if(level < item.level) {
        return false;
    }
    return /^\[[^\]]+\]:\s+(?:<\S+>|\S+)(?:\s+(?:"[^"]+"|'[^']+'|\([^)]+\)))?$/.exec(item.content) !== null;
}
function isIncludeCode(level: number, line: number, lines: Line[]) {
    const item = lines[line];
    if(level < item.level) {
        return false;
    }
    return /^!INCLUDECODE\s+(?:["'].+?["']|\(.+?\))(?:\s*\(\w+\))?(?:\s*,\s*(?:(?:\d+)?(?::(?:\d+))?))?\s*$/i.exec(item.content) !== null;
}
function isInclude(level: number, line: number, lines: Line[]) {
    const item = lines[line];
    if(level < item.level) {
        return false;
    }
    return /^!INCLUDE\s+(?:['"].+?['"]|\(.+?\))(?:,\s*(?:l\s*(?:(?:\d+)?(?::(?:\d+))?)?)?(?:\s*s\s*\d+)?)?\s*$/i.exec(item.content) !== null;
}
function isFootnoteRef(level: number, line: number, lines: Line[]) {
    const item = lines[line];
    if(level < item.level) {
        return false;
    }
    return /^\[\^(?:[^\]]+)\]:\s+.+/.exec(item.content) !== null;
}
function isHtml(level: number, line: number, lines: Line[]) {
    const currentLine = lines[line];
    if (level < currentLine.level) {
        return undefined;
    }

    const lineText = currentLine.content;
    if (!lineText.trim().startsWith("<")) return undefined;

    let matchedSeq = null;

    for (const seq of htmlPatterns) {
        if (seq.open.test(lineText)) {
            matchedSeq = seq;
            break;
        }
    }

    return matchedSeq !== null;
}

function checkListExtractor(content: string) {
    if(content.length >= 3 && content[0] === "[" && content[2] === "]") {
        return {
            todo: true,
            checked: content[1].toLowerCase() === "x",
            content: content.slice(3, content.length).trimStart(),
        };
    }
    return {
        todo: false,
        checked: false,
        content,
    };
}
function flattenJSONintoMap(obj: any, map: Map<string, string>, prefix = '') {
    if (typeof obj !== 'object' || obj === null) {
        if(!map.has(prefix)) {
            map.set(prefix, String(obj));
        }
        return;
    }

    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            flattenJSONintoMap(item, map, `${prefix}${prefix ? '.' : ''}${index}`);
        });
    } else {
        for (const key in obj) {
            flattenJSONintoMap(obj[key], map, `${prefix}${prefix ? '.' : ''}${key}`);
        }
    }
}

type LinkMatch = {
    label: string;
    href?: string;
    title?: string;
    end: number;
};

function matchLink(src: string, start: number = 0): LinkMatch | null {
    let i = start;

    // Check prefix
    if (src[i] !== "[") return null;

    // Parse label
    const labelRes = parseLinkLabel(src, i);
    if (!labelRes) return null;
    const { label, end: labelEnd } = labelRes;
    i = labelEnd;

    // Require opening "("
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] !== "(") return null;
    i++;

    // Parse href
    while (i < src.length && /\s/.test(src[i])) i++;
    const hrefRes = parseLinkDestination(src, i);
    if (!hrefRes) return null;
    const { href, end: hrefEnd } = hrefRes;
    i = hrefEnd;

    // Optional title
    let title: string | undefined;
    while (i < src.length && /\s/.test(src[i])) i++;
    const titleRes = parseLinkTitle(src, i);
    if (titleRes) {
        title = titleRes.title;
        i = titleRes.end;
    }

    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] !== ")") return null;
    i++;

    return { label, href, title, end: i };
}

function parseLinkLabel(src: string, start: number): { label: string; end: number } | null {
    if (src[start] !== "[") return null;
    let i = start + 1;
    let depth = 1;
    let label = "";

    while (i < src.length) {
        const ch = src[i];
        if (ch === "\\" && i + 1 < src.length) {
            label += src[i + 1];
            i += 2;
            continue;
        }
        if (ch === "[") depth++;
        if (ch === "]") {
            depth--;
            if (depth === 0) return { label, end: i + 1 };
        }
        if (depth > 0) label += ch;
        i++;
    }
    return null;
}

function parseLinkDestination(src: string, start: number): { href: string; end: number } | null {
    let i = start;
    if (src[i] === "<") {
        i++;
        let href = "";
        while (i < src.length) {
            const ch = src[i];
            if (ch === ">") return { href, end: i + 1 };
            if (ch === "\\" && i + 1 < src.length) {
                href += src[i + 1];
                i += 2;
            } else if (ch === "\n" || ch === "<") {
                return null;
            } else {
                href += ch;
                i++;
            }
        }
        return null;
    } else {
        let href = "";
        let parens = 0;
        while (i < src.length) {
            const ch = src[i];
            if (ch === " " || ch === "\n") break;
            if (ch === "\\") {
                if (i + 1 < src.length) {
                    href += src[i + 1];
                    i += 2;
                } else {
                    break;
                }
            } else {
                if (ch === "(") parens++;
                if (ch === ")") {
                    if (parens === 0) break;
                    parens--;
                }
                href += ch;
                i++;
            }
        }
        if (parens !== 0) return null;
        return { href, end: i };
    }
}

function parseLinkTitle(src: string, start: number): { title: string; end: number } | null {
    const quote = src[start];
    if (!["'", '"', "("].includes(quote)) return null;
    const closing = quote === "(" ? ")" : quote;

    let i = start + 1;
    let title = "";
    while (i < src.length) {
        const ch = src[i];
        if (ch === closing) return { title, end: i + 1 };
        if (ch === "\\" && i + 1 < src.length) {
            title += src[i + 1];
            i += 2;
        } else {
            title += ch;
            i++;
        }
    }
    return null;
}
type ReferenceLinkMatch = {
  footnote: boolean;
  label: string;
  ref: string;  // the reference label (could be empty or same as label)
  end: number;
};
function matchReferenceLink(
  src: string,
  start: number
): ReferenceLinkMatch | null {
  if (src[start] !== "[") return null;

  // First label: [label]
  const label1 = parseLinkLabel(src, start);
  if (!label1) return null;

  const labelText = label1.label;
  let i = label1.end;

  // Full reference: [label][ref]
  if (src[i] === "[") {
    const label2 = parseLinkLabel(src, i);
    if (!label2) return null;

    return {
      footnote: false,
      label: labelText,
      ref: label2.label.trim(),
      end: label2.end,
    };
  }

  // Collapsed reference: [label][]
  if (src[i] === "]") {
    return {
      footnote: false,
      label: labelText,
      ref: labelText.trim(),
      end: i + 1,
    };
  }

  // Shortcut reference: [label]
  const tLabel = labelText.trim();
  if(tLabel.startsWith("^")) {
    const cutLabel = tLabel.slice(1, tLabel.length);
    return {
        footnote: true,
        label: cutLabel,
        ref: cutLabel,
        end: label1.end,
    };
  }
  return {
    footnote: false,
    label: labelText,
    ref: tLabel,
    end: label1.end,
  };
}

interface AutolinkNode {
  type: 'autolink';
  url: string;
  content: string;
  end: number;
}

// Matches <https://example.com> or <user@example.com>
const AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)$/;
const EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/;

/**
 * Parses autolinks like <https://example.com> or <user@example.com>
 */
function parseAutolink(src: string, start: number): AutolinkNode | null {
  if (src[start] !== "<") return null;

  let pos = start + 1;
  while (pos < src.length && src[pos] !== ">" && src[pos] !== "<") {
    pos++;
  }

  if (src[pos] !== ">") return null;

  const rawUrl = src.slice(start + 1, pos);

  const isAutolink = AUTOLINK_RE.test(rawUrl);
  const isEmail = EMAIL_RE.test(rawUrl);

  if (!isAutolink && !isEmail) return null;

  const href = isAutolink ? rawUrl : `mailto:${rawUrl}`;
  const content = rawUrl;

  return {
    type: 'autolink',
    url: href,
    content,
    end: pos + 1,
  };
}

function parseHtmlInline(src: string, start: number, tokenizer: InlineTokenizer): HTMLToken | null {
  if (src[start] !== "<") return null;
  const second = src[start + 1];
  if (!second || !(/[!/?A-Za-z]/.test(second))) return null;

  const match = HTML_TAG_RE.exec(src.slice(start));
  if (!match) return null;

  const tag = match[0];

  // Update link level (needed to correctly nest <a>)
  if (HTML_LINK_OPEN.test(tag)) {
    tokenizer.addLinkLevel(1);
  } else if (HTML_LINK_CLOSE.test(tag)) {
    tokenizer.addLinkLevel(-1);
  }

  return {
    type: "html",
    content: tag,
  };
}


interface LexerOptions {
    tabulation?: number;
    metadata?: Map<string, string>;
    frontMatter?: (content: string) => unknown;
    include?: (location: string, from: number|undefined, to: number|undefined) => string;
    includeCode?: (location: string, from: number|undefined, to: number|undefined) => string | undefined;
    includedLocations?: Set<string>;
}

interface StaticLexerOptions {
    lexer: Lexer;
}

class Lexer {
    headingIndex: [h1: number, h2: number, h3: number, h4: number, h5: number, h6: number];
    headingShift: number;
    started: boolean;
    metadata: Map<string, string>;
    tabulation: number;
    frontMatter?: (content: string) => unknown;
    include?: (location: string, from: number|undefined, to: number|undefined) => string;
    includeCode?: (location: string, from: number|undefined, to: number|undefined) => string | undefined;
    includedLocations: Set<string>;
    reflinks: Map<string, LinkRef>;
    footnoteIndexMap: Map<string, number>;
    footnoteRef: Map<number, string>;
    footnoteDefs: Map<string, MdToken[]>;
    constructor(options: Partial<LexerOptions> = {}) {
        this.headingIndex = [0, 0, 0, 0, 0, 0];
        this.tabulation = options?.tabulation??4;
        this.started = false;
        this.metadata = options?.metadata??new Map();
        this.frontMatter = options?.frontMatter;
        this.include = options?.include;
        this.includeCode = options?.includeCode;
        this.includedLocations = options?.includedLocations??new Set();
        this.headingShift = 0;
        this.reflinks = new Map();
        this.footnoteDefs = new Map();
        this.footnoteRef = new Map();
        this.footnoteIndexMap = new Map();
    }
    newHeading(depth: number) {
        switch(depth) {
            case 1:
                this.headingIndex[0] += 1;
                this.headingIndex[1] = 0;
                this.headingIndex[2] = 0;
                this.headingIndex[3] = 0;
                this.headingIndex[4] = 0;
                this.headingIndex[5] = 0;
                return `${this.headingIndex[0]}. `;
            case 2:
                this.headingIndex[1] += 1;
                this.headingIndex[2] = 0;
                this.headingIndex[3] = 0;
                this.headingIndex[4] = 0;
                this.headingIndex[5] = 0;
                return `${this.headingIndex[0]}.${this.headingIndex[1]}. `;
            case 3:
                this.headingIndex[2] += 1;
                this.headingIndex[3] = 0;
                this.headingIndex[4] = 0;
                this.headingIndex[5] = 0;
                return `${this.headingIndex[0]}.${this.headingIndex[1]}.${this.headingIndex[2]}. `;
            case 4:
                this.headingIndex[3] += 1;
                this.headingIndex[4] = 0;
                this.headingIndex[5] = 0;
                return `${this.headingIndex[0]}.${this.headingIndex[1]}.${this.headingIndex[2]}.${this.headingIndex[3]}. `;
            case 5:
                this.headingIndex[4] += 1;
                this.headingIndex[5] = 0;
                return `${this.headingIndex[0]}.${this.headingIndex[1]}.${this.headingIndex[2]}.${this.headingIndex[3]}.${this.headingIndex[4]}. `;
            default:
                this.headingIndex[5] += 1;
                return `${this.headingIndex[0]}.${this.headingIndex[1]}.${this.headingIndex[2]}.${this.headingIndex[3]}.${this.headingIndex[4]}.${this.headingIndex[5]}. `;
        }
    }
    lex(content: string): MdToken[] {
        const blocks = new BlockTokenizer({
            lexer: this,
            lines: stringToLines(content, this.tabulation),
        });
        return blocks
            .tokenize()
            .getBlocks();
    }
    inlineLex(content: string): MdToken[] {
        const inline = new InlineTokenizer({
            lexer: this,
            content,
        });
        return inline.tokenize();
    }
    static lex(content: string, options: LexerOptions & Partial<StaticLexerOptions> = {}): RootToken {
        const lexer = options.lexer ?? new Lexer({
            metadata: options?.metadata,
            tabulation: options?.tabulation,
            include: options?.include,
            includeCode: options?.includeCode,
            includedLocations: options?.includedLocations,
        });
        const blocks = new BlockTokenizer({
            lexer,
            lines: stringToLines(content, lexer.tabulation),
        });
        const tokens = blocks
            .tokenize()
            .getBlocks();
        if(lexer.footnoteDefs.size > 0 && lexer.footnoteIndexMap.size > 1) {
            tokens.push({
                type: "footnoteEnd",
            });
        }
        return {
            type: "root",
            metadata: lexer.metadata,
            reflinks: lexer.reflinks,
            footnoteDefs: lexer.footnoteDefs,
            footnoteRefs: lexer.footnoteRef,
            footnoteIndexRefs: lexer.footnoteIndexMap,
            tokens,
        };
    }
    static inlineLex(content: string, options: LexerOptions & Partial<StaticLexerOptions> = {}): MdToken[] {
        const lexer = options.lexer ?? new Lexer({
            metadata: options?.metadata,
            tabulation: options?.tabulation,
            include: options?.include,
            includeCode: options?.includeCode,
            includedLocations: options?.includedLocations,
        });
        const inline = new InlineTokenizer({
            lexer,
            content,
        });
        return inline.tokenize();
    }
}

type InlineCharacter = "*" | "_" | "=" | ":" | "~" | "|" | "^";

const ENDING_STARS = new Map<"double"|"single", (s: InlineCharacter) => (i: number, src: string) => boolean>([
    ["double", (s: InlineCharacter) => (i: number, src: string) => i + 1 < src.length && src[i] === s && src[i + 1] === s],
    ["single", (s: InlineCharacter) => (i: number, src: string) => src[i] === s]
]);

const INLINE_KIND_CHARS = new Map<string, "double"|"single">([
    ["bold", "double"],
    ["underline", "double"],
    ["italic", "single"],
])

interface InlineTokenizerOptions {
    parent?: InlineTokenizer;
    lexer: Lexer;
    content: string;
    linkLevel?: number;
}
class InlineTokenizer {
    lexer: Lexer;
    parent: InlineTokenizer | undefined;
    index: number = 0;
    content: string;
    textBuffer: string = "";
    linkLevel: number;
    constructor(options: InlineTokenizerOptions) {
        this.content = options.content;
        this.lexer = options.lexer;
        this.linkLevel = options?.linkLevel??0;
    }
    addLinkLevel(n: number) {
        this.linkLevel += n;
        if(this.parent !== undefined) {
            this.parent.addLinkLevel(n);
        }
    }
    #cleanBuffer(result: MdToken[]) {
        if(this.textBuffer.length > 0) {
            result.push({
                type: "text",
                text: this.textBuffer,
            });
            this.textBuffer = "";
        }
    }
    #extractBuffer() {
        const buffer = this.textBuffer;
        this.textBuffer = "";
        return buffer;
    }
    #symbolCounter(currentSymbol: string, maxCount: number) {
        let count = 0;
        while(count < maxCount && this.index < this.content.length) {
            if(this.content[this.index] !== currentSymbol) {
                break;
            }
            count++;
            this.index++;
        }
        return count;
    }
    tokenize(stop?: (i: number, src: string) => boolean): MdToken[] {
        const result: MdToken[] = [];
        while(this.index < this.content.length) {
            if(
                this.content[this.index] === "\\"
                && this.index + 1 < this.content.length
                && ESCAPING_CHARS.has(this.content[this.index + 1])
            ) {
                this.textBuffer += this.content[this.index + 1];
                this.index += 2;
                continue;
            }
            if(stop && stop(this.index, this.content)) {
                break;
            }
            const currentSymbol = this.content[this.index];
            switch(currentSymbol) {
                case "\n":
                    this.#cleanBuffer(result);
                    this.index++;
                    result.push({
                        type: "newline",
                    });
                    break;
                case "{":
                    if(
                        this.index + 1 < this.content.length
                        && this.content[this.index + 1] === "{"
                    ) {
                        const lastIndex = this.index + 1;
                        this.index += 2;
                        let endMeta = false;
                        while(this.index < this.content.length) {
                            if(
                                this.content[this.index] === "}"
                                && this.index + 1 < this.content.length
                                && this.content[this.index + 1] === "}"
                            ) {
                                endMeta = true;
                                break;
                            }
                            this.index++;
                        }
                        if(endMeta) {
                            this.#cleanBuffer(result);
                            result.push({
                                type: "metadata",
                                name: this.content.slice(lastIndex + 1, this.index),
                            });
                            this.index += 2;
                        } else {
                            this.textBuffer += currentSymbol;
                            this.index = lastIndex;
                        }

                    } else {
                        this.textBuffer += currentSymbol;
                        this.index++;
                    }
                    break;
                case "`":
                    let backtickCount = 0;
                    while(this.index < this.content.length) {
                        if(this.content[this.index] !== "`") {
                            break;
                        }
                        backtickCount++;
                        this.index++;
                    }
                    const startBackticksContent = this.index;
                    let closeBackticksCount = backtickCount;
                    while(this.index < this.content.length) {
                        if(this.content[this.index] === "`") {
                            while(this.index < this.content.length) {
                                if(this.content[this.index] !== "`") {
                                    break;
                                }
                                closeBackticksCount--;
                                this.index++;
                            }
                            if(closeBackticksCount === 0) {
                                break;
                            } else {
                                closeBackticksCount = backtickCount;
                                continue;
                            }
                        }
                        this.index++;
                    }
                    if(closeBackticksCount === 0) {
                        this.#cleanBuffer(result);
                        const content = this.content.slice(startBackticksContent, this.index - backtickCount);
                        result.push({
                            type: "codespan",
                            text: content,
                        });
                    } else {
                        this.textBuffer += this.content.slice(startBackticksContent - backtickCount, startBackticksContent),
                        this.index = startBackticksContent;
                    }
                    break;
                case "!":
                    if(this.index + 1 < this.content.length && this.content[this.index + 1] === "[") {
                        const link = matchLink(this.content, ++this.index);
                        if(link !== null) {
                            this.#cleanBuffer(result);
                            result.push({
                                type: "image",
                                alt: link.label,
                                href: link.href??"",
                                title: link.title,
                            });
                            this.index = link.end;
                        } else {
                            this.textBuffer += "!";
                        }
                    } else {
                        const match = /^!YOUTUBE\[(.*?)\]\{(.*?)\}/.exec(this.content.slice(this.index));
                        if(match !== null) {
                            const [raw, text, attrString] = match;
                            const attrs: Record<string, string> = {};

                            // Parse key="value" pairs
                            attrString.match(/(\w+)="(.*?)"/g)?.forEach(pair => {
                                const [key, val] = pair.split('=');
                                if (key && val) {
                                    attrs[key] = val.replace(/^"|"$/g, '');
                                }
                            });

                            if (!attrs.vid) {
                                this.textBuffer += currentSymbol;
                                this.index++;
                            } else {
                                this.#cleanBuffer(result);
                                result.push({
                                    type: "youtubeEmbed",
                                    title: text,
                                    attributes: attrs,
                                })
                                this.index += raw.length;
                            }
                        } else {
                            this.textBuffer += currentSymbol;
                            this.index++;
                        }
                    }
                    break;
                case "[":
                    if(this.linkLevel < 1) {
                        const link = matchLink(this.content, this.index);
                        if(link !== null) {
                            this.#cleanBuffer(result);
                            result.push({
                                type: "link",
                                label: this.lexer.inlineLex(link.label),
                                href: link.href??"",
                                title: link.title,
                            });
                            this.index = link.end;
                        } else {
                            const refLink = matchReferenceLink(this.content, this.index);
                            if(refLink) {
                                if(refLink.footnote) {
                                    result.push({
                                        type: "footnoteRef",
                                        ref: refLink.ref,
                                    });
                                    if (!this.lexer.footnoteIndexMap.has(refLink.ref)) {
                                        const nextIndex = this.lexer.footnoteIndexMap.size + 1;
                                        this.lexer.footnoteIndexMap.set(refLink.ref, nextIndex);
                                        this.lexer.footnoteRef.set(nextIndex, refLink.ref);
                                    }
                                } else {
                                    result.push({
                                        type: "reflink",
                                        label: this.lexer.inlineLex(refLink.label),
                                        ref: refLink.ref,
                                    });
                                }
                                this.index = refLink.end;
                            } else {
                                this.textBuffer += "[";
                                this.index++;
                            }
                        }
                    } else {
                        const refLink = matchReferenceLink(this.content, this.index);
                        if(refLink !== null && refLink.footnote) {
                            result.push({
                                type: "footnoteRef",
                                ref: refLink.ref,
                            });
                            if (!this.lexer.footnoteIndexMap.has(refLink.ref)) {
                                const nextIndex = this.lexer.footnoteIndexMap.size + 1;
                                this.lexer.footnoteIndexMap.set(refLink.ref, nextIndex);
                                this.lexer.footnoteRef.set(nextIndex, refLink.ref);
                            }
                            this.index = refLink.end;
                        } else {
                            this.textBuffer += "[";
                            this.index++;
                        }
                    }
                    break;
                case "$":
                    if(this.index + 1 < this.content.length && this.content[this.index + 1] === "$") {
                        this.index += 2;
                        const startIndex = this.index;
                        let hasEnd = false;
                        while(this.index < this.content.length) {
                            if(
                                this.content[this.index] === "\\"
                                && this.index + 1 < this.content.length
                                && ESCAPING_CHARS.has(this.content[this.index + 1])
                            ) {
                                this.index += 2;
                                continue;
                            }
                            if(
                                this.content[this.index] === "$"
                                && this.index + 1 < this.content.length
                                && this.content[this.index + 1] === "$"
                            ) {
                                hasEnd = true;
                                break;
                            }
                            this.index++;
                        }
                        if(hasEnd) {
                            result.push({
                                type: "tex",
                                inline: true,
                                displayMode: true,
                                text: this.content.slice(startIndex, this.index),
                            });
                            this.index += 2;
                        } else {
                            this.textBuffer += currentSymbol;
                            this.index = startIndex - 1;
                        }
                    } else {
                        const startIndex = ++this.index;
                        let hasEnd = false;
                        while(this.index < this.content.length) {
                            if(
                                this.content[this.index] === "\\"
                                && this.index + 1 < this.content.length
                                && ESCAPING_CHARS.has(this.content[this.index + 1])
                            ) {
                                this.index += 2;
                                continue;
                            }
                            if(this.content[this.index] === "$") {
                                hasEnd = true;
                                break;
                            }
                            this.index++;
                        }
                        if(hasEnd) {
                            this.#cleanBuffer(result);
                            result.push({
                                type: "tex",
                                inline: true,
                                displayMode: false,
                                text: this.content.slice(startIndex, this.index),
                            });
                            this.index++;
                        } else {
                            this.textBuffer += currentSymbol;
                            this.index = startIndex;
                        }
                    }
                    break;
                case "<":
                    if(this.linkLevel < 1) {
                        const autolink = parseAutolink(this.content, this.index);
                        if(autolink !== null) {
                            this.#cleanBuffer(result);
                            this.index = autolink.end;
                            result.push({
                                type: "link",
                                label: [
                                    {
                                        type: "text",
                                        text: autolink.content,
                                    }
                                ],
                                href: autolink.url,
                                title: undefined,
                            });
                        } else {
                            const html = parseHtmlInline(this.content, this.index, this);
                            if(html !== null) {
                                this.#cleanBuffer(result);
                                result.push({
                                    type: "html",
                                    content: html.content,
                                });
                                this.index += html.content.length;
                            } else {
                                this.textBuffer += currentSymbol;
                                this.index++;
                            }
                        }
                    } else {
                        const html = parseHtmlInline(this.content, this.index, this);
                        if(html !== null) {
                            this.#cleanBuffer(result);
                            result.push({
                                type: "html",
                                content: html.content,
                            });
                            this.index += html.content.length;
                        } else {
                            this.textBuffer += currentSymbol;
                            this.index++;
                        }
                    }
                    break;
                case ">":
                    if(this.index + 1 < this.content.length && this.content[this.index + 1] === "!") {
                        const buffer = this.#extractBuffer();
                        const nextIndex = this.index + 1;
                        this.index += 2;
                        const tokens = this.tokenize((i, src) => i + 1 < src.length && src[i] === "!" && src[i + 1] === "<");
                        if(
                            this.index < this.content.length
                            && this.content[this.index] === "!"
                            && this.index + 1 < this.content.length
                            && this.content[this.index + 1] === "<"
                        ) {
                            this.index += 2;
                            this.textBuffer = buffer;
                            this.#cleanBuffer(result);
                            result.push({
                                type: "spoiler",
                                title: [],
                                inline: true,
                                tokens,
                            });
                        } else {
                            this.index = nextIndex;
                            this.textBuffer = `${buffer}>`;
                        }
                    } else {
                        this.textBuffer += currentSymbol;
                        this.index++;
                    }
                    break;
                case ":":
                    const from = ++this.index;
                    let isFound = false;
                    while(this.index < this.content.length) {
                        isFound = this.content[this.index] === currentSymbol;
                        if(
                            isFound
                            || this.content[this.index] === "\\"
                        ) {
                            break;
                        }
                        this.index++;
                    }
                    if(isFound) {
                        this.#cleanBuffer(result);
                        result.push({
                            type: "emoji",
                            name: this.content.slice(from, this.index),
                        });
                        this.index++;
                    } else {
                        this.textBuffer += currentSymbol;
                        this.index = from;
                    }
                    break;
                case "=":
                case "~":
                case "|":
                case "^":
                    const startDualIndex = this.index + 1;
                    if(this.#symbolCounter(currentSymbol, 2) === 2) {
                        const buffer = this.#extractBuffer();
                        const tokens = this.tokenize(ENDING_STARS.get("double")!(currentSymbol));
                        if(
                            this.index < this.content.length
                            && this.content[this.index] === currentSymbol
                            && this.index + 1 < this.content.length
                            && this.content[this.index + 1] === currentSymbol
                        ) {
                            this.textBuffer = buffer;
                            this.#cleanBuffer(result);
                            if(currentSymbol === "|") {
                                result.push({
                                    type: "spoiler",
                                    title: [],
                                    inline: true,
                                    tokens,
                                });
                            } else {
                                const type = currentSymbol === "~"
                                    ? "strikethrough"
                                    : currentSymbol === "="
                                        ? "highlight"
                                        : "overline";
                                result.push({
                                    type,
                                    tokens,
                                });
                            }
                            this.index += 2;
                        } else {
                            this.textBuffer = `${buffer}${currentSymbol}`;
                            this.index = startDualIndex;
                        }
                    } else {
                        this.textBuffer += currentSymbol;
                        this.index = startDualIndex;
                    }
                    break;
                case "_":
                case "*":
                    const startStarIndex = this.index + 1;
                    const buffer = this.#extractBuffer();
                    let count = this.#symbolCounter(currentSymbol, 3);
                    if(count === 3) { // bold italic
                        const tokens = this.tokenize((i, src) => src[i] === currentSymbol);
                        while(count > 0 && this.index < this.content.length) {
                            if(this.content[this.index] !== currentSymbol) {
                                break;
                            }
                            count--;
                            this.index++;
                        }
                        if(count === 0) {
                            this.textBuffer = buffer;
                            this.#cleanBuffer(result);
                            result.push({
                                type: currentSymbol === "_" ? "underline" : "bold",
                                tokens: [
                                    {
                                        type: "italic",
                                        tokens,
                                    }
                                ]
                            });
                        } else if(count < 3) {
                            if(count === 2) { // Bold / underline
                                const endingFn = currentSymbol === "_" ? "underline" : "bold";
                                const lastTokens = this.tokenize(ENDING_STARS.get(INLINE_KIND_CHARS.get(endingFn)!)!(currentSymbol));
                                if(
                                    this.index < this.content.length
                                    && this.content[this.index] === currentSymbol
                                    && this.index + 1 < this.content.length
                                    && this.content[this.index + 1] === currentSymbol
                                ) {
                                    this.textBuffer = buffer;
                                    this.#cleanBuffer(result);
                                    result.push({
                                        type: currentSymbol === "_" ? "underline" : "bold",
                                        tokens: [
                                            {
                                                type: "italic",
                                                tokens,
                                            },
                                            ...lastTokens,
                                        ]
                                    });
                                    this.index += count;
                                } else {
                                    this.textBuffer = `${buffer}${currentSymbol}`;
                                    this.index = startStarIndex;
                                }
                            } else { // Italic
                                const lastTokens = this.tokenize(ENDING_STARS.get(INLINE_KIND_CHARS.get("italic")!)!(currentSymbol));
                                if(
                                    this.index < this.content.length
                                    && this.content[this.index] === currentSymbol
                                ) {
                                    this.textBuffer = buffer;
                                    this.#cleanBuffer(result);
                                    result.push({
                                        type: "italic",
                                        tokens: [
                                            {
                                                type: currentSymbol === "_" ? "underline" : "bold",
                                                tokens,
                                            },
                                            ...lastTokens,
                                        ]
                                    });
                                    this.index += count;
                                } else {
                                    this.textBuffer = `${buffer}${currentSymbol}`;
                                    this.index = startStarIndex;
                                }
                            }
                        } else {
                            this.textBuffer = `${buffer}${currentSymbol}`;
                            this.index = startStarIndex;
                        }
                    } else { // bold / underline or italic
                        if(count === 2) { // Bold / underline
                            const endingFn = currentSymbol === "_" ? "underline" : "bold";
                            const tokens = this.tokenize(ENDING_STARS.get(INLINE_KIND_CHARS.get(endingFn)!)!(currentSymbol));
                            if(
                                this.index < this.content.length
                                && this.content[this.index] === currentSymbol
                                && this.index + 1 < this.content.length
                                && this.content[this.index + 1] === currentSymbol
                            ) {
                                this.textBuffer = buffer;
                                this.#cleanBuffer(result);
                                result.push({
                                    type: endingFn,
                                    tokens,
                                });
                                this.index += count;
                            } else {
                                this.textBuffer = `${buffer}${currentSymbol}`;
                                this.index = startStarIndex;
                            }
                        } else { // Italic
                            const tokens = this.tokenize(ENDING_STARS.get(INLINE_KIND_CHARS.get("italic")!)!(currentSymbol));
                            if(
                                this.index < this.content.length
                                && this.content[this.index] === currentSymbol
                            ) {
                                this.textBuffer = buffer;
                                this.#cleanBuffer(result);
                                result.push({
                                    type: "italic",
                                    tokens,
                                });
                                this.index += count;
                            } else {
                                this.textBuffer = `${buffer}${currentSymbol}`;
                                this.index = startStarIndex;
                            }
                        }
                    }
                    break;
                default:
                    this.textBuffer += this.content[this.index++];
                    break;
            }
        }
        this.#cleanBuffer(result);
        return result;
    }
}

interface BlockTokenizerOptions {
    lexer: Lexer;
    lines: Line[];
}
class BlockTokenizer {
    lexer: Lexer;
    level: number = 0;
    line: number = 0;
    content: Line[];
    private blockTokens: MdToken[] = [];
    constructor(options: BlockTokenizerOptions) {
        this.lexer = options.lexer;
        this.content = options.lines;
        if(!this.lexer.started) {
            if(this.line < this.content.length) {
                const start = this.content[this.line].content.trimEnd();
                if(start === "---") {
                    let line = this.line + 1;
                    const startIndex = this.line;
                    let endIndex: number|undefined = undefined;
                    while(line < this.content.length) {
                        const maybeEnd = this.content[line].content.trimEnd();
                        if(maybeEnd === "---") {
                            endIndex = line;
                            break;
                        }
                        line++;
                    }
                    if(endIndex) {
                        const meta = this.content
                            .slice(startIndex + 1, endIndex)
                            .map(l => l.content)
                            .join("\n");
                        try {
                            if(this.lexer.frontMatter) {
                                const json = this.lexer.frontMatter(meta);
                                flattenJSONintoMap(json, this.lexer.metadata);
                                this.line = line;
                            } else {
                                const json = JSON.parse(meta);
                                flattenJSONintoMap(json, this.lexer.metadata);
                                this.line = line;
                            }
                        } catch(_) {
                            this.line = startIndex;
                        }
                    }
                }
            }
        }
        this.lexer.started = true;
    }
    getBlock(pskip = false) {
        let token: MdToken|undefined = this.hashHeading();
        if(token) {
            return token;
        }
        token = this.blockQuote();
        if(token) {
            return token;
        }
        token = this.orderedList();
        if(token) {
            return token;
        }
        token = this.tex();
        if(token) {
            return token;
        }
        token = this.unorderedList(pskip);
        if(token) {
            return token;
        }
        token = this.fenceCodeBlock();
        if(token) {
            return token;
        }
        token = this.table();
        if(token) {
            return token;
        }
        token = this.spoiler();
        if(token) {
            return token;
        }
        token = this.include();
        if(token) {
            return token;
        }
        token = this.includeCode();
        if(token) {
            return token;
        }
        token = this.html();
        if(token) {
            return token;
        }
        token = this.horizontal(pskip);
        if(token) {
            return token;
        }
        if(!pskip) {
            token = this.codeBlock();
            if(token) {
                return token;
            }
        }
        return undefined;
    }
    tokenize() {
        while(this.line < this.content.length && this.level <= this.content[this.line].level) {
            if(this.footnoteDef()) {
                continue;
            }
            if(this.reflink()) {
                continue;
            }
            const token = this.getBlock();
            if(token) {
                this.addToken(token);
                continue;
            } else {
                this.paragraph();
            }
        }
        return this;
    }
    getBlocks() {
        return this.blockTokens;
    }
    hashHeading(): HeadingToken | undefined {
        if(this.level < this.content[this.line].level) {
            return undefined;
        }
        const content = this.content[this.line].content;
        let i = 0;
        let hashes = 0;
        while(i < content.length && content[i] === "#") {
            hashes++;
            i++;
        }
        if(hashes > 6 || hashes === 0) {
            return undefined;
        }
        const isIndexed = i < content.length && content[i] === "!";
        if(isIndexed) {
            i++;
        }
        if(i < content.length && WHITESPACE_CHARS.has(content[i])) {
            const { id, text } = extractHeadingId(content.slice(i, content.length));
            this.line++;
            const depth = Math.max(1, Math.min(hashes + this.lexer.headingShift, 6));
            const headingIndex = isIndexed ? this.lexer.newHeading(depth) : "";
            return {
                type: "heading",
                id,
                isUnderline: false,
                headingIndex,
                depth,
                tokens: this.lexer.inlineLex(text),
            };
        } else if(i === content.length) {
            this.line++;
            const depth = Math.max(1, Math.min(hashes + this.lexer.headingShift, 6));
            const headingIndex = isIndexed ? this.lexer.newHeading(depth) : "";
            return {
                type: "heading",
                id: undefined,
                isUnderline: false,
                headingIndex,
                depth,
                tokens: [],
            };
        }
        return undefined;
    }
    codeBlock(): CodeBlockToken | undefined {
        if(this.level < this.content[this.line].level) {
            const removeSpaces = (this.level + 1) * this.lexer.tabulation;
            const content = [ extractCodeBlock(removeSpaces, this.content[this.line++]) ];
            while(this.line < this.content.length && this.content[this.line].level > this.level) {
                content.push(extractCodeBlock(removeSpaces, this.content[this.line++]));
            }
            return {
                type: "codeblock",
                lang: undefined,
                from: undefined,
                to: undefined,
                content: content.join("\r\n"),
            };
        }
        return undefined;
    }
    fenceCodeBlock(): CodeBlockToken | undefined {
        const currentToken = this.content[this.line];
        if(this.level < currentToken.level) {
            return undefined;
        }
        const fenceStartLine = currentToken.content.trimEnd();
        const fenceCount = openFenceCodeBlockCount(fenceStartLine);
        if(!fenceCount) {
            return undefined;
        }
        const lang = fenceStartLine.length !== fenceCount ? fenceStartLine.slice(fenceCount, fenceStartLine.length) : undefined;
        const startIndex = ++this.line;
        let foundEnd = false;
        while(this.line < this.content.length && this.level <= this.content[this.line].level) {
            const fc = closeFenceCodeBlockCount(this.content[this.line].content.trimEnd());
            if(fc && fc >= fenceCount) {
                foundEnd = true;
                this.line++;
                break;
            }
            this.line++;
        }
        const wsCount = currentToken.level * this.lexer.tabulation;
        const content = this.content
            .slice(startIndex, foundEnd ? this.line - 1 : this.line)
            .map(l => extractCodeBlock(wsCount, l))
            .join("\r\n");
        return {
            type: "codeblock",
            lang,
            from: undefined,
            to: undefined,
            content,
        };
    }
    spoiler(): SpoilerToken | undefined {
        const currentToken = this.content[this.line];
        if(this.level < currentToken.level) {
            return undefined;
        }
        const opening = currentToken.content.trimEnd();
        if(opening.length > 1 && opening[0] === "!" && opening[1] === ">") {
            const title = opening.length > 2 ? opening.slice(2, opening.length).trimStart() : "";
            const startIndex = ++this.line;
            while(this.line < this.content.length) {
                if(this.content[this.line].content.trimEnd() === "<!") {
                    break;
                }
                this.line++;
            }
            const tokens = new BlockTokenizer({
                    lexer: this.lexer,
                    lines: this.content.slice(startIndex, this.line),
                })
                .tokenize()
                .getBlocks();
            this.line++;
            return {
                type: "spoiler",
                title: this.lexer.inlineLex(title),
                inline: false,
                tokens,
            };
        }
        return undefined;
    }
    tex(): TexToken | undefined {
        const currentLine = this.content[this.line];
        if(this.level < currentLine.level) {
            return undefined;
        }
        if(currentLine.content.trimEnd().length == 2 && currentLine.content[0] === "$" && currentLine.content[1] === "$") {
            this.line++;
            const result: string[] = [];
            while(this.line < this.content.length) {
                const line = this.content[this.line++].content.trimEnd();
                if(line === "$$") {
                    break;
                }
                if(line.length === 0) {
                    continue;
                }
                result.push(line);
            }
            return {
                type: "tex",
                text: result.join("\n").trim(),
                inline: false,
                displayMode: true
            };
        }
        return undefined;
    }
    horizontal(pskip = false): HorizontalToken | undefined {
        const currentToken = this.content[this.line];
        if(this.level < currentToken.level) {
            return undefined;
        }
        const content = currentToken.content.trimEnd();
        let occurences = 0;
        let character: string|undefined = undefined;
        for(let i = 0; i < content.length; i++) {
            const currChar = content[i];
            if(i !== 0) {
                if(character !== currChar) {
                    character = undefined;
                    break;
                }
                occurences++;
            } else {
                if(currChar === "*" || (!pskip && currChar === "-") || currChar === "_") {
                    character = currChar;
                    occurences++;
                } else {
                    break;
                }
            }
        }
        if(character === undefined || occurences < 3) {
            return undefined;
        }
        this.line++;
        return {
            type: "horizontal",
            character,
        };
    }
    blockQuote(): BlockQuoteToken | undefined {
        const firstLine = this.content[this.line];
        if(this.level < firstLine.level) {
            return undefined;
        }
        // Not blockquote, skip it
        if(!(firstLine.content.length > 0 && firstLine.content[0] === ">")) {
            return undefined;
        }
        const lines: Line[] = [];
        let skipLastElement = false;
        while(this.line < this.content.length) {
            const currentLine = this.content[this.line];
            const currentContent = currentLine.content.trimEnd();
            if(currentContent.length === 0) { // 3.
                this.line++;
                break;
            }
            if(
                isOrderedListItem(currentContent)
                || isUnorderedListItem(currentContent)
                || isFenceCodeBlock(this.level, this.line, this.content)
                || isHashHeading(this.level, this.line, this.content)
                || isHorizontal(this.level, this.line, this.content)
                || isTable(this.level, this.line, this.content)
                || isRefLink(this.level, this.line, this.content)
                || (this.lexer.includeCode !== undefined && isIncludeCode(this.level, this.line, this.content))
                || (this.lexer.include !== undefined && isInclude(this.level, this.line, this.content))
                || isHtml(this.level, this.line, this.content)
                || isFootnoteRef(this.level, this.line, this.content)
            ) { // Skip blocks
                break;
            } if(currentContent[0] === ">") { // direct blockquote
                if(currentLine.level > firstLine.level) {
                    break;
                }
                const reformat = rebuildLineWhitespace(
                    cutCharFollowedByWhitespace(">", currentContent),
                    this.lexer.tabulation
                );
                const fenceCount = openFenceCodeBlockCount(reformat.content);
                const listItem = isOrderedListItem(reformat.content)
                    || isUnorderedListItem(reformat.content);
                // The following lines won't be the continued paragraph, so we can skip them if needed
                skipLastElement = reformat.level > 0 || listItem || fenceCount !== undefined || quoteLength(reformat.content) === 0;
                lines.push(reformat);
            } else if(skipLastElement) { // The last part was a blockquote, skip
                break;
            } else { // This is the ending lines
                const lastLine = lines[lines.length - 1];
                lines[lines.length - 1].content = `${lastLine.content}\n${currentLine.content}`;
            }
            this.line++;
        }
        const blocks = new BlockTokenizer({
            lexer: this.lexer,
            lines,
        });
        return {
            type: "blockquote",
            tokens: blocks
                .tokenize()
                .getBlocks(),
        };
    }
    orderedList(): ListToken | undefined {
        if(this.level < this.content[this.line].level) {
            return undefined;
        }
        const items: ListItemToken[] = [];
        const startAt = findOrderedListStartAt(this.content[this.line].content);
        while(this.line < this.content.length) {
            const currentLine = this.content[this.line];
            const currentItem = extractOrderedListItem(currentLine.content.trimEnd(), this.lexer.tabulation);
            if(currentItem) {
                const checkListItem = checkListExtractor(currentItem.content);
                currentItem.content = checkListItem.content;
                let lines = [ currentItem ];
                this.line++;
                let previousIsEmpty = false;
                while(this.line < this.content.length) {
                    const item = this.content[this.line];
                    const itemContent = item.content.trimEnd();
                    if(previousIsEmpty && itemContent.length === 0) {
                        this.line++;
                        continue;
                    }
                    const isBlock = isOrderedListItem(itemContent)
                            || isUnorderedListItem(itemContent)
                            || isFenceCodeBlock(this.level, this.line, this.content)
                            || isBlockquote(this.level, this.line, this.content)
                            || isHashHeading(this.level, this.line, this.content)
                            || isHorizontal(this.level, this.line, this.content)
                            || isTable(this.level, this.line, this.content)
                            || isRefLink(this.level, this.line, this.content)
                            || (this.lexer.includeCode !== undefined && isIncludeCode(this.level, this.line, this.content))
                            || (this.lexer.include !== undefined && isInclude(this.level, this.line, this.content))
                            || isHtml(this.level, this.line, this.content)
                            || isFootnoteRef(this.level, this.line, this.content);
                    if((!isBlock && item.level === this.level && !previousIsEmpty)
                        || item.level > this.level
                        || itemContent.length === 0
                    ) {
                        previousIsEmpty = itemContent.length === 0;
                        const removeSpaces = (this.level + 1) * this.lexer.tabulation;
                        lines.push({
                            startWs: item.startWs.slice(removeSpaces, item.startWs.length),
                            level: Math.max(0, item.level - 1),
                            content: item.content,
                        });
                    } else {
                        break;
                    }
                    this.line++;
                }
                const tokens = new BlockTokenizer({
                        lexer: this.lexer,
                        lines,
                    })
                    .tokenize()
                    .getBlocks();
                // @todo: if there's only one paragraph, extract it as inline
                items.push({
                    type: "listItem",
                    task: checkListItem.todo,
                    checked: checkListItem.checked,
                    tokens,
                });
            } else {
                break;
            }
        }
        if(items.length === 0) {
            return undefined;
        }
        return {
            type: "list",
            startAt,
            ordered: true,
            items,
        };
    }
    unorderedList(pskip = false): ListToken | undefined {
        const firstElement = this.content[this.line];
        if(this.level < firstElement.level) {
            return undefined;
        }
        const symbol = firstElement.content.length > 0 ? firstElement.content[0] : undefined;
        if(symbol === undefined || (symbol !== "-" && symbol !== "*" && symbol !== "+")) {
            return undefined;
        }
        const items: ListItemToken[] = [];
        while(this.line < this.content.length) {
            const currentLine = this.content[this.line];
            const currentItem = extractUnorderedListItem(symbol, currentLine.content.trimEnd(), this.lexer.tabulation, pskip);
            if(currentItem) {
                const checkListItem = checkListExtractor(currentItem.content);
                currentItem.content = checkListItem.content;
                let lines = [ currentItem ];
                this.line++;
                let previousIsEmpty = false;
                while(this.line < this.content.length) {
                    const item = this.content[this.line];
                    const itemContent = item.content.trimEnd();
                    if(previousIsEmpty && itemContent.length === 0) {
                        this.line++;
                        continue;
                    }
                    const isBlock = isOrderedListItem(itemContent)
                            || isUnorderedListItem(itemContent)
                            || isFenceCodeBlock(this.level, this.line, this.content)
                            || isBlockquote(this.level, this.line, this.content)
                            || isHashHeading(this.level, this.line, this.content)
                            || isHorizontal(this.level, this.line, this.content)
                            || isTable(this.level, this.line, this.content)
                            || isRefLink(this.level, this.line, this.content)
                            || (this.lexer.includeCode !== undefined && isIncludeCode(this.level, this.line, this.content))
                            || (this.lexer.include !== undefined && isInclude(this.level, this.line, this.content))
                            || isHtml(this.level, this.line, this.content)
                            || isFootnoteRef(this.level, this.line, this.content);
                    if((!isBlock && item.level === this.level && !previousIsEmpty)
                        || item.level > this.level
                        || itemContent.length === 0
                    ) {
                        previousIsEmpty = itemContent.length === 0;
                        const removeSpaces = (this.level + 1) * this.lexer.tabulation;
                        lines.push({
                            startWs: item.startWs.slice(removeSpaces, item.startWs.length),
                            level: Math.max(0, item.level - 1),
                            content: item.content,
                        });
                    } else {
                        break;
                    }
                    this.line++;
                }
                const tokens = new BlockTokenizer({
                        lexer: this.lexer,
                        lines,
                    })
                    .tokenize()
                    .getBlocks();
                // @todo: if there's only one paragraph, extract it as inline
                items.push({
                    type: "listItem",
                    task: checkListItem.todo,
                    checked: checkListItem.checked,
                    tokens,
                });
            } else {
                break;
            }
        }
        if(items.length === 0) {
            return undefined;
        }
        return {
            type: "list",
            startAt: undefined,
            ordered: false,
            items,
        };
    }
    table(): TableToken | undefined {
        const firstElement = this.content[this.line];
        if(this.level < firstElement.level || this.line + 1 >= this.content.length) {
            return undefined;
        }
        const secondElement = this.content[this.line + 1];
        if(this.level < secondElement.level) {
            return undefined;
        }
        const tableAlign = processAlignTable(tableLineToCells(stripTableBorder(secondElement.content)));
        if(tableAlign !== undefined && isMaybeTable(secondElement.content)) { // There is an alignment for table
            const headerCells = tableLineToCells(stripTableBorder(firstElement.content));
            if(tableAlign.length === headerCells.length) { // Alignment and table are the same
                const header: TableCellToken[] = headerCells.map((content, i) => ({
                    type: "cell",
                    header: true,
                    align: tableAlign[i],
                    tokens: this.lexer.inlineLex(content),
                }));
                this.line += 2;
                const rows: TableCellToken[][] = [];
                while(this.line < this.content.length) {
                    const currentItem = this.content[this.line];
                    if( // Shouldn't be one of the following
                        this.level < currentItem.level // blockcode
                        || isOrderedListItem(currentItem.content)
                        || isUnorderedListItem(currentItem.content)
                        || isFenceCodeBlock(this.level, this.line, this.content)
                        || isBlockquote(this.level, this.line, this.content)
                        || isHashHeading(this.level, this.line, this.content)
                        || isHorizontal(this.level, this.line, this.content)
                        || isTable(this.level, this.line, this.content)
                        || isRefLink(this.level, this.line, this.content)
                        || (this.lexer.includeCode !== undefined && isIncludeCode(this.level, this.line, this.content))
                        || (this.lexer.include !== undefined && isInclude(this.level, this.line, this.content))
                        || isHtml(this.level, this.line, this.content)
                        || isFootnoteRef(this.level, this.line, this.content)
                    ) {
                        break;
                    }
                    const row = tableLineToCells(stripTableBorder(secondElement.content));
                    // Normalize table
                    while(row.length > header.length) {
                        row.pop();
                    }
                    while(row.length < header.length) {
                        row.push("");
                    }
                    rows.push(
                        row.filter((_, i) => i < tableAlign.length)
                            .map((content, i) => ({
                                type: "cell",
                                header: false,
                                align: tableAlign[i],
                                tokens: this.lexer.inlineLex(content),
                            }))
                    );
                    this.line++;
                }
                return {
                    type: "table",
                    header,
                    rows,
                };
            }
        }
        return undefined;
    }
    footnoteDef(): boolean {
        const currentItem = this.content[this.line];
        if(this.level < currentItem.level) {
            return false;
        }
        const match = /^\[\^([^\]]+)\]:\s+(.+)/.exec(currentItem.content);
        if(match) {
            const [_, ref, content] = match;
            this.line++;
            let lines = [ rebuildLineWhitespace(content, this.lexer.tabulation) ];
            let previousIsEmpty = false;
            while(this.line < this.content.length) {
                const item = this.content[this.line];
                const itemContent = item.content.trimEnd();
                if(previousIsEmpty && itemContent.length === 0) {
                    this.line++;
                    continue;
                }
                const isBlock = isOrderedListItem(itemContent)
                        || isUnorderedListItem(itemContent)
                        || isFenceCodeBlock(this.level, this.line, this.content)
                        || isBlockquote(this.level, this.line, this.content)
                        || isHashHeading(this.level, this.line, this.content)
                        || isHorizontal(this.level, this.line, this.content)
                        || isTable(this.level, this.line, this.content)
                        || isRefLink(this.level, this.line, this.content)
                        || (this.lexer.includeCode !== undefined && isIncludeCode(this.level, this.line, this.content))
                        || (this.lexer.include !== undefined && isInclude(this.level, this.line, this.content))
                        || isHtml(this.level, this.line, this.content)
                        || isFootnoteRef(this.level, this.line, this.content);
                if((!isBlock && item.level === this.level && !previousIsEmpty)
                    || item.level > this.level
                    || itemContent.length === 0
                ) {
                    previousIsEmpty = itemContent.length === 0;
                    const removeSpaces = (this.level + 1) * this.lexer.tabulation;
                    lines.push({
                        startWs: item.startWs.slice(removeSpaces, item.startWs.length),
                        level: Math.max(0, item.level - 1),
                        content: item.content,
                    });
                } else {
                    break;
                }
                this.line++;
            }
            if(!this.lexer.footnoteDefs.has(ref)) {
                const tokens = new BlockTokenizer({
                        lexer: this.lexer,
                        lines,
                    })
                    .tokenize()
                    .getBlocks();
                this.lexer.footnoteDefs.set(ref, tokens);
            }
            return true;
        }
        return false;
    }
    include(): IncludeToken | undefined {
        const currentItem = this.content[this.line];
        if(this.level < currentItem.level || this.lexer.include === undefined || currentItem.content.length < 11) {
            return undefined;
        }
        const match = /^!INCLUDE\s+(?:['"](.+?)['"]|\((.+?)\))(?:,\s*(?:l\s*(?:(\d+)?(?::(\d+))?)?)?(?:\s*s\s*(\d+))?)?\s*$/i.exec(currentItem.content);
        if(match) {
            const [_, loc1, loc2, fromStr, toStr, hShift]=match;
            const includeLocation = loc1 ?? loc2;
            if(this.lexer.includedLocations.has(includeLocation)) {
                return {
                    type: "include",
                    tokens: [],
                };
            }
            let from: number | undefined, to: number | undefined, headingShifter: number;
             try {
                from = fromStr ? Math.max(parseInt(fromStr, 10), 1) : undefined;
            } catch(_) {}
            try {
                to = toStr ? Math.max(parseInt(toStr, 10), 1) : undefined;
            } catch(_) {}
            try {
                headingShifter = hShift ? parseInt(hShift, 10) : 0;
            } catch(_) {
                headingShifter = 0;
            }
            this.lexer.includedLocations.add(includeLocation);
            const currentHeadingShift = this.lexer.headingShift;
            this.lexer.headingShift = Math.max(-6, Math.min(currentHeadingShift + headingShifter, 6));
            this.lexer.started = false;
            const tokens = this.lexer.lex(
                this.lexer.include(includeLocation, from, to)
            );
            this.lexer.headingShift = currentHeadingShift;
            this.lexer.includedLocations.delete(includeLocation);
            this.line++;
            return {
                type: "include",
                tokens,
            };
        }
        return undefined;
    }
    includeCode(): CodeBlockToken | undefined {
        const currentItem = this.content[this.line];
        if(this.level < currentItem.level || this.lexer.includeCode === undefined || currentItem.content.length < 15) {
            return undefined;
        }
        const match = /^!INCLUDECODE\s+(?:["'](.+?)["']|\((.+?)\))(?:\s*\((\w+)\))?(?:\s*,\s*(?:(\d+)?(?::(\d+))?))?\s*$/i.exec(currentItem.content);
        if (match) {
            const [raw, includePath, lang, fromStr, toStr] = match;
            let from: number|undefined, to: number|undefined;
            try {
                from = fromStr ? Math.max(parseInt(fromStr, 10), 1) : undefined;
            } catch(_) {}
            try {
                to = toStr ? Math.max(parseInt(toStr, 10), 1) : undefined;
            } catch(_) {}
            const content = this.lexer.includeCode(includePath, from, to) ?? raw;
            this.line++;
            return {
                type: "codeblock",
                from,
                to,
                lang,
                content,
            };
        }
        return undefined;
    }
    html(): HTMLToken | undefined {
        const currentLine = this.content[this.line];
        if (this.level < currentLine.level) {
            return undefined;
        }

        const lineText = currentLine.content;
        if (!lineText.trim().startsWith("<")) return undefined;

        let matchedSeq = null;

        for (const seq of htmlPatterns) {
            if (seq.open.test(lineText)) {
                matchedSeq = seq;
                break;
            }
        }

        if (!matchedSeq) return undefined;

        const start = this.line;
        let end = this.line + 1;

        // If it's not closed on the first line, search for the closing condition
        if (!matchedSeq.close.test(lineText)) {
            while (end < this.content.length) {
                const next = this.content[end];
                if (matchedSeq.close.test(next.content)) {
                    if (next.content.trim().length !== 0) {
                        end += 1;
                    }
                    break;
                }
                end += 1;
            }
        }

        // Join the lines into a single string of HTML content
        const htmlLines = this.content.slice(start, end).map(l => l.content);
        const content = htmlLines.join('\n');

        this.line = end; // Advance the tokenizer's cursor

        return {
            type: "html",
            content
        };
    }
    paragraph() {
        let paragraphLines: Line[] = [];
        let tokenFound: MdBlockToken|undefined = undefined;
        while(this.line < this.content.length && this.level <= this.content[this.line].level) {
            const currentLine = this.content[this.line];
            if(
                this.level > currentLine.level
                || isRefLink(this.level, this.line, this.content)
                || isFootnoteRef(this.level, this.line, this.content)
            ) {
                break;
            }
            const maybeToken = this.getBlock(true);
            if(maybeToken) {
                tokenFound = maybeToken;
                break;
            }
            const content = currentLine.content.trimEnd();
            if(content === "") {
                this.line++;
                break;
            }
            if(paragraphLines.length > 0) {
                const maybeHeading = isUnderlineHeading(this.level, currentLine);
                if(maybeHeading) {
                    const depth = maybeHeading === "="
                            ? Math.max(Math.min(this.lexer.headingShift + 1, 6), 1)
                            : Math.max(Math.min(this.lexer.headingShift + 2, 6), 1);
                    tokenFound = {
                        type: "heading",
                        id: undefined,
                        isUnderline: true,
                        headingIndex: "",
                        depth,
                        tokens: this.lexer.inlineLex(paragraphLines
                            .map(p => p.content)
                            .join("\n")),
                    };
                    paragraphLines = [];
                    this.line++;
                    break;
                }
                const maybeDefinitionList = isDefinitionList(this.level, currentLine);
                if(maybeDefinitionList) {
                    const term = paragraphLines
                            .map(p => p.content)
                            .join("\n");
                    const definitions: MdToken[][] = [];
                    while(this.line < this.content.length) {
                        const newDefStart = this.content[this.line];
                        const isNewDef = isDefinitionList(this.level, newDefStart);
                        if(isNewDef) {
                            const fistLine = rebuildLineWhitespace(
                                newDefStart.content.slice(2, newDefStart.content.length),
                                this.lexer.tabulation
                            );
                            this.line++;
                            const newDef = [ fistLine ];
                            while(this.line < this.content.length) {
                                const newCurrentLine = this.content[this.line];
                                const currentContent = newCurrentLine.content.trimEnd();
                                if(currentContent.length !== 0 && this.level >= newCurrentLine.level) {
                                    break;
                                } else if(currentContent.length === 0) {
                                    this.line++;
                                    continue;
                                }
                                const removeSpaces = (this.level + 1) * this.lexer.tabulation;
                                newDef.push({
                                    startWs: newCurrentLine.startWs.slice(removeSpaces, newCurrentLine.startWs.length),
                                    level: Math.max(0, newCurrentLine.level - 1),
                                    content: newCurrentLine.content,
                                });
                                this.line++;
                            }
                            const item = new BlockTokenizer({
                                lexer: this.lexer,
                                lines: newDef,
                            })
                                .tokenize()
                                .getBlocks();
                            definitions.push(item);
                        } else {
                            break;
                        }
                    }
                    tokenFound = {
                        type: "definitionListItem",
                        term: this.lexer.inlineLex(term),
                        definitions,
                    };
                    paragraphLines = [];
                    break;
                }
            }
            paragraphLines.push({
                level: this.content[this.line].level,
                startWs: this.content[this.line].startWs,
                content,
            });
            this.line++;
        }
        if(paragraphLines.length === 0) {
            this.addToken(tokenFound);
            return;
        }
        this.blockTokens.push({
            type: "paragraph",
            lines: paragraphLines.length,
            tokens: this.lexer.inlineLex(paragraphLines.map(p => p.content).join("\n")),
        });
        this.addToken(tokenFound);
    }
    reflink(): boolean {
        const currentItem = this.content[this.line];
        if(this.level < currentItem.level) {
            return false;
        }
        const match = /^\[([^\]]+)\]:\s+(?:<(\S+)>|(\S+))(?:\s+(?:"([^"]+)"|'([^']+)'|\(([^)]+)\)))?$/.exec(currentItem.content);
        if (match) {
            const [_, ref, linkA, linkB, titleA, titleB, titleC] = match;
            const link = linkA || linkB;
            const title: string|undefined = (titleA ?? titleB ?? titleC) ?? undefined;
            this.line++;
            if(!this.lexer.reflinks.has(ref)) {
                this.lexer.reflinks.set(ref, {
                    link,
                    title,
                });
            }
            return true;
        }
        return false;
    }
    addToken(tokenFound: MdBlockToken|undefined) {
        if(tokenFound) {
            if(tokenFound.type === "definitionListItem") {
                if(this.blockTokens.length > 0) {
                    const lastToken = this.blockTokens[this.blockTokens.length - 1];
                    if(lastToken.type === "definitionList") {
                        lastToken.items.push(tokenFound);
                    } else {
                        this.blockTokens.push({
                            type: "definitionList",
                            items: [ tokenFound ],
                        });
                    }
                } else {
                    this.blockTokens.push({
                        type: "definitionList",
                        items: [ tokenFound ],
                    });
                }
            } else {
                this.blockTokens.push(tokenFound);
            }
        }
    }
}

type EmojiRecord = { type: "char", char: string }
    |{ type: "img", url: string, alt?: string, width?: number, height?: number }
    |{ type: "i", className: string };

type TokenType = MdToken["type"];
type ExtractToken<T extends TokenType> = Extract<MdToken, { type: T }>;

type TokenRendering = { [K in TokenType]: (this: Renderer, token: ExtractToken<K>) => string };

const RENDERER_FNS: TokenRendering = {
    emoji(token) {
        const emoji = this.emojis[token.name];
        if (emoji === undefined) {
            return `:${token.name}:`;
        }
        switch (emoji.type) {
            case "img":
                return `<img alt="${emoji.alt ?? token.name}" src="${emoji.url}" class="md-emoji-image" width="${emoji.width ?? 20}" height="${emoji.height ?? 20}">`;
            case "i":
                return `<i class="${emoji.className}"></i>`;
            default:
                return emoji.char;
        }
    },
    definitionListItem(token) {
        const definitions = token.definitions.map(def => `<dd class="md-defdef">${this.renderer(def)}</dd>`).join("");
        return `<dt class="md-defterm">${this.renderer(token.term)}</dt>${definitions}`;
    },
    heading(token) {
        const headingContent = this.renderer(token.tokens);
        const id = token.id ? ` id="${token.id}"` : "";
        return token.isUnderline
            ? `<h${token.depth} class="md-heading md-h-underline">${token.headingIndex}${headingContent}</h${token.depth}>`
            : `<h${token.depth}${id} class="md-heading">${token.headingIndex}${headingContent}</h${token.depth}>`;
    },
    codeblock(token) {
        if (token.from !== undefined || token.to !== undefined) {
            const from = token.from || 1;
            let codeText = '';
            let lang = '';
            if (token.lang && hljs.getLanguage(token.lang)) {
                if (token.lang) lang = ` language-${token.lang}`;
                codeText = hljs.highlight(token.content, { language: token.lang }).value;
            } else {
                codeText = escape(token.content, true);
            }
            return `<pre class="md-precode"><code class="md-code${lang}"><table class="md-code-table"><colgroup><col /><col class="md-table-line-space" /><col /></colgroup><tbody>${codeText.split(/\r?\n/)
                .map((c, i) => `<tr class="md-code-row"><td class="md-number-ln">${i + from}</td><td></td><td class="md-code-ln">${c}</td></tr>`)
                .join('')}</tbody></table></code></pre>`;
        } else {
            if (token.lang && hljs.getLanguage(token.lang)) {
                const lang = token.lang ? `language-${token.lang}` : '';
                return `<pre class="md-precode"><code class="md-code ${lang}">${hljs.highlight(token.content, { language: token.lang }).value}</code></pre>`;
            } else if (token.lang === "mermaid") {
                return `<pre class="md-mermaid mermaid">${escape(token.content, true)}</pre>`;
            }
            return `<pre class="md-precode"><code class="md-code">${escape(token.content, true)}</code></pre>`;
        }
    },
    horizontal(token) {
        return "<hr class=\"md-line\">";
    },
    blockquote(token) {
        return `<blockquote class="md-blockquote">${this.renderer(token.tokens)}</blockquote>`;
    },
    list(token) {
        const type = token.ordered ? 'ol' : 'ul';
        return `<${type} class="md-${type}list">${this.renderer(token.items)}</${type}>`;
    },
    listItem(token) {
        const head = token.task ? `<input class="md-checkbox" type="checkbox" disabled${token.checked ? ' checked' : ''}>` : "";
        const body = this.renderer(token.tokens);
        return `<li class="${token.task ? "md-taskitem" : "md-listitem"}">${head}${body}</li>`;
    },
    table(token) {
        const header = `<thead class="md-thead"><tr class="md-htablerow">${this.renderer(token.header)}</tr></thead>`;
        const body = `<tbody class="md-tbody">${token.rows.map(cells => `<tr class="md-tablerow">${this.renderer(cells)}</tr>`).join("")}</tbody>`;
        return `<table class="md-table" role="table">${header}${body}</table>`;
    },
    cell(token) {
        const tag = token.header ? 'th' : 'td';
        if(token.header) {
            const style = token.align !== "default" ? ` style="text-align:${token.align}"` : '';
            return `<${tag} class="md-tablecell" ${style}>${this.renderer(token.tokens)}</${tag}>`;
        } else {
            const style = token.align !== "default" ? ` style="text-align:${token.align}"` : '';
            return `<${tag} class="md-tablecell" ${style}>${this.renderer(token.tokens)}</${tag}>`;
        }
    },
    footnoteRef(token) {
        return `<sup id="fnref:${token.ref}"><a class="md-link" href="#fn:${token.ref}">[${this.footnoteIndexRefs.get(token.ref)??-1}]</a></sup>`;
    },
    footnoteEnd(_) {
        let result = "";
        const refSize = this.footnoteRefs.size;
        for(let i = 1; i <= refSize; i++) {
            const ref = this.footnoteRefs.get(i)!;
            const def = this.footnoteDefs.get(ref);
            if(def !== undefined) {
                result += `<li class="md-fnitem" id="fn:${ref}">${this.renderer(def)}</li>`;
            } else {
                result += `<li class="md-fnitem" id="fn:${ref}">[${ref}]</li>`;
            }
        }
        return `<section class="md-footnotes"><ol class="md-fnlist" dir="auto">${result}</ol></section>`;
    },
    definitionList(token): string {
        return `<dl class="md-deflist">${this.renderer(token.items)}</dl>`;
    },
    tex(token) {
        return katex.renderToString(token.text, {
            strict: false,
            throwOnError: false,
            output: "htmlAndMathml",
            displayMode: token.displayMode,
        });
    },
    spoiler(token) {
        const spoilerContent = this.renderer(token.tokens);
        if (token.inline) {
            return `<label class="md-spoiler"><input class="md-spoiltrigger" type="checkbox" hidden><span class="md-spoilertext">${spoilerContent}</span></label>`;
        }
        return `<div class="md-spoiler-toggle"><input type="checkbox" id="md-spoiler-label" hidden><label for="md-spoiler-label" class="md-spoiler-header">${this.renderer(token.title)}</label><div class="md-spoiler-content">${spoilerContent}</div></div>`;
    },
    include(token) {
        return this.renderer(token.tokens);
    },
    html(token) {
        return token.content;
    },
    paragraph(token) {
        return `<p class="md-paragraph">${this.renderer(token.tokens)}</p>`;
    },
    overline(token) {
        return `<u class="md-overline">${this.renderer(token.tokens)}</u>`;
    },
    newline(_) {
        return "<br/>";
    },
    highlight(token) {
        return `<mark class="md-highlight">${this.renderer(token.tokens)}</mark>`;
    },
    strikethrough(token) {
        return `<del class="md-strikethrough">${this.renderer(token.tokens)}</del>`;
    },
    underline(token) {
        return `<u class="md-underline">${this.renderer(token.tokens)}</u>`;
    },
    bold(token) {
        return `<strong class="md-bold">${this.renderer(token.tokens)}</strong>`;
    },
    italic(token) {
        return `<em class="md-italic">${this.renderer(token.tokens)}</em>`;
    },
    text(token) {
        return escape(token.text);
    },
    codespan(token) {
        return `<code class="md-codespan">${escape(token.text, true)}</code>`;
    },
    youtubeEmbed(token) {
        const vid = token.attributes.vid;
        const title = token.title || 'YouTube';
        const width = token.attributes.width || '560';
        const height = token.attributes.height || '315';
        const start = token.attributes.start;
        const allowfullscreen = token.attributes.allowfullscreen !== 'false';

        const urlParams = new URLSearchParams();
        if (start) urlParams.set('start', start);

        const src = `https://www.youtube.com/embed/${vid}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        return `<div class="md-youtube"><iframe width="${width}" height="${height}" src="${src}" title="${title}" frameborder="0" ${allowfullscreen ? ' allowfullscreen' : ''}></iframe></div>`;
    },
    metadata(token) {
        const metadata = this.metadata.get(token.name);
        if (metadata) {
            return escape(metadata);
        }
        return "";
    },
    link(token) {
        const linkText = this.renderer(token.label);
        const cleanHref = cleanUrl(token.href);
        if (cleanHref === null) {
            return linkText;
        }
        const title = token.title ? ` title="${escape(token.title)}"` : '';
        const blank = cleanHref.startsWith("#") ? '' : ' target="_blank" rel="noopener"';
        return `<a class="md-link" href="${cleanHref}"${title}${blank}>${linkText}</a>`;
    },
    reflink(token) {
        const reflinkText = this.renderer(token.label);
        const refLink = this.reflinks.get(token.ref);
        if (refLink) {
            const cleanHref = cleanUrl(refLink.link);
            if (cleanHref === null) {
                return reflinkText;
            }
            const title = refLink.title ? ` title="${escape(refLink.title)}"` : '';
            const blank = cleanHref.startsWith("#") ? '' : ' target="_blank" rel="noopener"';
            return `<a class="md-link" href="${cleanHref}"${title}${blank}>${reflinkText}</a>`;
        }
        return reflinkText;
    },
    image(token) {
        const imgcleanHref = cleanUrl(token.href);
        const alt = escape(token.alt);
        if (imgcleanHref === null) {
            return alt;
        }
        const title = token.title ? ` title="${escape(token.title)}"` : '';
        return `<img src="${imgcleanHref}" alt="${alt}" class="md-image"${title}>`;
    },
};

class Renderer {
    metadata: Map<string, string>;
    emojis: Record<string, EmojiRecord>;
    reflinks: Map<string, LinkRef>;
    footnoteDefs: Map<string, MdToken[]>;
    footnoteIndexRefs: Map<string, number>;
    footnoteRefs: Map<number, string>;
    tokens: MdToken[];
    constructor(root: RootToken, emojis: Record<string, EmojiRecord>) {
        this.metadata = root.metadata;
        this.emojis = emojis;
        this.reflinks = root.reflinks;
        this.footnoteDefs = root.footnoteDefs;
        this.footnoteRefs = root.footnoteRefs;
        this.tokens = root.tokens;
        this.footnoteIndexRefs = root.footnoteIndexRefs;
    }
    render() {
        return this.renderer(this.tokens);
    }
    renderer(tokens: MdToken[]) {
        let result = "";
        for(const token of tokens) {
            result += RENDERER_FNS[token.type].call(this, token as any);
        }
        return result;
    }
}

interface MarkdownImpOptions {
    tabulation?: number;
    metadata?: Map<string, string>;
    emojis?: Record<string, EmojiRecord>;
    frontMatter?: (content: string) => unknown;
    include?: (location: string, from: number|undefined, to: number|undefined) => string;
    includeCode?: (location: string, from: number|undefined, to: number|undefined) => string | undefined;
}

class MarkdownImp {
    tabulation: number;
    metadata: Map<string, string>;
    emojis: Record<string, EmojiRecord>;
    frontMatter?: (content: string) => unknown;
    include?: (location: string, from: number|undefined, to: number|undefined) => string;
    includeCode?: (location: string, from: number|undefined, to: number|undefined) => string | undefined;
    constructor(options: MarkdownImpOptions = {}) {
        this.tabulation = options?.tabulation??4;
        this.metadata = options?.metadata??new Map();
        this.emojis = options?.emojis??{};
        this.frontMatter = options?.frontMatter;
        this.include = options?.include;
        this.includeCode = options?.includeCode;
    }
    ast(markdown: string): RootToken {
        return Lexer.lex(markdown, {
            tabulation: this.tabulation,
            metadata: this.metadata,
            frontMatter: this.frontMatter,
            include: this.include,
            includeCode: this.includeCode,
        });
    }
    render(root: RootToken) {
        const render = new Renderer(root, this.emojis);
        return render.render();
    }
    parse(markdown: string) {
        const ast = this.ast(markdown);
        return this.render(ast);
    }
}

const markdownImp = new MarkdownImp({
        include(loc, from, to) {
            return `${loc} from [${from}] to [${to}]`;
        },
        includeCode(loc, from, to) {
            return `${loc} from [${from}] to [${to}]`;
        },
    });

import fs from "fs"
import hljs from "highlight.js";
import katex from "katex";
import path from "path"

const content = fs.readFileSync(path.join(__dirname, "../examples/index.md"), "utf8");

const htmlElement = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/_internal/livify.css">
        <link rel="stylesheet" href="/_internal/css/katex.min.css">
        <link rel="stylesheet" href="/_internal/css/vs2015.min.css">
        <script type="module" src="/_internal/livify.js" defer></script>
        <script type="module" src="/_internal/mermaid.js" defer></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Hello world!</title>
    </head>
    <body>
        <div class="content">
            ${markdownImp.parse(content)}
        </div>
    </body>
</html>
`;
fs.writeFileSync(path.join(__dirname, "../examples/index.html"), htmlElement);
