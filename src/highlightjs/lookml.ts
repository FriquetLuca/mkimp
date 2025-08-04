/*
Language: LookML
Author: Josh Temple <josh@spectacles.dev>
Description: Language definition for LookML (Looker's dependency language).
*/

import { type HLJSApi } from "highlight.js"

export function lookml(hljs: HLJSApi) {
    const LITERALS = ["yes", "no"]
    const KEY_MODE = { scope: "keyword", match: /\w+\s*:/, relevance: 0 }
    const LIQUID_MODE = {
        scope: "template-tag",
        variants: [
            { begin: /\{%/, end: /%\}/ },
            { begin: /\{{2}/, end: /\}{2}/ },
        ],
    }
    const BLOCK_MODE = {
        scope: "block",
        begin: [/\w+\s*:\s*/, /\+?/, /(\w+\s*)?/, /\{(?![%\{])/],
        beginScope: {
            1: "keyword",
            2: "operator",
            3: "title",
            4: "punctuation",
        },
        end: /\}(?![%\}])/,
        endScope: "punctuation",
        keywords: { literal: LITERALS },
        contains: [
            hljs.QUOTE_STRING_MODE,
            hljs.HASH_COMMENT_MODE,
            "self",
            {
                // SQL expression block
                begin: /sql\w*\s*:/,
                beginScope: "keyword",
                end: /;;/,
                endScope: "punctuation",
                contains: [
                    hljs.QUOTE_STRING_MODE,
                    {
                        scope: "variable",
                        begin: /\$\{/,
                        end: /\}/,
                        relevance: 10,
                    },
                    LIQUID_MODE,
                ],
            },
            KEY_MODE,
        ],
    }
    return {
        name: "LookML",
        contains: [
            hljs.HASH_COMMENT_MODE,
            hljs.QUOTE_STRING_MODE,
            BLOCK_MODE,
            KEY_MODE,
            LIQUID_MODE,
        ],
    }
}
