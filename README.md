# MKDUP

A markdown variant language that has include features and more!

```ts
const markdownImp = new MarkdownImp({
    include(loc, from, to) {
        return `${loc} from [${from}] to [${to}]`;
    },
    includeCode(loc, from, to) {
        return `${loc} from [${from}] to [${to}]`;
    },
});
console.log(markdownImp.parse("# Hello\n\nThis *is* some __nice__ markdown!"));
```
