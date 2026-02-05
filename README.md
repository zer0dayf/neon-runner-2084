# 🎮 Neon Runner 2084

<div align="center">

![Neon Runner 2084](https://img.shields.io/badge/Game-Neon%20Runner%202084-00ffff?style=for-the-badge&logo=unity&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android-ff0055?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active%20Development-00ff00?style=for-the-badge)

**A synthwave-themed 3D tunnel runner game built with React and Three.js**

[Play Now](#) • [Download APK](#) • [Report Bug](https://github.com/zer0dayf/neon-runner-2084/issues)

</div>

---

## 🌟 Features

- 🎯 **5 Unique Stages** - Progressive difficulty with distinct obstacle types
- ♾️ **Infinite Mode** - Endless challenge with high score tracking
- 🎨 **Synthwave Aesthetics** - Neon colors, retro sun, and 80s vibes
- 📱 **Mobile Ready** - Swipe and tap controls for touch devices
- ⌨️ **Keyboard Support** - Arrow keys and WASD for desktop
- 🎵 **Immersive Audio** - Retro soundtrack with sound effects
- 💾 **Progress Saving** - LocalStorage for level unlocks and high scores

---

## 🎮 Gameplay

Navigate your neon sphere through a twisting cyberpunk tunnel, dodging obstacles as you race toward the synthwave sun. Master the controls, avoid the hazards, and achieve the highest score!

### Obstacle Types
| Type | Description |
|------|-------------|
| 🟥 **Block** | Static cube obstacles |
| 🟡 **Ring** | Torus gates with safe passage zones |
| 🟣 **Spinner** | Rotating bar obstacles |
| 🔴 **Double Spinner** | Cross-shaped rotating hazards |

### Controls
| Platform | Controls |
|----------|----------|
| **Desktop** | Arrow Keys / A-D |
| **Mobile (Swipe)** | Drag left/right |
| **Mobile (Tap)** | Tap left/right side of screen |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Three.js | 3D Rendering |
| @react-three/fiber | React Three.js Renderer |
| @react-three/drei | Three.js Helpers |
| @react-three/postprocessing | Visual Effects |
| Vite | Build Tool |
| TypeScript | Type Safety |
| Capacitor | Android Packaging |
| TailwindCSS | UI Styling |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/zer0dayf/neon-runner-2084.git
cd neon-runner-2084

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

### Android Build

```bash
# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## 📁 Project Structure

```
neon-runner-2084/
├── App.tsx              # Main app component & state management
├── components/
│   ├── GameScene.tsx    # 3D scene orchestrator
│   ├── Track.tsx        # Game logic & player controls
│   ├── UIOverlay.tsx    # All UI screens & HUD
│   ├── WorldComponents.tsx # Decorative 3D objects
│   ├── Effects.tsx      # Post-processing effects
│   └── AudioManager.tsx # Sound management
├── constants.ts         # Game constants & track curve
├── types.ts             # TypeScript interfaces
├── android/             # Capacitor Android project
└── public/              # Audio assets
```

---

## 🎯 Roadmap

- [ ] iOS support via Capacitor
- [ ] Leaderboard system
- [ ] Additional game modes
- [ ] Power-ups and collectibles
- [ ] Custom player skins
- [ ] Level editor

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Game assets (audio, graphics) are proprietary and not covered by the MIT license.

---

## 👤 Author

**zer0dayf**

- GitHub: [@zer0dayf](https://github.com/zer0dayf)

---

<div align="center">

**Made with 💜 and lots of neon lights**

*Race through the neon-lit tunnels of 2084!*

</div>
