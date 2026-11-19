# Imperious Authorities Wiki

The rulebook and setting wiki for the Imperious Authorities roleplay, built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build) and hosted free on GitHub Pages.

## What's in here

| Path | What it is |
| --- | --- |
| `src/data/gem-types/*.yml` | **One file per Gem-Type.** This is the source of truth. Every page, catalog, and `gem-types.json` is built from these. |
| `src/data/extras.yml` | Rank 2 sides, heights, fusion halves, and threat classes that the rank posts don't hold in a fixed place. Only used by the importer. |
| `raw/*.md` | The Discord rank posts the data was first imported from. |
| `scripts/gemstones.py` | Builds a flat gemstone vector for every type into `public/images/gemstones/`. Fusions are made from their two halves. Edit a type's cut or color in its `GEMS` line and re-run. |
| `scripts/import-rank-docs.mjs` | Turns the raw posts into YAML files (`npm run import`). |
| `src/pages/gem-types/` | The pyramid landing page, the tier catalogs, the filterable catalog, and the codex entry pages. |
| `src/content/docs/` | Starlight pages for Start Here, Rules, and Lore. |
| `public/admin/` | The Decap CMS editor at `/admin`. |
| `.github/workflows/deploy.yml` | Builds and publishes the site on every push to `main`. |

## Pages

- `/gem-types/` is the pyramid. Every element but the search bar follows the mouse, and phones get a slow float instead.
- `/gem-types/tier/<tier>/` lists one tier (transcendent, aristocrats, authoritatives, militia, service-trade, servants, lost, rogues, united-frontier) with High/Median/Low tabs.
- `/gem-types/all/` is the full catalog. Filters live in the URL, so `/gem-types/all/?kind=fusion&rank=3.2` can be pasted in Discord. Every tag chip on an entry page links here.
- `/gem-types/<slug>/` is a codex entry: name bar with tag chips, art, Role, Abilities, Description, Base Stats, Interactions, Related, and the footer buttons.
- `/gem-types.json` is every Gem-Type as JSON for the Gem Builder or a Discord bot.

## Editing a Gem-Type

1. **In the editor:** go to `/admin`, log in with GitHub, pick the Gem-Type, edit the form, and save. With the editorial workflow on, the change waits as a draft until the owner publishes it.
2. **On GitHub:** open the `.yml` file in `src/data/gem-types`, press the pencil, edit, and commit.

Either way, the site rebuilds in a minute or two.

> **Important:** once people start editing the YAML files, don't run `npm run import` again. It rebuilds every YAML file from `raw/` and would undo those edits. The importer was for the first move off Discord.

### Tags

Tags come from the data, not from the name. The name stays plain (`Sardonyx`), and the chips under it come from these fields: `rank`, `side`, `era`, `kind` (+ `parent` or `components`), `species`, `faction`, `status`, `traits`, `court`, `threatClass`.

## Update log (commit titles)

The commit history is the wiki's update log, so every commit title follows one format, with the place written as a Markdown link that names it:

```
<Content> was updated at [<Place name>](<live link>)
```

For example: `Alpha Black Diamond was updated at [Know Your Diamond](https://showtimestudiosinc.github.io/Imperious-Wiki/diamonds/alpha-black/)`

- The place name is the page or section as readers know it (Know Your Diamond, Gem-Types, Rules: Battles, and so on). Never show the bare URL.
- If one change touches several places, put the main one in the title and list each of the others on its own line in the same format in the commit body.
- If a change has no page of its own (styles, scripts), name the page where it shows up.
- Keep it to what changed. No extra summary in the title.

## Posting updates to Discord

After each deploy, `scripts/announce-updates.py` posts every update log line from that push to a Discord channel, as clickable links. Lines that aren't in the update log format are skipped. To turn it on:

1. In Discord, open the channel's settings, then **Integrations > Webhooks > New Webhook**, and copy its URL.
2. In GitHub, open the repo's **Settings > Secrets and variables > Actions > New repository secret**. Name it `DISCORD_WEBHOOK_URL` and paste the URL.

With no secret set, the step does nothing.

## Running it on your computer

```bash
npm install
npm run dev      # live preview at http://localhost:4321
npm run build    # builds the site into dist/
```

## Going live on GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The site appears at `https://<owner>.github.io/<repo>/`.

For a custom domain, set `SITE` to the domain and `BASE` to `/` in the workflow, and add the domain under Settings → Pages.

## Turning on the editor (`/admin`)

Decap needs a small OAuth helper so you can log in with GitHub. The simplest free option is a Cloudflare Worker such as [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) or [decap-proxy](https://github.com/sterlingwes/decap-proxy). Deploy one, create a GitHub OAuth App that points to it, then set `base_url` in `public/admin/config.yml`. Only the owner uses the editor, so no one else needs write access to the repo.

## Hooking up the Gem Builder

The Gem Builder can load `https://<owner>.github.io/<repo>/gem-types.json` instead of its own list. Each entry has `slug`, `displayName`, `rank`, `stats`, and `abilities`. The "Open in Gem Builder" button on each entry links to `?type=<slug>`, so the builder can preselect it once it reads that parameter.
