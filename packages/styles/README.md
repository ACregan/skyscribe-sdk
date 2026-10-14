# @skyscribe-sdk/styles

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/styles)](https://www.npmjs.com/package/@skyscribe-sdk/styles)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Base CSS for rendering [SkyScribe](https://skyscribe.app) article content in consumer sites. Pure CSS — no build step, no JavaScript.

All rules are scoped to `.scribe-content` so they cannot leak into the rest of your page. Override any `--scribe-*` custom property to theme the output.

## Installation

```bash
npm install @skyscribe-sdk/styles
```

## Usage

### With Vite / React / React Router

Import the stylesheet once at the route that renders article content:

```ts
import "@skyscribe-sdk/styles";
```

Then wrap your article HTML in an element with the `scribe-content` class:

```tsx
<div
  className="scribe-content"
  dangerouslySetInnerHTML={{ __html: article.content }}
/>
```

Or use the `<ScribeContent>` component from `@skyscribe-sdk/react`, which adds the class automatically:

```tsx
import { ScribeContent } from "@skyscribe-sdk/react";
import "@skyscribe-sdk/styles";

<ScribeContent html={article.content} />
```

### With a `<link>` tag (CDN / no bundler)

```html
<link rel="stylesheet" href="https://unpkg.com/@skyscribe-sdk/styles/src/index.css" />
```

## What it styles

| Element | Selector |
| ------- | -------- |
| Code blocks | `.scribe-content pre` |
| Inline code | `.scribe-content :not(pre) > code` |
| Syntax tokens | `.scribe-content .token.keyword` etc. |
| Images | `.scribe-content img` |
| Blockquotes | `.scribe-content blockquote` |
| Horizontal rules | `.scribe-content hr` |
| Tables | `.scribe-content table`, `th`, `td` |
| Ordered / unordered lists | `.scribe-content ul`, `.scribe-content ol` |
| Checklists | `.scribe-content li[role="checkbox"]` |

Token classes (`token keyword`, `token string`, …) are the Prism-compatible class names that the SkyScribe editor emits when it serialises article content.

## Theming

Override any custom property on `.scribe-content` (or a parent) to customise the output:

```css
.my-article {
  --scribe-code-bg: #1e1e1e;
  --scribe-code-border: #333;
  --scribe-token-keyword: #569cd6;
  --scribe-token-string: #ce9178;
  --scribe-token-comment: #6a9955;
  --scribe-token-function: #dcdcaa;
  --scribe-token-variable: #9cdcfe;
  --scribe-blockquote-border: #444;
  --scribe-blockquote-color: #aaa;
  --scribe-hr-color: #444;
  --scribe-table-border: #555;
  --scribe-table-header-bg: rgba(255, 255, 255, 0.06);
}
```

### Full list of custom properties

| Property | Default | Description |
| -------- | ------- | ----------- |
| `--scribe-code-bg` | `#f5f5f5` | Code block background |
| `--scribe-code-border` | `#e0e0e0` | Code block border colour |
| `--scribe-code-font` | `"Courier New", Courier, monospace` | Font family for code |
| `--scribe-code-font-size` | `0.875em` | Font size for code |
| `--scribe-inline-code-bg` | `rgba(0,0,0,0.06)` | Inline code background |
| `--scribe-blockquote-border` | `#ccc` | Blockquote left border colour |
| `--scribe-blockquote-color` | `#666` | Blockquote text colour |
| `--scribe-hr-color` | `#ddd` | Horizontal rule colour |
| `--scribe-table-border` | `#ccc` | Table cell borders |
| `--scribe-table-header-bg` | `rgba(0,0,0,0.04)` | Table header row background |
| `--scribe-checkbox-size` | `1em` | Checklist checkbox size |
| `--scribe-checkbox-border` | `#aaa` | Unchecked checkbox border |
| `--scribe-checkbox-checked-bg` | `#333` | Checked checkbox fill |
| `--scribe-checkbox-checked-border` | `#333` | Checked checkbox border |
| `--scribe-token-comment` | `#708090` | `comment`, `prolog`, `doctype`, `cdata` |
| `--scribe-token-punctuation` | `#555` | `punctuation` |
| `--scribe-token-property` | `#905` | `property`, `tag`, `boolean`, `number`, `constant`, `symbol`, `deleted` |
| `--scribe-token-string` | `#690` | `string`, `selector`, `attr`, `char`, `builtin`, `inserted` |
| `--scribe-token-operator` | `#9a6e3a` | `operator`, `entity`, `url` |
| `--scribe-token-keyword` | `#07a` | `keyword`, `atrule` |
| `--scribe-token-function` | `#dd4a68` | `function`, `class-name`, `class` |
| `--scribe-token-variable` | `#e90` | `variable`, `regex`, `important` |
