# Interactive Rubik's Cube

A browser-based 3D Rubik's Cube made with HTML, CSS, and vanilla JavaScript. Rotate the cube, turn its layers, scramble it, and track your moves and time.

## Run locally

No build step or package installation is required. Open `index.html` in a modern web browser, or serve the project folder with any static web server.

The page loads its display fonts from Google Fonts, so an internet connection is needed for those fonts. The app itself has no JavaScript dependencies.

## Controls

Use the AZERTY keys or the on-screen buttons to turn layers:

| AZERTY keys | Cube moves |
| --- | --- |
| `A` `Z` `E` | Up, Down, Left |
| `Q` `S` `D` | Right, Front, Back |
| `W` `X` `C` | Middle, Equator, Standing |

- Hold `Shift` with a move key to reverse the turn.
- Press `2` to perform the previous move as a double turn.
- Drag on a sticker to turn that face.
- Drag elsewhere on the cube stage to rotate the cube's view.
- Select **Scramble** to apply a random sequence of turns, or **Reset** to reload the solved cube.

## Project files

- `index.html` — page structure and controls
- `style.css` — layout, styling, and responsive rules
- `app.js` — cube rendering, animations, interactions, and timer
