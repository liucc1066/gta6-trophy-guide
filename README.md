# Leonida Ledger — GTA 6 Trophy Guide & Tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/liucc1066/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/liucc1066/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a guide in our own words that cites its sources, a six-phase roadmap to the platinum, missable flags, and a checklist whose progress is saved in the browser.

## Run it locally

```sh
node serve.ts
```

Then open http://localhost:8080. The app is plain static files under `app/` — no build step, no network. It works with the network off.

## What it does

- **The checklist** — all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze). Tick a trophy when it pops; progress is saved in localStorage and survives a reload.
- **Filters** — by grade, by kind (story, missable, collectibles, activities, odd ones), by earned or still to earn, plus full-text search.
- **Spoiler mode** — hides the names and descriptions of story trophies until you earn them.
- **Progress counters** — trophies with a PSN target (250 stunts, 42 Shooting Range challenges, 52 areas of Leonida…) carry a counter you can tap up as you go.
- **Export and import** — save your progress to a JSON file and load it back on another machine.
- **The roadmap** — six phases in play order, from landing in Leonida to the platinum, with the missable moments placed before the finale.
- **Cited guides** — each guide is written for this entry from the official description alone, and names its sources. Where a description pins no place or step down, the guide says so instead of inventing one.

## Sources

- [Exophase — the official trophy list](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
- [PSNProfiles — PSN progress targets](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi)

Names, descriptions and grades are the official list as PlayStation publishes it. The game is a day old and nothing here was checked in play; missable flags are inferred from the official descriptions and say so in the app.

## Entry

Built for [make.fun's GTA 6 trophy guide bounty](https://make.fun/bounty/gta6-trophy-guide-01). The program at `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

New to make.fun? Sign up with my referral link and we both get a bonus: https://make.fun/r/g2c1d6ze

## License

MIT. Unofficial and unaffiliated with Rockstar Games or PlayStation; no official artwork is used.
