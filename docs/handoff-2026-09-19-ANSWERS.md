# Responses to open questions in Handoff — 2026-09-19
Read the handoff doc at `docs\handoff-2026-09-19.md`. Then read this document for answers to open questions and any additional/forgetten domain context.

## Question 1 - Condensed Packaging
Yes, it is 1 10-token pack per max-treasure run per person. 27 draws -> 10 condensed draws. The pack will stay at 10 with the increase to 30.

## Question 2 - Breakpoint bonus treasure
It's all the same pool. In fact, the only way to get to maximum treasure is to have a full 10 people with the synergistic tokens to get to the top level breakpoint.

## Question 3 Condensed conversion ratios
This one has two answers: conversion of treasure mix -> condensed and conversion of standard pack tokens -> trade goods

### Answer 1 - conversion of treasure mix -> condensed
The exact contents of the trade goods in the condensed treasure mix are not published. However, the community has a *hypothesis* that there is a 1:1 replacement of Rare and Uncommon tokens at the exact conversion rate of standard pack tokens -> trade goods (see following). 

### Answer 2 conversion of standard pack tokens -> trade goods
The conversion ratio for standard pack tokens -> trade goods is well known and fundamental to the crafting process. It's the foundation of how trade goods enter the system, either by players converting their treasure or the company pre-converting tokens in orders.

Note that 1,000 GP Bars (and above) follow a slighlty different process.

The conversion rations are as follows:
**Trade 1 goods**
25 points tokens that convert to a given good, with different rarity tokens providing different amounts of points:
* Common = 1 point
* Uncommon = 3 points
* Rare = 6 points
So 4 rare tokens and one common token that convert to Darkwood Plank = 25 points = 1 Darkwood plank.

Note that Dwarven Steel and Minotaur hide are *only* provided by Common tokens. As such, the community hypothesizes that they are not part of the condensed mix beyond the baseline from non-condensed pulls.

**Trade 2 goods** 
25 points of tokens that convert to a given good. A token always provides 1 point, regardless of rarity. Tokens of specific rarity convert to different types of goods:
* Uncommon "weapon" tokens -> Elven Bismuth
* Uncommon "armor" tokens -> Oil of Enchantment
* Rare "weapon" OR "armor" tokens -> Aragonite

**GP Bars**
GP bars (1,000 GP Gold bars; 5,000 GP Mithral Bars" 25,000 GP Eldritch Ore Bars) come from the equivalent value in common, uncommon, or rare GP items. These items have different denominations, depending on rarity. The below statements assume normal distribution on the standard sets of 40 tokens per rarity:
* Common: 50 GP, 1 per set of 40, totaling 50 GP for every full set of 40 tokens
* Uncommon: 100 or 150 GP, 2 per set of 40, averaging to 125 GP and totaling 250 GP for every full set of 40 tokens
* Rare: 500 GP, but sometimes other values (600/400, 550/450); 2 per set of 40; always totaling to 1,000 GP per full set of 40 tokens.

### Implications
The conversion of standard pack tokens -> trade goods has implications for hypotheses by the community. The treasure mix has *always* included trade goods in varying denominations (single Trade 1/Trade 2, 10x Trade 1, higher-value GP bars). That forms a *baseline* of trade goods that have *always* been in the mix. 

The community hypothesis is that condensed packs provide increased trade goods commensurate with the Uncommon/Rare tokens they replace, at similar rates

### 2027 Standard Pack Uncommon, Rare token conversion counts 
The following table lists the counts of Uncommon and Rare tokens that convert to each trade good. This is useful for establishing the "expected value" of the Rare and Uncommon tokens based on non-condensed data and assuming a perfectly normal distribution. (The company has implied the Uncommon and Rare tokens are evenly added and not biased.)
|Good                |Uncommon Count|Rare Count|
|--------------------|--------------|----------|
Alchemist's Ink      |2             |3         |
Alchemist's Parchment|3             |2         |
Aragonite            |0             |11        |
Darkwood Plank       |8             |8         |
Dwarven Steel        |0             |0         |
Elven Bismuth        |7             |0         |
Enhchanter's Munition|1             |1         |
Minotaur Hide        |0             |0         |
Mystic Silk          |7             |7         |
Oil of Enchantment   |7             |0         |
Philosopher's Stone  |3             |6         |

## 4. Granularity for the bulk categories
Counts, not itemized by name. Having to pick from 140 options (40 each Rare/Uncommon/Chase set A, 20 Chase set B) is a chore no one wants.

## 5. Previous-year Relics and Legendaries 
Just do "Previous-year Legendary" and "Previous-year Relic". The pools is so broad and the sample size is so small that there's no need to distinguish further.

## 6. Will players reliably report runs or total pulls?
Total pulls. That's the most reliable reporting. That will be aggregated pulls across multiple runs and sometimes multiple players. Total pulls is the most reliable indicator.

## tokendb slugs as token.external_slug
Yes, that's stable and acceptable

## Condensed at in person events
Currently not offered at in-person events. Virtual only, but could change in the future.

## Update to previous call/question: 10x trade good as 1 pull vs. 10
Given the above discussion on baseline vs. condensed pulls, it may now make sense to treat a 10x Trade 1 chip as 10 trade 1 pulls. While they are distinct items, in practice they amount to a very "lucky" pull to get an amount of trade goods way beyond what simple conversion of Rare/Uncommon tokens -> trade goods would provide. Help me figure out the best way to treat these, as they truly are a single item pulled from the treasure, but they represent multiples of another good. 

## Added context: Treasure includes trade goods in lieu of blind packs
Previously, the company used to include 1 blind pack per person per run. This caused a lot of extra shipping cost for the company, as did shipping packages to multiple people. 

To reduce shipping costs and incentivize shipping multiple orders to the same address, the company now provides a random trade good in lieu of the blind pack. These are packaged separately from the normal treasure pulls (condensed or non-condensed) and clearly marked. You have already noticed that there was a link on the Google Sheet to track this data.

Ther is also a stated 1/100 chance to receive an Ultra Rare instead of a trade good.

When designing the data model, we should account for these separate rewards. Players like to track those rewards as well. (This is a very data-driven community.) It does not need to be a feature of V1, but we should design with that build out in mind.