demo:


https://github.com/user-attachments/assets/1ea261a6-f5c8-4d30-9ceb-a756d705b89b



contains: test cases with jest in typescript, movement validation for all pieces, multiplayer with WebSocket

to fix:
- glitch of multiple copies of questions being asked about which piece to move.
- fix problem with being stuck when making invalid moves
- add message to all players when game is over
- etc.

to play game:
- compile with "npx tsx"
- run server with "node dist/server.js"
- run 2 clients with "node dist/client.js"
