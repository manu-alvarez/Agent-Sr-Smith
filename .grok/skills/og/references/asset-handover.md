# Brand asset atomic hand-over

Produce real, validated, complete files before running these commands. Never stage in public/.

Open Graph card (1200x630, JPEG, below 600 KB):
node scripts/write-atomic.mjs /workspace/.grok/og.jpg.tmp /workspace/public/og.jpg

X feed banner (1200x264, JPEG, below 600 KB):
node scripts/write-atomic.mjs /workspace/.grok/x-banner.jpg.tmp /workspace/public/x-banner.jpg

Prepare valid JSON metadata with title, description, card, image, banner and game type first.
node scripts/write-atomic.mjs /workspace/.grok/site.json.tmp /workspace/src/lib/og/site.json

Check the actual files: node scripts/brand-check.mjs --game
