import { type HLJSApi } from "highlight.js"

/*
Language: Odin
Author: Ginger Bill <bill@gingerbill.org>
Description: Odin is a general-purpose programming language with distinct typing built for high performance, modern systems and data-oriented programming.
Website: https://odin-lang.org/
Category: common
*/
export function odin(hljs: HLJSApi) {
    const TYPES = [
        "bool",
        "b8",
        "b16",
        "b32",
        "b64",
        "int",
        "i8",
        "i16",
        "i32",
        "i64",
        "i128",
        "uint",
        "u8",
        "u16",
        "u32",
        "u64",
        "u128",

        "i16le",
        "i32le",
        "i64le",
        "i128le",
        "u16le",
        "u32le",
        "u64le",
        "u128le",
        "i16be",
        "i32be",
        "i64be",
        "i128be",
        "u16be",
        "u32be",
        "u64be",
        "u128be",

        "f16",
        "f32",
        "f64",
        "f16le",
        "f32le",
        "f64le",
        "f16be",
        "f32be",
        "f64be",

        "complex32",
        "complex64",
        "complex128",

        "quaternion64",
        "quaternion128",
        "quaternion256",

        "rune",
        "string",
        "cstring",

        "rawptr",
        "uintptr",
        "typeid",
        "any",
    ]

    const KEYWORDS = [
        "allocate",
        "auto_cast",
        "bit_field",
        "bit_set",
        "break",
        "case",
        "cast",
        "context",
        "continue",
        "defer",
        "delete",
        "distinct",
        "do",
        "dynamic",
        "else",
        "enum",
        "fallthrough",
        "for",
        "foreign",
        "free",
        "if",
        "import",
        "in",
        "map",
        "matrix",
        "new",
        "not_in",
        "or_else",
        "or_return",
        "package",
        "proc",
        "return",
        "struct",
        "switch",
        "typeid",
        "union",
        "using",
        "when",
        "where",
    ]

    const BUILT_IN = [
        "abs",
        "align_of",
        "cap",
        "clamp",
        "complex",
        "conj",
        "expand_to_tuple",
        "imag",
        "jmag",
        "kmag",
        "len",
        "max",
        "make",
        "make_slice",
        "min",
        "offset_of",
        "quaternion",
        "real",
        "size_of",
        "soa_unzip",
        "soa_zip",
        "swizzle",
        "transmute",
        "type_info_of",
        "type_of",
        "typeid_of",
    ]

    const NUMBER_CONTENT = {
        className: "number",
        variants: [hljs.C_NUMBER_MODE],
    }

    const DYNAMIC_KEYWORD_CONTENT = {
        className: "keyword",
        begin: /\bdynamic\b/,
        relevance: 0,
    }

    const CARET_AND_AMPERSAND_CONTENT = {
        className: "meta",
        begin: /[\^&]/,
        relevance: 0,
    }

    const RETURN_TYPE_CONTAINS = [
        {
            className: "type",
            begin: /(?:(?<=\^)|(?<=->\s?|]\s*))[A-Za-z_][A-Za-z0-9_.]*/,
        },
        NUMBER_CONTENT,
        DYNAMIC_KEYWORD_CONTENT,
        CARET_AND_AMPERSAND_CONTENT,
    ]

    const STRUCT_AND_PARAM_TYPE_CONTAINS = [
        {
            className: "type",
            begin: /(?:(?<=\^)|(?<=:\s?|]\s*))[A-Za-z_][A-Za-z0-9_.]*/,
        },
        NUMBER_CONTENT,
        DYNAMIC_KEYWORD_CONTENT,
        CARET_AND_AMPERSAND_CONTENT,
    ]

    return {
        name: "Odin",
        case_sensitive: true,
        aliases: ["odin", "odinlang", "odin-lang", "language-odin"],
        keywords: {
            keyword: KEYWORDS,
            type: TYPES,
            literal: "true false nil",
            built_in: BUILT_IN,
        },
        illegal: "</",
        contains: [
            CARET_AND_AMPERSAND_CONTENT,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            {
                className: "string",
                variants: [
                    hljs.QUOTE_STRING_MODE,
                    {
                        begin: "'",
                        end: "[^\\\\]'",
                    },
                    {
                        begin: "`",
                        end: "`",
                    },
                ],
            },
            {
                className: "number",
                variants: [
                    {
                        begin: hljs.C_NUMBER_RE + "[ijk]",
                        relevance: 1,
                    },
                    hljs.C_NUMBER_MODE,
                ],
            },
            {
                className: "function", // function declaration
                begin: /\b([A-Za-z_][A-Za-z0-9_]*)\s*::\s*proc\b/,
                end: /[{\n]/,
                returnBegin: true,
                contains: [
                    {
                        className: "title",
                        begin: /\b[A-Za-z_][A-Za-z0-9_]*(?=\s*::\s*proc\b)/,
                        relevance: 0,
                    },
                    {
                        className: "keyword",
                        begin: /\bproc\b/,
                        relevance: 0,
                    },
                    {
                        className: "params",
                        begin: /\(/,
                        end: /\)/,
                        illegal: /["']/,
                        contains: STRUCT_AND_PARAM_TYPE_CONTAINS,
                    },
                    {
                        // return type
                        begin: /->/,
                        end: /\{/,
                        returnBegin: true,
                        contains: RETURN_TYPE_CONTAINS,
                        relevance: 0,
                    },
                ],
            },
            {
                className: "built_in", // function call
                begin: /\b(?!proc\b)([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()/,
                excludeEnd: true,
            },
            {
                className: "struct",
                begin: /\b([A-Za-z_][A-Za-z0-9_]*)\s*::\s*struct\b/,
                end: /[}]/,
                returnBegin: true,
                contains: [
                    {
                        className: "title",
                        begin: /\b[A-Za-z_][A-Za-z0-9_]*(?=\s*::\s*struct\b)/,
                        relevance: 0,
                    },
                    {
                        className: "keyword",
                        begin: /\bstruct\b/,
                        relevance: 0,
                    },
                    {
                        begin: /(?<=:\s*)[\[^A-Za-z_][A-Za-z0-9_.\]^[]*/,
                        end: /\n/,
                        returnBegin: true,
                        contains: STRUCT_AND_PARAM_TYPE_CONTAINS,
                        relevance: 0,
                    },
                ],
            },
        ],
    }
}
