## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
- Respect the structure of the Project
Every file .jsx has a file .css that has the same name and
every file .css must have all the same parent folder as the file .jsx of the same name
Every file .css are on /vue/src/assets/style
Every file .jsx component are on /vue/src/components*
All logic function who will be used must be in .js file
on /vue/src/utils
- Respecter la modularité, que ce soit .jsx .js ou .css
- Respecte le mobile-first, le user-friendly, les principes UX/UI
- Diminues grandement la charge cognitive du visiteur lors de sa visite
- Ne mets pas les emojis, mieux tu utilises les font-awesome
- Mets les accents et les caractères spéciaux pour respecter la langue
- Les interfaces doivent respirer tout en gardant le branding, le copywrite et l'impact recherché 