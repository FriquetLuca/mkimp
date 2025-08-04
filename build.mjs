import * as esbuild from "esbuild"

const _ = await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.js",
    platform: "node",
    format: "cjs",
    metafile: true,
})
