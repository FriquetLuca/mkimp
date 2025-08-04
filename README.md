# MkImp

Write markdown like a programmer should be able to!

This is not standard markdown nor does it support extensions. If you need to implement extensions, either create an issue or a pull request. In case your feature won't be implemented for any reason, fork the project and enjoy.

## Installation

You can install the project with `npm`.

```bash
npm install mkimp
```

Once it's installed, just import it in your project and use it:

```ts
import { MkImp } from "mkimp";

const mkimp = new MkImp({
    include(loc, from, to) {
        return `${loc} from [${from}] to [${to}]`;
    },
    includeCode(loc, from, to) {
        return `${loc} from [${from}] to [${to}]`;
    },
});
console.log(mkimp.parse("# Hello\n\nThis *is* some __nice__ markdown!"));
```

Here's all the options available for the parser:

```ts
interface MkImpOptions {
    // Your tabulation spaces (default to 4)
    tabulation?: number
    // metadata to use, frontmatter ones will be injected in the object in the tokenizer.
    // If a data already exist, it won't be overridden.
    metadata?: Map<string, string>
    // A list of all your emojis to use.
    // The key will be the name used for your emoji.
    emojis?: Record<string, EmojiRecord>
    // Use anything you want to parse your front matter. (default to JSON)
    frontMatter?: (content: string) => unknown
    // Handler for INCLUDE block, if unspecified the INCLUDE won't be parsed.
    include?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => string
    // Handler for INCLUDECODE block, if unspecified the INCLUDECODE won't be parsed.
    includeCode?: (
        location: string,
        from: number | undefined,
        to: number | undefined
    ) => string | undefined
    // Specify if the heading should be groupped by section with their own content. (default to false)
    withSection?: boolean
    // Specify the render target for the renderer. (default to raw)
    renderTarget?: RenderTarget
}

// The render target decide how some elements should be handled in the rendering.
// - article: Return the markdown wrapped inside an article tag.
// - raw: Return the raw markdown. (default to raw)
type RenderTarget = "raw" | "article"

// This is how an emoji record looks like
type EmojiRecord =
    | { type: "char"; char: string }
    | {
          type: "img"
          url: string
          alt?: string
          width?: number
          height?: number
      }
    | { type: "i"; className: string }

// Declaration of MkImp.
class MkImp {
    constructor(options: MkImpOptions = {});
    // Generate the AST for the markdown, all into a RootToken.
    ast(markdown: string): RootToken;
    // Render the RootToken into HTML.
    render(root: RootToken): string;
    // Parse markdown directly into HTML.
    parse(markdown: string): string;
}
```

## Syntax

Like it has been stated, this is not standard markdown so here's a full list of what you can do:

### Block rules



### Inline rules

| Rule | Description |
| :--- | ----------- |
| "\n" | When using a new line in a paragraph, it will be converted into a `<br/>` tag. |
| {{var_name}} | Variable names to access metadata are to be put inside double curly brackets. This can only be used as text. |
| \`text\` | Codespan works the same way as classic markdown. |
| !\[alt text](/link/to/img.png "optional title") | Image works the same way as classic markdown. |
| !YOUTUBE\[title]\{attributes\} | Import an embeded youtube link using this rule. The `vid` attribute is required, and the optional attributes are: `width`, `height`, `start` and `allowfullscreen` Example: !YOUTUBE[A title for the video]{vid="M66U_DuMCS8" width="280" height="157" start="60" allowfullscreen="false"} |
| \[some title](/link/to/whatever "optinal title") | Link work the same way as classic markdown. |
| \[^ref] | Footnote labels to link to a footnote description work the same way as extended markdown. |
| \[text][ref] | Reference link work the same way as classic markdown. |
| \$formula\$ | An inline LaTeX formula to write without display mode. |
| \$\$formula\$\$ | An inline LaTeX formula to write with display mode. |
| \<www.hello.com\> | Turn directly the content into a link. |
| \<div\> | Allow inline HTML tags; it is possible to write markdown between two HTML tags when classic markdown doesn't allow it. |
| \|\|spoiler content\|\| | Hide some content until you click on it. |
| >!spoiler content!< | Hide some content until you click on it. |
| \:joy\: | Add emojis into your markdown content or special characters if you prefere to. |
| \=\=text\=\= | Highlight your text. |
| \~\~text\~\~ | Strikethrough your text. |
| \^\^text\^\^ | Overline your text. |
| \_\_text\_\_ | Underline your text with 2 `_`. |
| \*text\* | Make your text italic. |
| \*\*text\*\* | Make your text bold. |
| \*\*\*text\*\*\* | Make your text bold and italic. |
| \_text\_ | Make your text italic with 1 `_`. |
| \_\_\_text\_\_\_ | Make your text underlined and italic with 3 `_`. |
