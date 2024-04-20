# Schness

**WIP: no yet playable!**

From the combination of Schnell (fast in German) and chess, Schness is a very fast paced chess variant.

For this project, I'm going old school: no compiler, no TS, no framework... just some plain old HTML, CSS and JS!

## How to play

The standard chess rules apply, with a few exceptions:

- You can drop a piece on the board instead of making a move. You can check or checkmate your oponent with a piece drop. On you first turn, you must place your king on the board.
- When you take a piece, it goes back to the opponent's bank and he may play it on his next turn.

## Develop

Using VanJS to make the UI reactive: https://vanjs.org/

Serve client with the Live Server extension: https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer

Test on mobile with Ngrok: `ngrok http http://localhost:5500`, website: https://ngrok.com/

## References

Icon set used for the pieces: font Awesome Solid https://icon-sets.iconify.design/fa6-solid/?keyword=solid

Drag & Drop logic based on this article: https://www.horuskol.net/blog/2020-08-15/drag-and-drop-elements-on-touch-devices/

Game based off "Check-Tac-Toe" by Alexander Everett
