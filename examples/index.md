# Markdown in a nutshell

## Index

- [Markdown structure](#structure)
    - [Block](#block)
    - [Inline](#inline)
- [Syntax](#syntax)
    - [Heading](#heading)
    - [Paragraphs](#paragraphs)
    - [Emphasis](#emphasis)
        - [Bold](#bold)
        - [Italic](#italic)
        - [Bold And Italic](#bold_and_italic)
        - [Strikethrough](#strikethrough)
        - [Highlight](#highlight)
        - [Underline](#underline)
        - [Overline](#overline)
    - [Blockquote](#blockquote)
    - [List](#list)
        - [Ordered List](#ordered_list)
        - [Unordered List](#unordered_list)
        - [Adding Elements in Lists](#adding_elements_lists)
    - [Code](#code)
    - [Horizontal Rule](#horizontal_rule)
    - [Link](#link)
        - [IDs](#link_ids)
        - [Titles](#link_titles)
        - [Reference-style Links](#link_refstyle)
        - [Best Practices](#link_best_practices)
    - [Automatic URL Linking](#automatic_url_linking)
    - [Image](#image)
    - [Escaping Characters](#escaping_characters)
    - [HTML](#md_html)
    - [Spoiler](#spoiler)
    - [Table](#table)
        - [Alignment](#table_align)
    - [Fenced Code Block](#fenced_code_block)
    - [Footnote](#footnote)
    - [Definition List](#definition_list)
    - [Task List](#task_list)
    - [Emoji](#emoji)
    - [Youtube](#youtube)
    - [Math](#math)
    - [Diagrams](#diagrams)
    - [Include](#include)
    - [Include Code](#includecode)
    - [Metadata](#metadata)

## Markdown structure

A Markdown document is organized using a combination of block-level and inline elements to create a clear, readable structure. At its core, it typically includes:

- Headings to define sections (e.g., `#`, `##`, `###`)

- Paragraphs for body text

- Lists (ordered and unordered) for grouping items

- Code blocks for displaying code or commands

- Blockquotes for quoting text

- Inline elements like bold, italic, links, and inline code for emphasis and formatting within text

This structure allows writers to create clean, easy-to-read documents that can be rendered as formatted HTML for web use.

### Block {#block}

A block is a distinct section of content that stands on its own, typically separated by one or more blank lines. In Markdown, blocks are used to structure content and include elements such as paragraphs, headers, blockquotes, lists, code blocks, and more. Each block begins on a new line and often follows specific syntax rules to define its type and appearance.

### Inline {#inline}

Inline refers to content that appears within a line of text, without breaking the flow into a new block. In Markdown, inline elements include formatting like **bold**, *italic*, `code`, [links](#links), and images, all used within a paragraph or sentence. These elements are rendered alongside regular text and do not create standalone sections.

## Syntax {#syntax}

### Heading {#heading}

To create a heading, add number signs (#) in front of a word or phrase. The number of number signs you use should correspond to the heading level. Markdown applications don't agree on how to handle a missing space between the number signs (#) and the heading name. For compatibility, always put a space between the number signs and the heading name and also put blank lines before and after a heading.

`# Heading level 1`
# Heading level 1
`## Heading level 2`
## Heading level 2
`### Heading level 3`
### Heading level 3
`#### Heading level 4`
#### Heading level 4
`##### Heading level 5`
##### Heading level 5
`###### Heading level 6`
###### Heading level 6

In `HTML`, the heading level correspond to `X` in `<hX></hX>` meaning that a level 2 heading is `<h2></h2>` in HTML.
There's also an alternative syntax for heading that could be used with 2 levels:

```
Heading level 1
===============
```

Heading level 1
===============

```
Heading level 2
---------------
```

Heading level 2
---------------

All headings in HTML have a `md-heading` class attached to it to make it easier to design specificaly your markdown.

In case of `LaTeX` rendering, each level is defined as:

1. \\begin{titlepage}\\begin{center}\\vspace*{8cm}{\\LARGE \\textbf{${text}}}\\vspace*{12cm}\\end{center}\\end{titlepage}
2. \\part*
3. \\chapter*
4. \\section*
5. \\subsection*
6. \\subsubsection*

Note: The alternative heading level 1 and 2 correspond exactly to level 1 and 2 in as showed above in `LaTeX`.

Many Markdown processors support custom IDs for headings — some Markdown processors automatically add them. Adding custom IDs allows you to link directly to headings and modify them with CSS. To add a custom heading ID, enclose the custom ID in curly braces on the same line as the heading.

`### My Great Heading {#custom-id}`

### My Great Heading {#custom-id}


### Paragraphs {#paragraphs}

To create paragraphs, use a blank line to separate one or more lines of text.

Example:
```
I really like using Markdown.

I think I'll use it to format all of my documents from now on.
```

Unless the paragraph is in a list, don’t indent paragraphs with spaces or tabs.

Example:
```
    This can result in unexpected formatting problems.

  Don't add tabs or spaces in front of paragraphs. 
```

You can use two or more spaces (commonly referred to as "trailing whitespace") for line breaks in nearly every Markdown application, but it’s controversial. It’s hard to see trailing whitespace in an editor, and many people accidentally or intentionally put two spaces after every sentence. For this reason, you may want to use something other than trailing whitespace for line breaks. If your Markdown application supports HTML, you can use the `<br>` HTML tag.

There are two other options I don’t recommend using. CommonMark and a few other lightweight markup languages let you type a backslash (\\) at the end of the line, but not all Markdown applications support this, so it isn’t a great option from a compatibility perspective. And at least a couple lightweight markup languages don’t require anything at the end of the line — just type return and they’ll create a line break.


### Emphasis {#emphasis}

You can add emphasis by making text bold, italic, underlined, overlined, strikethrough or even highlighted.

#### Bold {#bold}

To bold text, add two asterisks or underscores before and after a word or phrase. To bold the middle of a word for emphasis, add two asterisks without spaces around the letters.

`I just love **bold text**.`
I just love **bold text**.

`I just love __bold text__.`
I just love __bold text__.

`Love**is**bold`
Love**is**bold

Markdown applications don’t agree on how to handle underscores in the middle of a word. For compatibility, use asterisks to bold the middle of a word for emphasis.

Do this: `Love**is**bold`

Don't do this: `Love__is__bold`

#### Italic {#italic}

To italicize text, add one asterisk or underscore before and after a word or phrase. To italicize the middle of a word for emphasis, add one asterisk without spaces around the letters.

`Italicized text is the *cat's meow*.`
Italicized text is the *cat's meow*.

`Italicized text is the _cat's meow_.`
Italicized text is the _cat's meow_.

`A*cat*meow`
A*cat*meow

Markdown applications don’t agree on how to handle underscores in the middle of a word. For compatibility, use asterisks to italicize the middle of a word for emphasis.

Do this: `A*cat*meow`
Don't do this: `A_cat_meow`

#### Bold And Italic {#bold_and_italic}

To emphasize text with bold and italics at the same time, add three asterisks or underscores before and after a word or phrase. To bold and italicize the middle of a word for emphasis, add three asterisks without spaces around the letters.

`This text is ***really important***.`
This text is ***really important***.

`This text is ___really important___.`
This text is ___really important___.

`This text is __*really important*__.`
This text is __*really important*__.

`This text is **_really important_**.`
This text is **_really important_**.

`This is really***very***important text.`
This is really***very***important text.

Note: The order of the em and strong tags might be reversed depending on the Markdown processor you're using.

Markdown applications don’t agree on how to handle underscores in the middle of a word. For compatibility, use asterisks to bold and italicize the middle of a word for emphasis.

Do this: `This is really***very***important text.`
Don't do this: `This is really___very___important text.`

#### Strikethrough {#strikethrough}

You can strikethrough words by putting a horizontal line through the center of them. This feature allows you to indicate that certain words are a mistake not meant for inclusion in the document. To strikethrough words, use two tilde symbols (~~) before and after the words.

`~~The world is flat.~~ We now know that the world is round.`
~~The world is flat.~~ We now know that the world is round.

This is an extended syntax for markdown and not all Markdown applications support extended syntax elements. You’ll need to check whether or not the lightweight markup language your application is using supports the extended syntax elements you want to use. If it doesn’t, it may still be possible to enable extensions in your Markdown processor.

#### Highlight {#highlight}

This isn’t common, but some Markdown processors allow you to highlight text. To highlight words, use two equal signs (==) before and after the words.

`I need to highlight these ==very important words==.`
I need to highlight these ==very important words==.

This is an extended syntax for markdown and not all Markdown applications support extended syntax elements. You’ll need to check whether or not the lightweight markup language your application is using supports the extended syntax elements you want to use. If it doesn’t, it may still be possible to enable extensions in your Markdown processor.

#### Underline {#underline}

To underline text, add two underscores before the letter u and open the parentheses then to close it, use a closing parentheses and two underscores.

`We want to __u(underline)__ text.`
We want to __u(underline)__ text.

Markdown applications generaly doesn't implement underline for text, use the HTML tag `<ins>` to underline. For compatibility, use `<ins>Your text</ins>` even if this means you'll have to write down your own HTML for emphasis.

#### Overline {#overline}

To overline text, add two carets before the letter o and open the parentheses then to close it, use a closing parentheses and two carets.

`We want to ^^o(overline)^^ text.`
We want to ^^o(underline)^^ text.

Markdown applications generaly doesn't implement overline for text, and there is no HTML tag for it. You could use CSS to achieve it but for compatibility, there's the possibility to write down `<span style="text-decoration: overline;">Overlined Text</span>`.

### Blockquote {#blockquote}

To create a blockquote, add a > in front of a paragraph.

`> Dorothy followed her through many of the beautiful rooms in her castle.`
> Dorothy followed her through many of the beautiful rooms in her castle.

Blockquotes can contain multiple paragraphs. Add a > on the blank lines between the paragraphs.

```
> Dorothy followed her through many of the beautiful rooms in her castle.
>
> The Witch bade her clean the pots and kettles and sweep the floor and keep the fire fed with wood.
```

> Dorothy followed her through many of the beautiful rooms in her castle.
>
> The Witch bade her clean the pots and kettles and sweep the floor and keep the fire fed with wood.

Blockquotes can be nested. Add a >> in front of the paragraph you want to nest.

```
> Dorothy followed her through many of the beautiful rooms in her castle.
>
>> The Witch bade her clean the pots and kettles and sweep the floor and keep the fire fed with wood.
```

> Dorothy followed her through many of the beautiful rooms in her castle.
>
>> The Witch bade her clean the pots and kettles and sweep the floor and keep the fire fed with wood.

Blockquotes can contain other Markdown formatted elements. Not all elements can be used — you’ll need to experiment to see which ones work.

```
> #### The quarterly results look great!
>
> - Revenue was off the chart.
> - Profits were higher than ever.
>
>  *Everything* is going according to **plan**.
```

> #### The quarterly results look great!
>
> - Revenue was off the chart.
> - Profits were higher than ever.
>
>  *Everything* is going according to **plan**.

For compatibility, put blank lines before and after blockquotes.

Do this:

```
Try to put a blank line before...

> This is a blockquote

...and after a blockquote. 
```

Don't do this:

```
Without blank lines, this might not look right.
> This is a blockquote
Don't do this! 
```

### List {#list}

You can organize items into ordered and unordered lists.

#### Ordered List {#ordered_list}

To create an ordered list, add line items with numbers followed by periods. The numbers don’t have to be in numerical order, but the list should start with the number one.

```
1. First item
2. Second item
3. Third item
4. Fourth item 
```

1. First item
2. Second item
3. Third item
4. Fourth item

```
1. First item
1. Second item
1. Third item
1. Fourth item 
```

1. First item
1. Second item
1. Third item
1. Fourth item 

```
1. First item
8. Second item
3. Third item
5. Fourth item 
```

1. First item
8. Second item
3. Third item
5. Fourth item 

```
1. First item
2. Second item
3. Third item
    1. Indented item
    2. Indented item
4. Fourth item 
```

1. First item
2. Second item
3. Third item
    1. Indented item
    2. Indented item
4. Fourth item

CommonMark and a few other lightweight markup languages let you use a parenthesis `)` as a delimiter (e.g., 1) First item), but not all Markdown applications support this, so it isn’t a great option from a compatibility perspective. For compatibility, use periods only.

Do this:

```
1. First item
2. Second item 
```

Don't do this:

```
1) First item
2) Second item 
```

#### Unordered List {#unordered_list}

To create an unordered list, add dashes (-), asterisks (*), or plus signs (+) in front of line items. Indent one or more items to create a nested list.

```
- First item
- Second item
- Third item
- Fourth item
```

- First item
- Second item
- Third item
- Fourth item

```
* First item
* Second item
* Third item
* Fourth item 
```

* First item
* Second item
* Third item
* Fourth item 

```
+ First item
+ Second item
+ Third item
+ Fourth item
```

+ First item
+ Second item
+ Third item
+ Fourth item

```
- First item
- Second item
- Third item
    - Indented item
    - Indented item
- Fourth item 
```

- First item
- Second item
- Third item
    - Indented item
    - Indented item
- Fourth item 

If you need to start an unordered list item with a number followed by a period, you can use a backslash `\` to escape the period.

```
- 1968\. A great year!
- I think 1969 was second best. 
```

- 1968\. A great year!
- I think 1969 was second best. 

Markdown applications don’t agree on how to handle different delimiters in the same list. For compatibility, don’t mix and match delimiters in the same list — pick one and stick with it.


Do this:

```
- First item
- Second item
- Third item
- Fourth item 
```

Don't do this:

```
+ First item
* Second item
- Third item
+ Fourth item 
```

#### Adding Elements in Lists {#adding_elements_lists}

To add another element in a list while preserving the continuity of the list, indent the element four spaces or one tab, as shown in the following examples.

```
* This is the first list item.
* Here's the second list item.

    I need to add another paragraph below the second list item.

* And here's the third list item.
```

* This is the first list item.
* Here's the second list item.

    I need to add another paragraph below the second list item.

* And here's the third list item.

```
* This is the first list item.
* Here's the second list item.

    > A blockquote would look great below the second list item.

* And here's the third list item.
```

* This is the first list item.
* Here's the second list item.

    > A blockquote would look great below the second list item.

* And here's the third list item.

Code blocks are normally indented four spaces or one tab. When they’re in a list, indent them eight spaces or two tabs.

```
1. Open the file.
2. Find the following code block on line 21:

        <html>
          <head>
            <title>Test</title>
          </head>

3. Update the title to match the name of your website.
```

1. Open the file.
2. Find the following code block on line 21:

        <html>
          <head>
            <title>Test</title>
          </head>

3. Update the title to match the name of your website.

For image, you can do:

```
1. Open the file containing the Linux mascot.
2. Marvel at its beauty.

    ![Tux, the Linux mascot](https://mdg.imgix.net/assets/images/tux.png)

3. Close the file.
```

1. Open the file containing the Linux mascot.
2. Marvel at its beauty.

    ![Tux, the Linux mascot](https://mdg.imgix.net/assets/images/tux.png)

3. Close the file.

You can nest an unordered list in an ordered list, or vice versa.

```
1. First item
2. Second item
3. Third item
    - Indented item
    - Indented item
4. Fourth item
```

1. First item
2. Second item
3. Third item
    - Indented item
    - Indented item
4. Fourth item

### Code {#code}

To denote a word or phrase as code, enclose it in backticks (`).

```
At the command prompt, type `nano`.
```

At the command prompt, type `nano`.

If the word or phrase you want to denote as code includes one or more backticks, you can escape it by enclosing the word or phrase in double backticks (``).

```
``Use `code` in your Markdown file.``
```

``Use `code` in your Markdown file.``

To create code blocks, indent every line of the block by at least four spaces or one tab.

```
    <html>
      <head>
      </head>
    </html>
```

    <html>
      <head>
      </head>
    </html>


Note: To create code blocks without indenting lines, use [fenced code blocks](#fenced_code_block).

### Horizontal Rule {#horizontal_rule}

To create a horizontal rule, use three or more asterisks (***), dashes (---), or underscores (___) on a line by themselves.

```
***

---

_________________
```

The rendered output of all three looks identical:

---

For compatibility, put blank lines before and after horizontal rules.

Do this:

```
Try to put a blank line before...

---

...and after a horizontal rule. 
```

Don't do this:

```
Without blank lines, this would be a heading.
---
Don't do this! 
```

### Link {#link}

To create a link, enclose the link text in brackets (e.g., [Duck Duck Go]) and then follow it immediately with the URL in parentheses (e.g., (https://duckduckgo.com)).

`My favorite search engine is [Duck Duck Go](https://duckduckgo.com).`

My favorite search engine is [Duck Duck Go](https://duckduckgo.com).

To quickly turn a URL or email address into a link, enclose it in angle brackets.

```
<https://www.markdownguide.org>
<fake@example.com>
```

<https://www.markdownguide.org>
<fake@example.com>

To emphasize links, add asterisks before and after the brackets and parentheses. To denote links as code, add backticks in the brackets.

```
I love supporting the **[EFF](https://eff.org)**.
This is the *[Markdown Guide](https://www.markdownguide.org)*.
See the section on [`code`](#code).
```

I love supporting the **[EFF](https://eff.org)**.
This is the *[Markdown Guide](https://www.markdownguide.org)*.
See the section on [`code`](#code).

#### IDs {#link_ids}

You can link to headings with custom IDs in the file by creating a standard link with a number sign (#) followed by the custom heading ID. These are commonly referred to as anchor links.

`[Heading IDs](#heading-ids)`

#### Titles {#link_titles}

You can optionally add a title for a link. This will appear as a tooltip when the user hovers over the link. To add a title, enclose it in quotation marks after the URL.

`My favorite search engine is [Duck Duck Go](https://duckduckgo.com "The best search engine for privacy").`

My favorite search engine is [Duck Duck Go](https://duckduckgo.com "The best search engine for privacy").

#### Reference-style Links {#link_refstyle}

Reference-style links are a special kind of link that make URLs easier to display and read in Markdown. Reference-style links are constructed in two parts: the part you keep inline with your text and the part you store somewhere else in the file to keep the text easy to read.

The first part of a reference-style link is formatted with two sets of brackets. The first set of brackets surrounds the text that should appear linked. The second set of brackets displays a label used to point to the link you’re storing elsewhere in your document.

Although not required, you can include a space between the first and second set of brackets. The label in the second set of brackets is not case sensitive and can include letters, numbers, spaces, or punctuation.

This means the following example formats are roughly equivalent for the first part of the link:

- `[hobbit-hole][1]`
- `[hobbit-hole] [1]`

The second part of a reference-style link is formatted with the following attributes:

1. The label, in brackets, followed immediately by a colon and at least one space (e.g., \[label\]: ).
1. The URL for the link, which you can optionally enclose in angle brackets.
1. The optional title for the link, which you can enclose in double quotes, single quotes, or parentheses.

This means the following example formats are all roughly equivalent for the second part of the link:

- `[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle`
- `[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle "Hobbit lifestyles"`
- `[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle 'Hobbit lifestyles'`
- `[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle (Hobbit lifestyles)`
- `[1]: <https://en.wikipedia.org/wiki/Hobbit#Lifestyle> "Hobbit lifestyles"`
- `[1]: <https://en.wikipedia.org/wiki/Hobbit#Lifestyle> 'Hobbit lifestyles'`
- `[1]: <https://en.wikipedia.org/wiki/Hobbit#Lifestyle> (Hobbit lifestyles)`

You can place this second part of the link anywhere in your Markdown document. Some people place them immediately after the paragraph in which they appear while other people place them at the end of the document (like endnotes or footnotes).

Say you add a URL as a standard URL link to a paragraph and it looks like this in Markdown:

```
In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends
of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to
eat: it was a [hobbit-hole](https://en.wikipedia.org/wiki/Hobbit#Lifestyle "Hobbit lifestyles"), and that means comfort.
```

Though it may point to interesting additional information, the URL as displayed really doesn’t add much to the existing raw text other than making it harder to read. To fix that, you could format the URL like this instead:

```
In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends
of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to
eat: it was a [hobbit-hole][1], and that means comfort.

[1]: <https://en.wikipedia.org/wiki/Hobbit#Lifestyle> "Hobbit lifestyles"
```

In both instances above, the rendered output would be identical:

In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends
of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to
eat: it was a [hobbit-hole][1], and that means comfort.

[1]: <https://en.wikipedia.org/wiki/Hobbit#Lifestyle> "Hobbit lifestyles"

#### Best Practices {#link_best_practices}

Markdown applications don’t agree on how to handle spaces in the middle of a URL. For compatibility, try to URL encode any spaces with %20. Alternatively, if your Markdown application supports HTML, you could use the a HTML tag.

Do this:

```
[link](https://www.example.com/my%20great%20page)

<a href="https://www.example.com/my great page">link</a>
```

Don't do this:

```
[link](https://www.example.com/my great page)
```

Parentheses in the middle of a URL can also be problematic. For compatibility, try to URL encode the opening parenthesis (() with %28 and the closing parenthesis ()) with %29. Alternatively, if your Markdown application supports HTML, you could use the a HTML tag.

Do this:

```
[a novel](https://en.wikipedia.org/wiki/The_Milagro_Beanfield_War_%28novel%29)

<a href="https://en.wikipedia.org/wiki/The_Milagro_Beanfield_War_(novel)">a novel</a>
```

Don't do this:

```
[a novel](https://en.wikipedia.org/wiki/The_Milagro_Beanfield_War_(novel))
```

### Automatic URL Linking {#automatic_url_linking}

Many Markdown processors automatically turn URLs into links. That means if you type `http://www.example.com`, your Markdown processor will automatically turn it into a link even though you haven’t used brackets.

```
http://www.example.com
```

The rendered output looks like this:
http://www.example.com

If you don’t want a URL to be automatically linked, you can remove the link by denoting the URL as code with backticks.

```
`http://www.example.com`
```

`http://www.example.com`

### Image {#image}

To add an image, add an exclamation mark (!), followed by alt text in brackets, and the path or URL to the image asset in parentheses. You can optionally add a title in quotation marks after the path or URL.

`![Tux, the Linux mascot](https://mdg.imgix.net/assets/images/tux.png)`
![Tux, the Linux mascot](https://mdg.imgix.net/assets/images/tux.png)

To add a link to an image, enclose the Markdown for the image in brackets, and then add the link in parentheses.

`[![Tux, the Linux mascot](https://mdg.imgix.net/assets/images/tux.png)](https://fr.wikipedia.org/wiki/Linux)`
[![Tux, the Linux mascot](https://mdg.imgix.net/assets/images/tux.png)](https://fr.wikipedia.org/wiki/Linux)

### Escaping Characters {#escaping_characters}

To display a literal character that would otherwise be used to format text in a Markdown document, add a backslash (\\) in front of the character.

`\* Without the backslash, this would be a bullet in an unordered list.`
\* Without the backslash, this would be a bullet in an unordered list.

You can use a backslash to escape the following characters.

|Character|Name|
|---|---|
| \\ | backslash |
|\`|backtick|
|\*|asterisk|
|\_|underscore|
|\{\}|curly braces|
|\[\]|brackets|
|\<\>|angle brackets|
|\(\)|parentheses|
|\#|pount sign|
|\+|plus sign|
|\-|minus sign \(hyphen\)|
|\.|dot|
|\!|exclamation mark|
|\||pipe|

### HTML {#md_html}

Many Markdown applications allow you to use HTML tags in Markdown-formatted text. This is helpful if you prefer certain HTML tags to Markdown syntax. For example, some people find it easier to use HTML tags for images. Using HTML is also helpful when you need to change the attributes of an element, like specifying the color of text or changing the width of an image.

To use HTML, place the tags in the text of your Markdown-formatted file.

`This **word** is bold. This <em>word</em> is italic.`
This **word** is bold. This <em>word</em> is italic.

For security reasons, not all Markdown applications support HTML in Markdown documents. When in doubt, check your Markdown application’s documentation. Some applications support only a subset of HTML tags.

Use blank lines to separate block-level HTML elements like \<div\>, \<table\>, \<pre\>, and \<p\> from the surrounding content. Try not to indent the tags with tabs or spaces — that can interfere with the formatting.

You can’t use Markdown syntax inside block-level HTML tags. For example, \<p\>italic and \*\*bold\*\*\</p\> won’t work.

### Spoiler {#spoiler}

Markdown usually doesn't support spoiler but some markdown does it. In Reddit and Discord, for example, you can use spoiler tags to hide content from the user to make sure it doesn't see it if the user doesn't want to see.
You can write spoiler using either:

`This >!word!< is hidden.`
This >!word!< is hidden.

`This ||word|| is hidden.`
This ||word|| is hidden.

The syntax could be extended with a spoiler block inspired from reddit. Be start the block with `!>` and end it with a `<!`. It will be displayed as an accordion with a title.

```
!> This is a spoiler
The content is in spoiler.
> SPOILING THE FUN OUT OF EVERYTHING!
<!
```

!> This is a spoiler
The content is in spoiler.
> SPOILING THE FUN OUT OF EVERYTHING!
<!

Be sure to let some space before and after the spoiler block so that it can be shown.

Do this:
```
This is a sentense.

!> This is a spoiler
The content is in spoiler.
> SPOILING THE FUN OUT OF EVERYTHING!
<!

This is another sentense.
```

Don't do this:
```
This is a sentense.
!> This is a spoiler
The content is in spoiler.
> SPOILING THE FUN OUT OF EVERYTHING!
<!
This is another sentense.
```

### Table {#table}

To add a table, use three or more hyphens (---) to create each column’s header, and use pipes (|) to separate each column. For compatibility, you should also add a pipe on either end of the row.

```
| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |
```

| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |

Cell widths can vary, as shown below. The rendered output will look the same.

```
| Syntax | Description |
| --- | ----------- |
| Header | Title |
| Paragraph | Text |
```

Tip: Creating tables with hyphens and pipes can be tedious. To speed up the process, try using the [Markdown Tables Generator](https://www.tablesgenerator.com/markdown_tables) or [AnyWayData Markdown Export](https://anywaydata.com/). Build a table using the graphical interface, and then copy the generated Markdown-formatted text into your file.

You can format the text within tables. For example, you can add links, code (words or phrases in backticks (`) only, not code blocks), and emphasis.

You can’t use headings, blockquotes, lists, horizontal rules, images, or most HTML tags.

Tip: You can use HTML to create line breaks and add lists within table cells.

You can display a pipe (|) character in a table by using its HTML character code (&#124;).

#### Alignment {#table_align}

You can align text in the columns to the left, right, or center by adding a colon (:) to the left, right, or on both side of the hyphens within the header row.

```
| Syntax      | Description | Test Text     |
| :---        |    :----:   |          ---: |
| Header      | Title       | Here's this   |
| Paragraph   | Text        | And more      |
```

| Syntax      | Description | Test Text     |
| :---        |    :----:   |          ---: |
| Header      | Title       | Here's this   |
| Paragraph   | Text        | And more      |

### Fenced Code Block {#fenced_code_block}

The basic Markdown syntax allows you to create code blocks by indenting lines by four spaces or one tab. If you find that inconvenient, try using fenced code blocks. Depending on your Markdown processor or editor, you’ll use three backticks (```) or three tildes (~~~) on the lines before and after the code block. The best part? You don’t have to indent any lines!

````
```
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
```
````

```
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
```

Tip: Need to display backticks inside a code block? Use four backticks (````).

Many Markdown processors support syntax highlighting for fenced code blocks. This feature allows you to add color highlighting for whatever language your code was written in. To add syntax highlighting, specify a language next to the backticks before the fenced code block.

````
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
```
````

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
```


### Footnote {#footnote}

Footnotes allow you to add notes and references without cluttering the body of the document. When you create a footnote, a superscript number with a link appears where you added the footnote reference. Readers can click the link to jump to the content of the footnote at the bottom of the page.

To create a footnote reference, add a caret and an identifier inside brackets (\[\^1]). Identifiers can be numbers or words, but they can’t contain spaces or tabs. Identifiers only correlate the footnote reference with the footnote itself — in the output, footnotes are numbered sequentially.

Add the footnote using another caret and number inside brackets with a colon and text (\[\^1\]\: My footnote.). You don’t have to put footnotes at the end of the document. You can put them anywhere except inside other elements like lists, block quotes, and tables.

```
Here's a simple footnote,[^foot] and here's a longer one.[^bignote]

[^foot]: This is the first footnote.

[^bignote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    `{ my code }`

    Add as many paragraphs as you like.
```

Here's a simple footnote,<sup><a class="md-link" href="#fn:foot">\[1\]</a></sup> and here's a longer one.<sup><a class="md-link" href="#fn:bignote">\[2\]</a></sup>

<section class="md-footnotes">
    <ol class="md-fnlist" dit="auto">
        <li id="fn:foot" class="md-fnitem">
            <p class="md-paragraph">
                This is the first footnote. <a class="md-revfn" href="#fnref:foot">↩</a>
            </p>
        </li>
        <li id="fn:bignote" class="md-fnitem">
            <p class="md-paragraph">Here's one with multiple paragraphs and code.</p>
            <p class="md-paragraph">Indent paragraphs to include them in the footnote.</p>
            <p class="md-paragraph">
                <code class="md-codespan">{ my code }</code>
            </p>
            <p class="md-paragraph">Add as many paragraphs as you like. <a class="md-revfn" href="#fnref:bignote">↩</a></p>
        </li>
    </ol>
</section>

### Definition List {#definition_list}

Some Markdown processors allow you to create definition lists of terms and their corresponding definitions. To create a definition list, type the term on the first line. On the next line, type a colon followed by a space and the definition.

```
First Term
: This is the definition of the first term.

Second Term
: This is one definition of the second term.
: This is another definition of the second term.
```

First Term
: This is the definition of the first term.

Second Term
: This is one definition of the second term.
: This is another definition of the second term.

### Task List {#task_list}

Task lists (also referred to as checklists and todo lists) allow you to create a list of items with checkboxes. In Markdown applications that support task lists, checkboxes will be displayed next to the content. To create a task list, add dashes (-) and brackets with a space ([ ]) in front of task list items. To select a checkbox, add an x in between the brackets ([x]).

```
- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media
```

- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media

### Emoji {#emoji}

There are two ways to add emoji to Markdown files: copy and paste the emoji into your Markdown-formatted text, or type emoji shortcodes.

In most cases, you can simply copy an emoji from a source like [Emojipedia](https://emojipedia.org/) and paste it into your document. Many Markdown applications will automatically display the emoji in the Markdown-formatted text. The HTML and PDF files you export from your Markdown application should display the emoji.

Some Markdown applications allow you to insert emoji by typing emoji shortcodes. These begin and end with a colon and include the name of an emoji.

```
Gone camping! :tent: Be back soon.

That is so funny! :joy:
```

Gone camping! :tent: Be back soon.

That is so funny! :joy:


The full list of emojis available is [HERE](https://github.com/ikatyang/emoji-cheat-sheet/tree/master).

### Youtube {#youtube}

Markdown usually doesn't have a native syntax to import video.
To add a youtube video in your page, you can use the following syntax:

```
!YOUTUBE[A title for the video]{vid="9xwazD5SyVg"}
```

!YOUTUBE[A title for the video]{vid="9xwazD5SyVg"}

You can change the width, height or even change the starting point of the video:

```
!YOUTUBE[A title for the video]{vid="M66U_DuMCS8" width="280" height="157" start="60"}
```

!YOUTUBE[A title for the video]{vid="M66U_DuMCS8" width="280" height="157" start="60"}

It is possible to disable the fullscreen on a video youtube:

```
!YOUTUBE[A title for the video]{vid="M66U_DuMCS8" allowfullscreen="false"}
```

!YOUTUBE[A title for the video]{vid="M66U_DuMCS8" allowfullscreen="false"}

You can't write anything on the same line where you're embedding the video, otherwise it will return your import as plain text.

### Math {#math}

Writing math in markdown isn't usually supported, but when it is, it's usually a [LaTeX](https://www.latex-project.org/) variant that is used. The most used variant for web is [KaTeX](https://katex.org/).
You can write a formula using an inline syntax or block syntax. The inline syntax start with a \$ and end with a \$ too.

`The formula $a^2+b^2=c^2$ is the most well known formula from the pythagorean theorem.`
The formula $a^2+b^2=c^2$ is the most well known formula from the pythagorean theorem.

When writing equations, it's better to use the block syntax:

```
The equation for a circle is:
$$x^2+y^2=0$$
```

The equation for a circle is:

$$x^2+y^2=0$$

Do this:

```
The equation for a circle is:

$$x^2+y^2=0$$

and it works!
```

Don't do this:

```
The equation for a circle is:
$$x^2+y^2=0$$
and it works!
```

### Diagrams {#diagrams}

To draw diagrams, some markdown use the block fence code to render a SVG.
There's some well known diagram libraries that can do that, we support one at least.
[Mermaid](https://mermaid.js.org/) is a JavaScript based diagramming and charting tool that uses Markdown-inspired text definitions and a renderer to create and modify complex diagrams.

Here's an example:

````
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
````

```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

### Include {#include}

It is possible to include a markdown file into another one.
To achieve this, use the `!INCLUDE "./my/path/to/file.md"` directive block.

Example:
```
!INCLUDE "./foo.md"
```

### Include Code {#includecode}

When you want to display some lines from another file as fences code, it could be easier to read using the include code.
This directive block include the code using the syntax `!INCLUDECODE "./name.ext" (language), from:to`.

Examples:

```md
<!-- Include the code from the file -->
!INCLUDECODE "./foo.md"
<!-- Include the code from the file using md as language -->
!INCLUDECODE "./foo.md" (md)
<!-- Include the code from the file using md as language from line 1 to 8 -->
!INCLUDECODE "./foo.md" (md), 1:8
<!-- Include the code from the file from line 3 to 6 -->
!INCLUDECODE "./foo.md", 3:6
```

### Metadata {#metadata}

You could include metadatas at the top of your document to use them later. This is useful when importing other document as templates.
The metadata block begin with `---` and end with it too. It must be at the start of the document (or imported document) and it will take all elements until it find a line with `---`.
The content in between should be written in [YAML](https://docs.ansible.com/ansible/latest/reference_appendices/YAMLSyntax.html).

Example:
```md
---     
title: Hello, world!
author: John Doe
---
```

Of course, writing down the metadata is possible too, you just have to enclose it under `{{NAME}}`. All document metadatas should use the prefix `_meta` to distinguish them from other kind of metadatas.

Example:
```md
---     
title: Hello, world!
author: John Doe
---     

# {{_meta.title}}

This is the main content of your Markdown file autored by **{{_meta.author}}**.

```

It is possible to override the inserted datas that isn't metadata, like the title of the document written as `{{title}}` in the default template. For this case, just begin the name of your variable with `_`.
Example
```md
---     
_title: First Page
author: John Doe
---     

# {{title}}

This is the main content of your Markdown file autored by **{{_meta.author}}**.

```