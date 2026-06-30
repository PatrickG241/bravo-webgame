# Bravo Road Runner
> A two-mode web game experience: a tiny concept prototype and a fuller polished car-dodge runner.

## Authorship
- Patrick Graham — [GitHub profile](https://github.com/PatrickG241) — June 2026 — Version 1.0

## User story
- As a visitor to my GitHub profile, I want a playful web game so that I can share a fun, interactive experience with others.

## Narrative
Step into the driver seat and dodge your way through a neon highway. The concept mode keeps things tiny and approachable, while the full game adds more motion, score tracking, and a leaderboard for longer runs.

## About the app

### Planning links
- Issue ideas: https://github.com/PatrickG241/bravo-webgame/issues/1
- Planning notes: [pages/README.md](pages/README.md)

### Project tree
```text
.
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── pages/
    ├── concept.html
    └── README.md
```

### Tech and tools
- VS Code
- HTML, CSS, JavaScript
- Bootstrap 5 and Bootstrap Icons
- Normalize.css
- GitHub Pages, Issues, and README documentation

### Code snippet
```js
function moveConceptObstacle() {
  conceptState.lane = conceptState.lane === 1 ? 2 : 1;
  conceptState.obstacleLane = Math.floor(Math.random() * 3);
  updateConceptVehicle();
  updateConceptObstacle();
}
```

### Validation and accessibility
- Verified the JavaScript syntax with Node.
- Used semantic HTML, descriptive button labels, and Bootstrap-friendly structure.

### Sprint 99 / future ideas
- Add sound effects and a pause button.
- Add difficulty levels and power-ups.
- Expand the leaderboard with richer stats and persistence.