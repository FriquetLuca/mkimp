import hljs, { type LanguageFn } from 'highlight.js';
import { bbcode } from './bbcode';
import { hlsl } from './hlsl';
import { liquid } from './liquid';
import { lookml } from './lookml';
import { magik } from './magik';
import { metapost } from './metapost';
import { odin } from './odin';
import { prisma } from './prisma';
import { razor } from './cshtml-razor';
import { tsql } from './tsql';
import { zenscript } from './zenscript';
import { zig } from './zig';
import { blade } from './blade';
import { c3 } from './c3';
import { cobol } from './cobol';
import { curl } from './curl';

function generatehljs() {
    hljs.registerLanguage('bbcode', bbcode);
    hljs.registerLanguage('hlsl', hlsl);
    hljs.registerLanguage('liquid', liquid);
    hljs.registerLanguage("magik", magik);
    hljs.registerLanguage("odin", odin);
    hljs.registerLanguage("cshtml-razor", razor);
    hljs.registerLanguage("zenscript", zenscript);
    hljs.registerLanguage("zig", zig);
    hljs.registerLanguage("blade", blade);
    hljs.registerLanguage("curl", curl);
    hljs.registerLanguage("c3", c3 as LanguageFn);
    hljs.registerLanguage("tsql", tsql as LanguageFn);
    hljs.registerLanguage("prisma", prisma as LanguageFn);
    hljs.registerLanguage('lookml', lookml as LanguageFn);
    hljs.registerLanguage("cobol", cobol as unknown as LanguageFn);
    hljs.registerLanguage('metapost', metapost as unknown as LanguageFn);
    return hljs;
}

export default generatehljs();
