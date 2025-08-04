3. aria for elements (prolly end heading with <a aria-hidden="true" class="anchor" id="heading" href="#heading">¶</a>)
    1. <h1 aria-level="1">Heading</h1><h2 aria-level="2">Subheading</h2> (heading)
    2. <a href="..." aria-label="Descriptive label if needed">text</a> (links)
    3. <blockquote role="note" aria-label="Quote by author">...</blockquote> (blockquote)
    4. <ul role="list">...</ul><ol role="list">...</ol><li role="listitem">...</li> (list)
    5. <code aria-label="Code">someFunction()</code> (inline)
    6. <pre role="region" aria-label="Code block in JavaScript"> <code>...</code> </pre> (Code Block)
        - Use role="region" and aria-label if the block is large or interactive.
        - Consider aria-live="polite" for live-editable code blocks.
    7. <hr role="separator" aria-hidden="true" /> (Horizontal Rules)
    8. <article role="document" aria-label="Markdown content">...</article> (Markdown Root / Article)
    9. <table role="table">
        <thead role="rowgroup">
            <tr role="row">
            <th role="columnheader" scope="col">Header</th>
            </tr>
        </thead>
        <tbody role="rowgroup">
            <tr role="row">
            <td role="cell">Data</td>
            </tr>
        </tbody>
        </table>
    