/*
Language: Magik
Description: Magik is an object-oriented programming language that supports multiple inheritance and polymorphism, and it is dynamically typed.
Author: Sebastiaan Speck <sebastiaanspeck@github.com>
Category: enterprise // FIXME: Is this the correct category?
*/

import { type HLJSApi } from "highlight.js"

export function magik(hljs: HLJSApi) {
    const VARIABLES = [
        "_dynamic",
        "_global",
        "_import",
        "_local",
        "_constant",
        "_class",
    ]

    const METHOD = ["_abstract", "_private", "_iter", "_method", "_endmethod"]

    const PROCEDURE = ["_proc", "_endproc"]

    const BLOCK = ["_block", "_endblock"]

    const IF = ["_if", "_then", "_elif", "_else", "_endif"]

    const LOOP = [
        "_loop",
        "_for",
        "_over",
        "_while",
        "_finally",
        "_loopbody",
        "_leave",
        "_continue",
        "_endloop",
    ]

    const HANDLING = ["_handling", "_default"]

    const CATCH = ["_catch", "_endcatch"]

    const THROW = ["_throw"]

    const PRIMITIVE = ["_primitive"]

    const TRY = ["_try", "_when", "_endtry"]

    const PROTECT = ["_protect", "_locking", "_protection", "_endprotect"]

    const LOCK = ["_lock", "_endlock"]

    const KLEENEAN = ["_true", "_false", "_maybe"]

    const UNSET = ["_unset"]

    const BUILT_INS = ["_package", "_thisthread"]

    const SPECIAL_KEYWORDS = ["_self", "_super", "_clone"]

    const ARGUMENTS = ["_gather", "_scatter", "_allresults", "_optional"]

    const KEYWORDS = {
        keyword: [
            ...VARIABLES,
            ...METHOD,
            ...PROCEDURE,
            ...BLOCK,
            ...IF,
            ...LOOP,
            ...HANDLING,
            ...CATCH,
            ...THROW,
            ...PRIMITIVE,
            ...TRY,
            ...PROTECT,
            ...LOCK,
            "_with", // standalone since _finally, _handling, _throw, _try, _leave and _continue all can have this
        ],
        literal: [...KLEENEAN, ...UNSET],
        built_in: BUILT_INS,
        "variable.language": SPECIAL_KEYWORDS,
        "title.function.invoke": ["def_slotted_exemplar"],
        meta: ARGUMENTS,
    }

    const DOCUMENTATION = {
        scope: "doctag",
        begin: "##",
        end: "$",
    }

    const COMMENT = {
        scope: "comment",
        begin: "#",
        end: "$",
    }

    const SYMBOL = {
        scope: "symbol",
        begin: /:(\|[^|]*\||[\w?!_])+/,
    }

    const PRAGMA = {
        scope: "property",
        begin: "_pragma",
        end: "$",
    }

    const ASSIGNMENT = {
        scope: "operator",
        variants: [
            { begin: /<</ },
            { begin: /\^<</ },
            { begin: /_and<</ },
            { begin: /_andif<</ },
            { begin: /_or<</ },
            { begin: /_orif<</ },
            { begin: /_xor<</ },
            { begin: /\*\*<</ },
            { begin: /\*\*\^<</ },
            { begin: /\*<</ },
            { begin: /\*?\^<</ },
            { begin: /\/<</ },
            { begin: /\/\^<</ },
            { begin: /_mod<</ },
            { begin: /_div<</ },
            { begin: /-\^?<</ },
            { begin: /\+<</ },
            { begin: /\+\^<</ },
        ],
    }

    const RETURN = {
        scope: "operator",
        variants: [{ begin: />>/ }, { begin: "_return" }],
    }

    const LABEL = {
        scope: "meta",
        begin: /@\s?(\|[A-Za-z0-9_?.!]*\||[A-Za-z0-9_?!]+)+/,
    }

    const NUMBER = {
        scope: "number",
        variants: [
            { begin: "\\b\\d+(\\.\\d+)?([eE&][+-]?\\d+)?\\b" }, // Decimal and floats with optional exponent
            { begin: "\\b(?:[2-9]|[1-2]\\d|3[0-6])[rR][a-zA-Z0-9]+\\b" }, // Radix notation (e.g., 16r1F)
        ],
        relevance: 0,
    }

    const CLASS = {
        match: [/\b_class/, /\s+/, /\|[a-zA-Z0-9._]+\|/],
        scope: {
            1: "keyword",
            3: "title.class",
        },
    }

    const DYNAMIC_VARIABLE = {
        scope: "variable",
        variants: [
            { begin: /![A-Za-z][A-Za-z0-9_?!]*!/ },
            { begin: /\|![A-Za-z0-9_?!]+!\|/ },
            { begin: /\|![A-Za-z0-9_?!]+\|!/ },
            { begin: /!\|[A-Za-z0-9_?!]+\|!/ },
            {
                begin: /(\|[A-Za-z]?[A-Za-z0-9_?!]*\||[A-Za-z][A-Za-z0-9_?!]*):![A-Za-z][A-Za-z0-9_?!]*!/,
            },
            { begin: /!\|\|!/ },
        ],
    }

    const GLOBAL_VARIABLE = {
        scope: "variable",
        begin: /[a-zA-Z_][a-zA-Z0-9_]*:[a-zA-Z_][a-zA-Z0-9_]*/,
    }

    const GLOBAL_REFERENCE = {
        scope: "variable",
        begin: /@(?:[a-zA-Z_][a-zA-Z0-9_]*:)?[a-zA-Z_][a-zA-Z0-9_]*/,
    }

    const METHOD_DECLARATION = {
        match: [
            /(?:_abstract\s+)?/,
            /(?:_private\s+)?/,
            /(?:_iter\s+)?/,
            /_method/,
            /\s+/,
            /(\|[a-zA-Z_][a-zA-Z0-9_]*\|)|([a-zA-Z_][a-zA-Z0-9_]*)/,
            /\./,
            /(\|[a-zA-Z_][a-zA-Z0-9_]*\|)|([a-zA-Z_][a-zA-Z0-9_]*)/,
        ],
        scope: {
            4: "keyword",
            6: "title.class",
            7: "punctuation",
            8: "title.function",
        },
    }

    const CHARACTER = {
        scope: "symbol",
        begin: /%([a-zA-Z][a-zA-Z0-9_?!]*|.| )/,
    }

    const REGEX = {
        scope: "regexp",
        variants: [
            { begin: /\/(?!\/)(?:\\.|[^\\\/\n])+\/[qisdlmuCX]*/ },
            { begin: /\/\// },
        ],
        relevance: 0,
    }

    const RELATIONAL_OPERATOR = {
        scope: "operator",
        variants: [
            { begin: "_is" },
            { begin: "_isnt" },
            { begin: "_cf" },
            { begin: "=" },
            { begin: "~=" },
            { begin: "<>" },
            { begin: ">=" },
            { begin: "<=" },
            { begin: "<" },
            { begin: ">" },
        ],
    }

    const LOGICAL_OPERATOR = {
        scope: "operator",
        variants: [
            { begin: "_and" },
            { begin: "_or" },
            { begin: "_xor" },
            { begin: "_andif" },
            { begin: "_orif" },
        ],
    }

    const ARITHMETIC_OPERATOR = {
        scope: "operator",
        variants: [
            { begin: /\*\*/ },
            { begin: /\*/ },
            { begin: /\\/ },
            { begin: "_mod" },
            { begin: "_div" },
        ],
    }

    const UNARY_OPERATOR = {
        scope: "operator",
        variants: [
            { begin: /\+/ },
            { begin: /-/ },
            { begin: "_not" },
            { begin: /~/ },
        ],
    }

    const PUNCTUATION = {
        scope: "punctuation",
        begin: /[[\](){},;]/,
    }

    return {
        name: "Magik",
        aliases: ["magik"],
        case_insensitive: true,
        keywords: KEYWORDS,
        contains: [
            hljs.QUOTE_STRING_MODE, // For double-quoted strings
            hljs.APOS_STRING_MODE, // For single-quoted strings
            DOCUMENTATION,
            COMMENT,
            SYMBOL,
            PRAGMA,
            ASSIGNMENT,
            RETURN,
            LABEL,
            NUMBER,
            CLASS,
            DYNAMIC_VARIABLE,
            GLOBAL_VARIABLE,
            GLOBAL_REFERENCE,
            METHOD_DECLARATION,
            CHARACTER,
            REGEX,
            RELATIONAL_OPERATOR,
            LOGICAL_OPERATOR,
            ARITHMETIC_OPERATOR,
            UNARY_OPERATOR,
            PUNCTUATION,
        ],
    }
}
