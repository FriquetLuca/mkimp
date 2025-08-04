import { MkImp } from "../src"

test("frontmatter should be found correctly", async () => {
    const mkimp = await new MkImp().ast('----\n{\n"hello":"world"\n}\n----\nHello!')
    const expectResult = new Map([["hello", "world"]])
    expect(mkimp.metadata).toEqual(expectResult)
})
