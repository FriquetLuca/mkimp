Planned:
1. Comments
    // Line Comment
    /* Inline Comment Block */
1. Table of content
2. Index table
3. Colors
    {color:red}This text is red.{/color}
5. Abbreviations
    From:
    The HTML specification
    is maintained by the W3C.

    *[HTML]: Hyper Text Markup Language
    *[W3C]:  World Wide Web Consortium

    To:
    <p>The <abbr title="Hyper Text Markup Language">HTML</abbr> specification
    is maintained by the <abbr title="World Wide Web Consortium">W3C</abbr>.</p>
6. figure caption for image
    ![Figure Caption](image.png){#fig:label}
7. More tests
4. Graph / plot rendering
5. LaTeX rendering

Maybe:

1. remove html comment
2. sup (^...^) sub (~...~)
3. Embedded PDFs or Documents
    ![](./file.pdf)
    ![](video.mp4)
6. Frontmatter Conditional Rendering
    {{ if Params.draft }}
    🚧 This post is a draft.
    {{ end }}
7. Labeled equations
    $$ E = mc^2 $$ {#eq:einstein}
8. Story Engines
    ## Start
    You wake up in a dark room. [[Go left]] or [[Go right]]?
