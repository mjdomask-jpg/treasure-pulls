# Data model review and updated assumptions

I've read through the data model document and I want to correct some assumptions before we get into the full project. I want to avoid mistakes of the past where providing incomplete or partial domain context led us down paths that we later needed to correct at greater cost. 

Read this additional context and use it to make suggestions/improvements to the data model. Ask questions where unclear. 

Let's make sure we get this right before we start to write any code.

## General principle - we are not beholden to the past

The Google Sheets document is decidedly **not** an authoritative model for data collection. Its provenance is an legacy maintainer who had to balance comprehensive collection against ease of use for a community with wildly varying familiarity with data entry and hygiene. This forced numerous trade offs, such as listing individual Relic-level items but combining all Legendary items into a single cell, or single entries for Trade 1 and Trade 2 when there are multiple items in each cateogry. It also biases towards player interests vs. strict canonical classification, such as 1,000 GP Gold Bar being separate from the Trade 2 entry, even though itself is in the Trade 2 category.

All this is understandable because no one wants a Google sheet with 50+ columns. 

Poor data hygiene is also inevitable with this many users. Simple solutions like protected cells either didn't go far enough or went too far, and maintainers lacked the skill for more advanced or user friendly data protection. A common mistake, for example, was people overwriting a SUM column with their own totals!

We should strive to make a system that works for the questions we want to answer, not recreate the mistakes of the past.

## Project goal

Why do we even bother to collect this data in the first place? It's mostly curiousity to answer one critical question:
**What is in the True Dungeon treasure pool?**

The contents, ratios and odds of the treasure pool are not publicly disclosed. Reverse engineering the contents of the pool gives insight into drop rates, odds of getting a specific rarity of token, estimated number of chase tokens in the wild, etc. To know any of that, we need to know the contents of the pool. 

Follow on goals include personal pulls stats, comparison to expected value/baseline, year over year comparisons, estimated human-readable odds (1 in 100, 1 in 500, 1 in 1000, etc.).

Moving towards a standardized vocabulary shared with the Auction site and the official game reference will also be a huge benefit. 

## Short term goal

Make a new, improved entry site for the 2027 set of events. Historical backfill is a long-term goal, but out of scope for V1. 

## How players receive and enter treasure pulls

As mentioned in the domain skill, True Dungeon is a game played in person at conventions and virtually via Zoom. Each play session (a "run") rewards players with a number of treasure pulls. This number is variable. The base number of pulls is 3. Players can equip tokens that provide bonus pulls, up to a current max of 27. For 2027 events, the max will raise to 30.

Because players may lend tokens to each other, an individual's treaure pulls may vary from session to session. So a player that gets 20 pulls in one run may get the full 27 in another. Additionally, some tokens provide additional treasure when multiple people all equip the same token when certain breakpoints are met (1-5, 6-9, 10). This is included so that it is clear that you cannot derive the number of runs a single person does by using a simple multiplier. 

For virtual events, players receive treasure for all their runs via USPS. It's common for a coordinated group or guild to list a single address so a guild leader/quatermaster receives all the treasure. This person generally enters all the pulls for the group. 

For in person events, players receive treasure immediately after each session, but often batch enter after the convention. Guilds again pool treasure and have the group leader enter it.

## General treasure pool contents

While the exact contents of the treasure pool are unknown, history demonstrates that it contains the following items:
* Uncommon, Rare and Ultra Rare tokens from the standard set
* Monster trophies specific to the year, treasure pool-exclusive tokens used in some low-tier transmutes and to make a specific trade good required for high-tier transmutes
* Chase tokens, specific to the year, which combine to make a season-specific Relic or Legendary; general quantities of 20 or 40 (with a test run of 6 in 2019)
* Trade goods, from Trade 1 - Trade 5. Trade 1 goods may appear in individual form or as single token worth 10 of a Trade 1 good. These are tracked as separate, single tokens, not x10 of the Trade 1. See https://tokendb.com/token/darkwood-plank/ and https://tokendb.com/token/10x-darkwood-planks/ for example.
* Transmuted tokens from the current year, from Enhanced - Legendary. This includes Arcanum and Ultra Rare transmutes, when available
* Relic and Legendary tokens from previous years
* Treasure pool exclusive rares (1-2 per year). These are often "surprise" tokens and not known until after players receive treasure from the first game of the year. 
* Additional treasure pulls in 3x or 10x quantities
* "Bonus" items from large token purchases - the 1k bonus, 2k bonus, preorder bonus

Uncommon, Rare, Monster trophy and chase tokens make up the majority of treasure by volume.

The previous system mixes many of these rough categories together. Where a guiding principle exists for ordering, it's based on *perceived value*, either in game or secondary market, with little regard to underlying canonical relationships. 

On rare occassions, a new token may enter the mix mid-year after a major game event, such as the annual Patron-only run or a special once every 3-4 year storyline capstone event.

Items **not** in the treasure pool include Mythic and Paragon transmutes. The Premium rarity 8k bonus has occasionally made an appearance as a very rare drop. 

## Condensed Treasure

Condensed is a new option, introduced in 2026, where players who receive **max** treasure (27 currently, 30 next year) can choose to receive treasure from a special mix that does not include Uncommon or Rare tokens. Instead, it substitutes Trade 1 and Trade 2 tokens at equivalent rates to their Uncommon or Rare source materials. Condensed packs are 10 tokens, so roughly a 3:1 conversion rate. 

Each year has fixed set of 40 rare tokens, 40 uncommon tokens, and 40 common tokens in the "standard" set. Of the 40 tokens in each rarity, a certain number convert to different Trade 1 goods. For example, 8 of the 40 Rare tokens may convert into Darkwood Plank. An example conversion ratio would be 4 Rare tokens that convert to Darkwood Plank == 1 darkwood plank. Uncommon tokens take twice as many (e.g., 8:1). 

The Condensed packs do that conversion for the player. What they lose in total number of tokens they gain in effiency by not having to send the Uncommon and Rare tokens back for conversion.

## Virtual Event Names

Virtual events have always had an "evocative" name (e.g., Mists of Madness) and a serial number (VTDXX), even in previous seasons. The only reason sheets in the old workbook used the numbers was ease of entry and ease of reference. In 2026, the company discountiued use of the serial number in favor of the evocative names only.

This is another example of where we should not take the workbook as authoritative.

## Answers to open questions

1. This is likely user entry error. 
2. `10x pull` is "a token granting 10 additional treasure pulls". "10x Trade Good" is shorthand for the family of 10x Trade 1 tokens.
3. See above about guilds and teams. It is common for one person to enter pulls for an entire team. Because the main goal of the project is to reverse engineer the treasure pool contents/drop rates, I don't think we need an `is_group` flag, as this just seems like extra homework for the guildmaster. Push back if this is something cheap to build now that can pay dividends in the future. 
4. Generally players enter data once per event with the sum total of runs they do. But as demonstrated, it's not uncommon for people to get a second set (e.g., from a guild member who had separate shipping) and just entering a second row rather than doing math on the delta for their first row. This may point to a need to recall and update previous pulls, as well as the shape of it (just enter the new stuff; don't make people do math).
5. These are some of the "suprise" tokens that came out after the first of the year, so they were inconsistently recorded. This is something to clean up in historical data.
6. History is out of scope for V1. It's something I want to do long term, but requires some maitenance as you discovered. 


