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
```