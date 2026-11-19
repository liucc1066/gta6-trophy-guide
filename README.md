# Vice City Nights — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/liucc1066/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/liucc1066/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of **Grand Theft Auto VI** — built for the [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) bounty on make.fun.

## What it is

A static web app (no build step, no network) that opens in any desktop browser:

- **Checklist of all 55 trophies** — every official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze), with checkboxes saved in `localStorage`, a progress header ("X of 55 earned"), a progress bar and counts by grade.
- **A guide to each trophy, in our own words** — what to do, when it can be done (story / free roam / after the story), and whether it can be missed, plus 1–3 practical tips and a source line beside every guide.
- **Roadmap to the Platinum** — six phases in order (story, stranger strands, activities, collectibles, combat & misc cleanup, 100% & platinum), each listing the trophies it covers.
- **Missables to watch** — the five trophies that can slip past (the two partner trophies, the airport departure, the showroom smash, and the one-time story choices), each with its note.
- **Filters** — by grade, by kind (story, mission, side, collectible, combat, exploration, misc), text search, earned/unearned, and a missable-only toggle.
- **Spoiler mode** — hides story trophies (name and description replaced with "Story trophy — hidden until earned") until they are earned.
- **Export / import progress** as JSON, and **deep-linking** via the URL hash (`#grade=silver`, `#kind=collectible`, `#q=text`, `#trophy=17`, `#spoilers=on`) so filtered views are shareable.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the entry into out/
node serve.ts                                          # local preview at http://localhost:8080
```

`main.ts` (Node 22+, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. The app itself is plain static files under `app/` — open `app/index.html` in a browser, or serve `app/` with any static server. It works fully offline and makes no network requests.

## Sources

Every trophy's name, description and grade comes from the official PlayStation 5 trophy list for Grand Theft Auto VI, published 2026-11-18 (as carried in the competition kit's reference data). Every guide is written in our own words from that official description — nothing is copied from PowerPyx, PlayStationTrophies.org, PSNProfiles, TrueTrophies, Exophase, any wiki, video or forum. Grand Theft Auto VI released 2026-11-19, so detailed community walkthroughs are still emerging: where an exact location or step is not pinned down by the official description, the guide says so plainly instead of inventing one. No Rockstar logo or official artwork appears anywhere here; every visual is original CSS drawn for this guide.

This is an unofficial, fan-made guide, not affiliated with or endorsed by Rockstar Games. MIT licensed — see [LICENSE](LICENSE).

<sub>Entered on [make.fun](https://make.fun/?ref=g2c1d6ze&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
