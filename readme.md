# OSRS Toolkit

A local desktop application built using **Electron.js** and **ZeroMQ** to track various aspects of Old School RuneScape (OSRS).

## Project Structure

**osrs-toolkit/**  
├── **main.js** – Electron main process  
├── **package.json** – Project dependencies  
├── **renderer/**  
│   ├── **index.html** – Main UI layout  
│   └── **renderer.js** – Frontend logic  
├── **microservices/**  
│   ├── **quest-tracker.py** – Quest progression service  
│   ├── **osrs-skills.py** – Player stats service  
│   ├── **hi-score.py** – Ranking service  
│   └── **ge-tracker.py** – GE price tracking service  
├── **node_modules/** – Installed dependencies  
└── **styles/**  
&nbsp;&nbsp;&nbsp;&nbsp;└── **styles.css** – UI styling  

## Features
- Quest Tracker – Fetches completed and uncompleted quests for a player.
- Player Stats – Retrieves OSRS Hiscores for skill tracking.
- Hi-Score Tracker – Compares player rankings.
- GE Price Tracker – Fetches item prices from the Grand Exchange.

## Tech Stack
- **Frontend:** Electron.js, HTML, CSS, JavaScript
- **Backend:** Node.js (Microservices via ZeroMQ)
- **APIs Used:** OSRS Wiki API, OSRS Hiscores, GE Market API

## Setup Instructions
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/osrs-toolkit.git
   cd osrs-toolkit
