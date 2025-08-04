/*
Language: bbcode
Author: Paul Reid <paul@reid-family.org>
Description: highlightjs language definition for bbcode files
Category: config
*/

import { type HLJSApi } from "highlight.js";

export function bbcode(_: HLJSApi) {
    return {
        case_insensitive: true,
        contains: [
            {
                className: 'name',
                begin: /\[[^=\s\]]*/
            },
            {
                className: 'name',
                begin: ']'
            },
            {
              className: 'attribute',
              begin: /(?<==)[^\]\s]*/
            },
            {
                className: 'attr',
                begin: /(?<=\[[^\]]* )[^\s=\]]*/
            },
            {
                className: 'string',
                begin: /[=;:8]'?\-?[\)\(3SPDO>@$|/]/
            },
            {
                className: 'string',
                begin: /:[\w]*:/
            }
        ]
    };
}
