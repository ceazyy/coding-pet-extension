# Coding Pet Extension 🐾

A cute and interactive Chrome extension that helps you track your coding progress on LeetCode with an adorable pet companion!

![Coding Pet Demo](assets/demo.gif)

## Features ✨

- 🐱 **Interactive Pet Overlay**
  - Physics-based movement
  - Draggable interface
  - Realistic animations
  - Multiple pet states (frail, happy, normal, sleeping)

- 📊 **Progress Tracking**
  - Daily coding goals
  - LeetCode problem tracking
  - Visual progress indicators
  - Achievement system

- 🎨 **Cute Design**
  - Minimalistic interface
  - Pink theme
  - Pet paw animations
  - Responsive layout

## Installation 🚀

### From Chrome Web Store
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/coding-pet/your-extension-id)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation
1. Download the latest release from the [Releases page](https://github.com/yourusername/coding-pet/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder

## Usage Guide 📖

### Setting Up
1. Click the Coding Pet icon in your Chrome toolbar
2. Set your daily coding goal using the slider
3. The pet will appear on LeetCode pages

### Interacting with Your Pet
- **Drag**: Click and drag the pet to move it around
- **States**: The pet changes appearance based on your progress
  - 🥺 Frail: When you haven't met your daily goal
  - 😊 Happy: When you've completed your goal
  - 😴 Sleeping: When you're inactive
  - 🐱 Normal: Default state

### Tracking Progress
- The extension automatically tracks:
  - Problems solved
  - Daily goals
  - Streak information
  - Achievement progress

## Development 🛠️

### Prerequisites
- Node.js (v14 or higher)
- Chrome browser
- Basic knowledge of JavaScript

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/coding-pet.git
   cd coding-pet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Project Structure
```
coding-pet/
├── src/
│   ├── content.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── utils/
│       ├── error.js
│       ├── analytics.js
│       └── feedback.js
├── assets/
│   ├── images/
│   └── icons/
├── manifest.json
└── README.md
```

## Contributing 🤝

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Privacy & Terms 📜

- [Privacy Policy](privacy-policy.html)
- [Terms of Service](terms.html)

## Support 💖

- Report bugs: [GitHub Issues](https://github.com/yourusername/coding-pet/issues)
- Feature requests: [GitHub Discussions](https://github.com/yourusername/coding-pet/discussions)
- Email: support@codingpet.com

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- LeetCode for their platform
- Contributors and supporters
- Open source community

---

Made with ❤️ by [Your Name]
