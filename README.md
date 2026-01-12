# Rubik's Cube Timer

A fully-featured Rubik's cube timer web application with session management, statistics tracking, and scramble generation.

## Features

- **Decimal Timer**: Precise timer with 3 decimal places
- **Spacebar Control**: Long press spacebar to start/stop timer with visual feedback (red → green)
- **Scramble Generator**: Generates random scrambles that update after each solve
- **Time Management**: 
  - View all solve times
  - Delete times
  - Add +2 second penalty
  - Mark as DNF (Did Not Finish)
- **Statistics**:
  - Current Mean of 3 (Mo3)
  - Current Average of 5 (Ao5) - best and worst removed
  - Current Average of 12 (Ao12) - best and worst removed
  - Best Mo3, Ao5, Ao12 across session
  - Session mean
- **Session Management**:
  - Create up to 10 sessions
  - Rename sessions
  - Delete sessions
  - Switch between sessions
- **Solution Generator**: Generates solution based on scramble

## Technical Details

- Pure HTML/CSS/JavaScript (no build step required)
- LocalStorage for data persistence
- Responsive design
- Minimal, modern UI with gradient background

## Future Enhancements

For optimal solution generation using Kociemba's algorithm, consider integrating:
- `cube-solver` JavaScript library
- Or create a backend API using Python's `kociemba` library
