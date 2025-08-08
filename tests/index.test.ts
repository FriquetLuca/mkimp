import { MkImp } from "../src"
import path from "path"
import fs from "fs"

test("frontmatter should be found correctly", async () => {
    const mkimp = await new MkImp().ast(
        '----\n{\n"hello":"world"\n}\n----\nHello!'
    )
    expect(mkimp.metadata).toEqual(new Map([["hello", "world"]]))
})

test("include", async () => {
    const mkimp = new MkImp({
        async include(location, from, to) {
            const fullPath = path.resolve(__dirname, "../examples", location)
            const fileContent = fs.readFileSync(fullPath, "utf-8")
            if (from === undefined && to === undefined) {
                return fileContent
            }
            const filelines = fileContent.split(/\r?\n/)
            const newFrom = Math.max(
                0,
                Math.min(from ? from - 1 : 0, filelines.length - 1)
            )
            const newTo = Math.max(
                0,
                Math.min(
                    to ? to - 1 : filelines.length - 1,
                    filelines.length - 1
                )
            )
            return filelines.slice(newFrom, newTo).join("\n")
        },
    })
    const location = path.resolve(__dirname, "../examples/foo.md")
    const fileContent = fs.readFileSync(location, "utf-8")
    const ast = await mkimp.ast(fileContent)
    const result = await mkimp.render(ast)
    expect(result.length).toBeGreaterThan(0)
})

test("heading table of content renderer", async () => {
    const mkimp = new MkImp()
    const result = await mkimp.render({
        type: "root",
        metadata: new Map(),
        reflinks: new Map(),
        emojis: {},
        footnoteDefs: new Map(),
        footnoteIndexRefs: new Map(),
        footnoteRefs: new Map(),
        tableOfContents: [
            {
                type: "heading",
                id: "intro",
                depth: 1,
                tokens: [{ type: "text", text: "abcde1" }],
                isUnderline: false,
                headingIndex: "1.",
            },
            {
                type: "heading",
                id: "usage",
                depth: 2,
                tokens: [{ type: "text", text: "abcde2" }],
                isUnderline: false,
                headingIndex: "1.2.",
            },
            {
                type: "heading",
                id: "forgotten",
                depth: 4,
                tokens: [{ type: "text", text: "abcde3" }],
                isUnderline: false,
                headingIndex: "1.2.0.4.",
            },
            {
                type: "heading",
                id: "install",
                depth: 1,
                tokens: [{ type: "text", text: "abcde4" }],
                isUnderline: false,
                headingIndex: "1.",
            },
        ],
        tokens: [{ type: "tableOfContent" }],
    })
    expect(result).toBe(
        '<ul role="list" class="md-tableofcontent"><li role="listitem" class="md-listitem"><a class="md-link" href="#intro">1.abcde1</a><ul role="list" class="md-tableofcontent"><li role="listitem" class="md-listitem"><a class="md-link" href="#usage">1.2.abcde2</a><ul role="list" class="md-tableofcontent"><li role="listitem" class="md-listitem"><a class="md-link" href="#forgotten">1.2.0.4.abcde3</a></li></ul></li></ul></li><li role="listitem" class="md-listitem"><a class="md-link" href="#install">1.abcde4</a></li></ul>'
    )
})
