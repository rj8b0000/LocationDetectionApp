# location-app

## Overview
This project is a modern location-based React Native application that utilizes OpenStreetMap via Leaflet.js in a WebView. It features a clean UI using react-native-paper and includes functional modules connected to a custom API collection.

## Features
- **Location Detection**: Full-screen Leaflet map with OpenStreetMap tiles.
- **User Authentication**: Login and session management.
- **Home Screen**: Includes sliders and an activity section.
- **Drawer Navigation**: User profile management and modular feature toggling.
- **Polygon-based Access Control**: Checks if the user is within allowed regions.

## Project Structure
```
location-app
├── src
│   ├── api
│   ├── components
│   ├── navigation
│   ├── screens
│   ├── store
│   ├── types
│   └── utils
├── App.tsx
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd location-app
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
To run the application, use:
```
npm start
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.