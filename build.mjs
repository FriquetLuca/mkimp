import * as esbuild from "esbuild"

const shared = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: true,
    platform: "neutral",
    target: "es2020",
}

await Promise.all([
    // ESM build
    esbuild.build({
        ...shared,
        external: ["highlight.js", "katex"],
        format: "esm",
        outfile: "dist/index.esm.js",
    }),

    // CJS build
    esbuild.build({
        ...shared,
        external: ["highlight.js", "katex"],
        format: "cjs",
        outfile: "dist/index.cjs.js",
        platform: "node",
    }),

    // IIFE build (for browser use)
    esbuild.build({
        ...shared,
        format: "iife",
        globalName: "mkimp", // change this to the global name you want exposed
        outfile: "dist/index.iife.js",
        platform: "browser",
    }),
])
