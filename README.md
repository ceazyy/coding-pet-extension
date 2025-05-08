# Kegawa - Your Coding Pet

Kegawa, a pet for your coding adventures :3 

Feed them, else they die which you wouldn't want. Feed them by solving problems.

ps: Contribute to this by adding animations/newer designs to the interface/pop-up.

## Future Scope

1. Add more pet types
2. Implement the LLM-based help feature
3. Add more animation states and improved visuals
4. Extend to support additional coding websites
## Features

- Virtual pet that responds to your coding progress
- Daily coding goals ("Chonk" levels)
- Pet status tracking (health, happiness, progress)
- Problem-solving backlog management
- Interactive pet animations
- Daily progress reset system

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Set your daily coding goal (Chonk level) in the extension popup
2. Solve problems on LeetCode
3. Your pet will react to your progress:
   - Successfully solving problems increases happiness
   - Meeting daily goals keeps your pet healthy
   - Missing goals adds to your backlog
   - Too much backlog may put your pet in critical condition!

## Pet States

- **Normal**: Default state
- **Happy**: Achieved daily goal
- **Frail**: Has backlog or low health
- **Sleeping**: Resting state

## File Structure
```
coding-pet-extension/
├── manifest.json
├── background.js
├── content.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   └── pets/
│       └── dog/
│           ├── normal.png
│           ├── happy.png
│           ├── sleeping.png
│           └── frail.png
└── utils/
    └── storage.js
```
## Development

- `popup/`: Contains the extension popup UI files
- `utils/`: Utility functions for storage operations
- `background.js`: Handles background processes and daily resets
- `content.js`: Monitors LeetCode activity and manages pet animations
- `manifest.json`: Extension configuration

## Permissions

- `storage`: For saving pet state and settings
- `alarms`: For daily progress reset
- Host permission for `leetcode.com`

## License

MIT License (Recommended to add your specific license)
