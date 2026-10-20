# Changelog

## Unreleased

- Every port now follows one role contract, checked in CI by highlighting real code with real grammars. Fixes it found:
  - A constant's name is a name, as in the JetBrains IDEs: in `const RADIUS = 0.35`, RADIUS takes the text color and
    only the value takes a value color. Neovim, Helix, Zed, Sublime Text and Obsidian painted ALL_CAPS names, Rust
    `const` items and Go consts in the constant color, and Hunk in GitHub's blue. Enum members take the property color
    everywhere, as JetBrains draws them; the constant color is for constant values (`true`, `null`, `nil`, `None`).
  - VS Code, Expressive Code, bat, delta, yazi and Hunk: field declarations take the property color, decorator
    names the decorator color, Python's `self` the builtin color, Lua's `and`/`or`/`not` the keyword color, Go/C/Rust
    built-in types the type color, TOML keys the property color, HTML entities the escape color, CSS tag selectors the
    tag color and pseudo-classes the decorator color. Python member access (`self.gpu`) no longer takes the decorator
    color, and `#define` and other preprocessor directives take it.
  - Hunk: no color of its base theme (GitHub) shows through anymore, including the default text color.
  - Zed: enums, enum variants, preprocessor directives, decorators, macros, lifetimes, parameters, builtins, CSS
    selectors, list markers, doc strings and diff lines are themed (they fell back to plain text or the wrong role).
    The title bar keeps its color when the window loses focus, and the selection uses the selection color.
  - Helix: escapes, character literals, paths, links, checklists and C preprocessor macros take their roles.
  - JetBrains: the scheme sets every key the IDE's own Default and Darcula schemes color, so none of their colors shows
    through. Local variables in JavaScript and TypeScript (RADIUS) showed Darcula's #a9b7c6 instead of the text color,
    and the new terminal, Markdown headers, Sass, Haml, Mermaid, Velocity, XPath and Kotlin debugger values used
    Darcula's palette. Exported variables no longer take the builtin color, and TypeScript module names, primitive
    types, type parameters, template `${}` and labels take their roles.
  - Neovim: Markdown headings use the heading color at every level (Signal no longer shows six accents), and
    library functions from a language server take the builtin-function color.
  - Obsidian: code is colored token by token; constants no longer share the tag color and types the function color.
- foot: the theme loads again on foot 1.23 and newer, which replaced `[colors]` with `[colors-dark]` and
  `[colors-light]`; Paper selects the light theme.
- CSS variables and Tailwind CSS: `--lc-comment` is the comment color again. The role was declared as `var(--lc-comment)`, a variable that refers to itself, so browsers dropped it, and with it `--lc-fg-subtle`, `--lc-operator` and the Tailwind `lc-comment` color.

## 0.1.1

- JetBrains: the plugin icon is the Night (dark) icon everywhere, including the Marketplace page.

## 0.1.0

First release.

- Four flavors: Living Code Night, Frost, Paper and Signal.
- Ports for editors (Neovim, VS Code, JetBrains IDEs, Zed, Helix, Sublime Text), terminals, CLI and TUI tools, Firefox and the web.
