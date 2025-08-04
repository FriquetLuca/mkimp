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
    const result = mkimp.render(ast)
    expect(result.length).toBeGreaterThan(0)
})
