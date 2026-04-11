# Wheel of Names — Global AI Community

A real-time, privacy-first wheel of names for picking winners at live community events. Built for [AgentCon Berlin 2026](https://globalai.community/chapters/berlin/events/agentcon-berlin-2026/) by the Global AI Community.

**No ads. No trackers. No cookies. GDPR compliant.**

![License](https://img.shields.io/badge/license-MIT-blue)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen)
![Tests](https://img.shields.io/badge/tests-18%20passing-brightgreen)

## Live Demo

**https://ibxibx.github.io/wheel2/**

## The Problem

At community events, presenters often use shady wheel-of-names websites riddled with ads, trackers, and privacy concerns. Attendees have to queue up one by one to type their name into a single laptop. Not great for 50+ people.

## The Solution

A self-hosted wheel of names where:
- **Attendees scan a QR code** on their phone and enter their name — all at once, in parallel
- **Names sync in real-time** to the presenter's screen via Firebase Realtime Database
- **The presenter spins the wheel** to pick winners with confetti, sounds, and celebration
- **No personal data is stored** beyond first names for the duration of the event

## Features

### For Attendees (Mobile)
- Scan QR code displayed on the projector
- Enter your name on a clean, mobile-optimized form
- Duplicate detection — can only join once per device
- Live participant count after joining
- Success confirmation screen

### For the Presenter (Host View)
- Full-screen spinning wheel with smooth animations
- **Spin the Wheel** — picks a random eligible winner
- **Pick 5 Winners** — auto-spins 5 rounds with pauses between each
- Winners are excluded from future spins automatically
- Add names manually from the host view
- Remove individual participants or clear all
- Reset winners to start over
- QR code + copyable join link generated automatically

### Celebration Effects
- Confetti burst (200 physics-based particles with gravity, spin, and fade)
- Fanfare sound (synthesized with Web Audio API — no audio files needed)
- Tick sounds during spin that accelerate and decelerate with the wheel
- Full-screen winner announcement overlay with trophy icon

### Technical
- **Single `index.html` file** — no build step, no bundler
- **Firebase Realtime Database** for cross-device sync
- **Local fallback mode** — works without Firebase for quick demos
- **GitHub Pages compatible** — static hosting, no server required
- **18 Playwright tests** covering UI, security, and responsiveness
- **Web Audio API** for sounds — zero external audio files
- **QR code generation** via client-side library

## Architecture

```
┌─────────────────┐     QR scan      ┌──────────────────┐
│   Host View     │◄────────────────►│   Mobile Join    │
│  (Projector)    │                  │   (Attendee)     │
└────────┬────────┘                  └────────┬─────────┘
         │                                    │
         │  onValue()              push()     │
         │                                    │
         └──────────┐    ┌────────────────────┘
                    ▼    ▼
            ┌──────────────────┐
            │ Firebase Realtime │
            │    Database       │
            │                  │
            │  rooms/          │
            │   └─{roomId}/    │
            │      ├─participants/
            │      └─winners/  │
            └──────────────────┘
```

**Host view** subscribes to Firebase with `onValue()` — any change triggers an instant re-render of the wheel and participant list.

**Mobile join** writes to Firebase with `push()` after checking for duplicate names across both participants and winners.

**Local mode** activates automatically when Firebase is unavailable — the host can still add names manually and spin the wheel.

## Quick Start

### Option 1: GitHub Pages (Static Deploy)

1. Fork this repo
2. Enable GitHub Pages (Settings → Pages → Source: `master`, Path: `/`)
3. Set up Firebase (see below)
4. Your wheel is live at `https://<username>.github.io/wheel2/`

### Option 2: Local Server

```bash
git clone https://github.com/ibxibx/wheel2.git
cd wheel2
npm install
npm run dev
# → http://localhost:4173
```

The local server injects Firebase config from a gitignored file and serves the app.

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or use an existing one)
3. **Create a Realtime Database:**
   - Navigate to Build → Realtime Database
   - Click "Create Database"
   - Choose a location (e.g., `europe-west1` for European events)
   - Select "Start in test mode"
4. **Get your config:**
   - Go to Project Settings → General → Your Apps → Web App
   - Copy the config object

### For Local Development

Create `firebase-config.json` (gitignored) from the example:

```bash
cp firebase-config.example.json firebase-config.json
# Edit firebase-config.json with your values
```

### For GitHub Pages

Update the `FIREBASE_FALLBACK` object in `index.html` with your Firebase config. Firebase web API keys are [public by design](https://firebase.google.com/docs/projects/api-keys) — security is enforced by Firebase Security Rules.

### Recommended Security Rules

For production use, replace the test-mode rules with:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        "participants": {
          ".read": true,
          "$participantId": {
            ".write": "!data.exists()",
            ".validate": "newData.hasChildren(['name', 'joinedAt']) && newData.child('name').isString() && newData.child('name').val().length <= 40"
          }
        },
        "winners": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

## Usage at Events

1. Open the host view on the projector: `https://<your-url>/`
2. The QR code and join link appear in the sidebar
3. Tell attendees to scan the QR code with their phone
4. Attendees enter their name — it appears on the wheel in real-time
5. Click **Spin the Wheel** or **Pick 5 Winners**
6. Enjoy the confetti and sounds
7. Click **Clear All Participants** when done

**Tip:** For local network events, use your machine's LAN IP (e.g., `http://192.168.1.42:4173`) so phones on the same Wi-Fi can connect without internet.

## Testing

```bash
npm install
npx playwright install chromium
npx playwright test
```

18 tests covering:
- Host view UI structure and elements
- Firebase connection status
- QR code and join URL generation
- Wheel canvas rendering
- Join view form and validation
- Winner overlay and confetti canvas
- Responsive layout (mobile + desktop)
- Security (no embedded secrets in static HTML, no trackers)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Single HTML file, vanilla JS, CSS |
| Font | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |
| Database | Firebase Realtime Database |
| QR Codes | [qrcode](https://www.npmjs.com/package/qrcode) (client-side) |
| Sounds | Web Audio API (synthesized, no files) |
| Confetti | Canvas 2D (custom physics engine) |
| Local Server | Node.js HTTP server |
| Tests | Playwright |
| Hosting | GitHub Pages |

## Project Structure

```
wheel2/
├── index.html                  # The entire app (single file)
├── server.mjs                  # Local dev server (injects Firebase config)
├── package.json
├── firebase-config.json        # Your Firebase config (gitignored)
├── firebase-config.example.json # Template for Firebase config
├── playwright.config.ts        # Test configuration
├── tests/
│   └── wheel.spec.ts           # 18 Playwright tests
└── .gitignore
```

## Privacy

- No analytics, no tracking, no cookies
- Only first names are stored (in Firebase) for the duration of the event
- Presenter can delete all data with one click
- Firebase Security Rules limit what clients can do
- No data is shared with third parties

## License

MIT

## Credits

Built live on stage at [AgentCon Berlin 2026](https://globalai.community/chapters/berlin/events/agentcon-berlin-2026/) with GitHub Copilot by the [Global AI Community Berlin](https://globalai.community/chapters/berlin/) chapter.
