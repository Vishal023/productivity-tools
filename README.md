# Productivity Tools

A collection of developer productivity tools.

## Structure

```
productivity-tools/
├── index.html                    # Landing page
├── shared/
│   ├── css/
│   │   ├── variables.css         # CSS custom properties
│   │   ├── base.css              # Reset, typography, layout
│   │   └── components.css        # Navbar, cards, buttons, inputs
│   └── js/
│       ├── utils.js              # Shared utilities
│       └── navbar.js             # Dynamic navbar
├── tools/
│   └── story-points/
│       ├── index.html
│       ├── style.css
│       └── script.js
└── README.md
```

## Adding a New Tool

1. Create folder: `tools/your-tool/`
2. Add `index.html`, `style.css`, `script.js`
3. Import shared assets in HTML:
   ```html
   <link rel="stylesheet" href="../../shared/css/variables.css">
   <link rel="stylesheet" href="../../shared/css/base.css">
   <link rel="stylesheet" href="../../shared/css/components.css">
   <link rel="stylesheet" href="style.css">
   ```
4. Add tool to `shared/js/navbar.js` TOOLS array
5. Add card to landing page `index.html`

## Running Locally

Open `index.html` in a browser or use a local server:

```bash
npx serve .
```
