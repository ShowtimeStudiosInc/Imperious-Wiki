---
title: Items
description: Equipment slots, how a FIGHT rolls, every weapon type, shields, armor, and consumables.
sidebar:
  order: 3
---

<span class="ia-label">Rules · out of character</span>

Items are the things a character can carry, equip, or use. They're how characters fight, heal, and protect themselves. An item only needs an item card submitted if it has special effects or is used in combat. The item card templates are on the [Templates](../templates/#items) page.

## Item types

| Type | What it is |
| --- | --- |
| **Weapon** | Used to FIGHT. Adds to ATK and decides how a FIGHT rolls. |
| **Shield** | Goes in a weapon slot. Adds to DEF and makes Defend stronger. |
| **Armor** | Worn on the body. Adds to DEF, and sometimes other stats. |
| **Accessory** | Smaller worn items like badges, visors, or rings. Gives small bonuses or effects. |
| **Consumable** | Used up when used. Heals HP, restores SP, cures statuses, or gives a short boost. |
| **Selling Ware** | Can't be used well, but is worth a lot to the right buyer. |
| **Key Item** | Has a specific use in the story. Can also be any type above, like a Key Weapon. Staff only. |
| **Magic Item** | Any type above, with magic properties no ordinary item has. |
| **Signature Item / One of a Kind** | Tied to one owner, or the only one of its kind. Most official items fall here. |

## Equipment slots

Every character has:

- **2 Weapon slots**
- **1 Armor slot**
- **2 Accessory slots**

Equipping or switching an item uses your turn, unless an ability says otherwise. Fighting with a weapon in each hand needs the **Ambidexterity** SKILL. Without a weapon, a character fights unarmed, using the Punch type with no weapon ATK.

## How a FIGHT rolls

1. **Roll to hit.** Roll 1d20. You need to meet or beat your weapon's **Hit Number**, plus the target's SPD ÷ 4 (rounded down). The number needed can never go above 18. A natural 20 always hits, and a natural 1 always misses.
2. **Count the hits.** Your weapon hits its **Hit Count** number of times. Every weapon has one fixed Hit Count, picked from its type's **Hits** range when the weapon is made. A Ranged weapon could have a Hit Count of 2, 4 or 6, but whatever it has, it hits that many times on every FIGHT. Crits never add hits. They make each hit deal more damage instead.
3. **Roll damage.** Roll the weapon's damage die once for each hit, then add your ATK (your own plus your weapon's) **once** to the total.
4. **The target soaks it.** Each hit that lands is reduced by the target's DEF ÷ 4 (rounded down), but always deals at least 1 damage.

Reaching your weapon's Crit Number counts as a **critical hit**, which adds a mark to the Star Gauge.

:::note[Example]
A Ruby (ATK 10) swings a Slash weapon (+1 ATK) at a Pearl (SPD 5, DEF 3). Slash needs a 7, plus 1 for the Pearl's SPD, so the Ruby needs an 8. She rolls 11 and hits. She rolls 1d8 for 5, adds her ATK of 11, and deals 16. The Pearl's DEF of 3 soaks 0, so she takes all 16.
:::

## Weapon types

| Type | Examples | Hits | Damage | Hit No. | Crit No. |
| --- | --- | --- | --- | --- | --- |
| **Slash** | Swords, greatswords, heavier blades | 1 | 1d8 per hit | 7 | 16 |
| **Quickslash** | Daggers, katanas, rapiers, light blades | 1 to 2 | 1d6 per hit | 6 | 15 |
| **Punch** | Fists, gloves, knuckles, unarmed | 3 to 4 | 1d4 per hit | 5 | 15 |
| **Blunt** | Bats, clubs, books, blunt objects | 1 to 4 | 1d10 per hit | 8 | 20 |
| **Metal-Blunt** | Frying pans, hammers, empty guns, heavy metal objects | 4 | 1d6 per hit | 11 | 20 |
| **Ranged** | Guns, bows, anything that strikes from a distance | 2 to 6 | 1d6 per hit | 12 | 17 |
| **Shield** | Shields of any kind | 1 | 1d4 per hit | 4 | None, shields can't crit |

The **Hits** column is the range a weapon's Hit Count can be picked from. A weapon only ever has one number from it.

**Crits:** meeting or beating your weapon's Crit Number makes every hit of that FIGHT stronger. Roll each hit's damage die twice and add them together. The number of hits doesn't change.

Ranged is the only type that can hit a target who is **Far**. Every other type can only hit targets who are **Near**.

What each type is good at, in short: Slash is one clean, reliable hit. Quickslash is easy to land, with one cut or two. Punch is many small hits, which high DEF wears down. Blunt hits hard, anywhere from one big swing to a flurry of four. Metal-Blunt is hard to land and brutal when it does. Ranged trades damage for reach.

### Weapon ATK

Weapons add to the wielder's ATK for FIGHTs. Most weapons give **+1 to +3 ATK**. Signature and One of a Kind weapons can go higher.

## Shields and Defend

When a character Defends, they take half damage from every hit until their next turn. Shields go in a weapon slot. They're poor weapons but strong protection.

- **Defend with a shield:** damage is reduced by three quarters instead of half.
- **Stale:** Defending with a shield two turns in a row only halves damage on the second turn. Go one turn without Defending to reset it.

## Armor and accessories

Armor adds DEF, usually **+1 to +4**. Some armor and most accessories give a small extra effect instead, like a stat bonus or a short ability. Strong effects are only found in specific places in the story.

### Weight (optional)

Heavy weapons and armor can list a Weight. If your base ATK is lower than the Weight, your FIGHTs have disadvantage while it's equipped.

## Consumables

A character can use one item per round. Items never cost Star Points.

| Kind | Effect |
| --- | --- |
| **Healing** | Small items heal about 2d4, standard ones 2d8, rare ones 4d8. Healing a Poofed character above 0 HP reforms them right away. |
| **Star Points** | Adds 1 to 3 SP to the party. The party still can't hold more than 9 SP. |
| **Cures** | Removes one status, like Frightened or Asleep. |
| **Boosts** | A small stat boost, usually +2 to one stat for 2 or 3 turns. |

## Extra effects

Any item can have an Extra Effect: a special move or passive tied to the item. Active Extra Effects list their SP cost, priced the same way as SKILL moves. The [SP Cost Checker](../skills/#sp-cost-checker) adds it up for you.
