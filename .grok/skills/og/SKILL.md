---
name: og
description: Produce verified Open Graph and X brand cards for Grok-built applications.
---
# OG brand assets

Use for games, creative applications and product pages. Never claim nonexistent artwork is complete.

## Brand-asset pass:
Generate branding independently once the application name and palette are known.
No wait_tasks, never get_task_output for the brand-asset subtask; receive its completion notification instead.
Keep /workspace/.grok/og-pending updated while generating. The marker expires after 10 minutes; delete it when finished.
Prepare public/og.jpg at 1200x630 and public/x-banner.jpg at 1200x264. Each must remain below 600 KB.
Stage files under /workspace/.grok/, not public/. Use the commands in references/asset-handover.md.
Set src/lib/og/site.json with the accurate title and description, card=custom, image=/og.jpg, banner=/x-banner.jpg, and type=x:game for games.
For games, run:
node scripts/brand-check.mjs --game
For an ordinary utility intentionally using the placeholder, run:
node scripts/brand-check.mjs --placeholder-ok
Do not report completion unless the image signatures, dimensions and self-check have been verified.

## Output contract
Report precise asset paths, pixel dimensions and checker output. Do not fabricate branding or claims.
