# Master of the Flag

Play [Master of the Flag](https://en.wikipedia.org/wiki/Stratego) online with friends in real time; no logins needed. Uses cookies to remember players, Express for route handling, React for UI, and Socket.IO for client-server communcation. Deployment planned for future.

![demo](demo.gif)

## TODO

UI/front end

- Draw crown on favicon
- Set flag font color to gold
- Box shadow around capture messsage pieces so easier to see
- Remove tableify from message display, simplify CSS
- Change raw center tag in game view to CSS
- Fix height of message div without overflow to prevent resizing
- Fade background color on new message
- Style buttons
- Grey out player's pieces when not player's turn

Game creation

- Show list of games in cookies along with relative dates (Just now, 2 days ago, etc.)
- Allow game deletion
- Add message if unable to write to cookies

Setup

- Allow clicking/dragging to swap pieces
- Allow loading positions from text file
- Add button to flip positions vertically in case file loaded backwards
- Change random starting arrangement to randomly tweaked good starting setups

Gameplay

- Add surrender button
- Add box showing remaining ranks for each player
- Add rules selection at game start

Server

- Database to store game information
- Memory profiling to ensure we don't exceed server space
- Consider replacing socket.io with WebSockets
- Move socket handling, HTML response, and Express middleware into separate modules

Stability

- Memory profiling for games created
- Cron job to check if website up
- Performance profiling

Code

- Add flags for easier testing
- Add enums for CSS style classes
- Add enums for socket.io event names
- Move tests.js to testing folder
- Move styling from dist/ folder to resources/ on root
