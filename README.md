# AIPAC.cash

A daily guessing game that makes the scale of AIPAC-aligned PAC political funding more visible. Users guess how much money a U.S. politician received from AIPAC-aligned PACs, then see a high-impact numerical reveal with contextualization and cited sources.

## Tech Stack

- **Vite** - Build tool and dev server
- **React** - UI framework
- **TypeScript** - Type safety
- **Lucide React** - Icons

## Local Development

### Prerequisites

- Node.js 20+ and npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

To build for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Environment Variables

The app uses Vite's environment variable system:

- `BASE_URL` - Base URL for the application (defaults to `/`). Set this when deploying to a subdirectory.

Example:
```bash
BASE_URL=/aipacdle/ npm run build
```

## Adding New Daily Puzzles

To add a new puzzle:

1. Create a new JSON file in `public/puzzles/` with the date as the filename:
   - Format: `YYYY-MM-DD.json`
   - Example: `2025-12-15.json`

2. Use the following schema:

```json
{
  "date": "2025-12-15",
  "name": "Full Name",
  "subtitle": "U.S. Senator • State",
  "image": "/images/2025-12-15.jpg",
  "amount": 1635000,
  "note": "Optional note about the source",
  "source": "https://www.example.com/source",
  "sourceLabel": "Source Name",
  "range": {
    "min": 0,
    "max": 3000000
  },
  "party": "D"
}
```

**Field Descriptions:**
- `date`: Puzzle date in YYYY-MM-DD format
- `name`: Politician's full name
- `subtitle`: Title and location (e.g., "U.S. Representative • NY-08")
- `image`: Path to politician image (relative to public directory)
- `amount`: The actual dollar amount received
- `note`: Optional note displayed as the source link text
- `source`: URL to the source data
- `sourceLabel`: Label for the source (used if `note` is not provided)
- `range`: Optional min/max range for the guess slider (defaults to 0-10,000,000)
- `party`: Optional party affiliation ("D" for Democrat, "R" for Republican) - affects image border color

3. Add the corresponding image to `public/images/`:
   - Format: `YYYY-MM-DD.jpg` or `YYYY-MM-DD.png`
   - Example: `2025-12-15.jpg`

4. Update `public/puzzles/index.json` to include the new date in the `dates` array:

```json
{
  "dates": [
    "2025-12-14",
    "2025-12-15"
  ]
}
```

The app will automatically:
- Load today's puzzle (based on America/New_York timezone)
- Fall back to the latest available puzzle if today's puzzle doesn't exist
- Show an error state if no puzzles are available

## Deployment

### GitHub Pages

For GitHub Pages deployment, set the `BASE_URL` environment variable to match your repository path:

```bash
BASE_URL=/<repository-name>/ npm run build
```

Then deploy the `dist/` directory to GitHub Pages.

### Other Static Hosting

For root domain deployment, use the default base URL:

```bash
npm run build
```

Deploy the `dist/` directory to your hosting provider.

## Project Structure

```
aipacdle/
├── public/
│   ├── puzzles/          # Puzzle JSON files
│   │   ├── index.json   # Puzzle index
│   │   └── YYYY-MM-DD.json
│   └── images/           # Politician images
│       └── YYYY-MM-DD.jpg
├── src/
│   ├── components/       # React components
│   │   ├── AboutScreen.tsx
│   │   ├── GuessScreen.tsx
│   │   ├── LogSlider.tsx
│   │   ├── RevealScreen.tsx
│   │   └── ResourcesScreen.tsx
│   ├── utils/            # Utility functions
│   │   ├── formatters.ts
│   │   ├── puzzleLoader.ts
│   │   └── storage.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── styles.css        # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Features

- **Daily Puzzles**: Load puzzles based on the current date (America/New_York timezone)
- **Logarithmic Slider**: Smooth input for large dollar amounts
- **Animated Reveal**: Counting animation with bloom effect
- **Bullseye Animation**: Special animation for guesses within 5% of the answer
- **State Persistence**: Uses localStorage to remember guesses and reveal state
- **Share Functionality**: Copy results to clipboard with fallback support
- **Contextualization**: Shows real-world equivalent for amounts over $10,000
- **Party-Based Styling**: Blue/red borders for Democrat/Republican politicians
- **Resources Page**: Links to humanitarian aid organizations
- **About Page**: Explanation of AIPAC and the game's purpose
- **Theme Toggle**: Light/dark mode support
- **Responsive Design**: Works on mobile and desktop with max-width constraint
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## LocalStorage Schema

The app uses the following localStorage keys:

- `aipac.cash:theme` - User's theme preference ('light' or 'dark')
- `aipac.cash:{date}:guesses` - Array of guess amounts for a specific date
- `aipac.cash:{date}:revealed` - Boolean indicating if puzzle was revealed
- `aipac.cash:{date}:bullseye-shown` - Boolean indicating if bullseye animation was shown (cleared on reset)

## License

MIT
