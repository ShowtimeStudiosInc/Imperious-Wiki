---
title: Making Things with Astrid
description: A step-by-step tutorial for building your approved character in Astrid, the server's combat bot, plus how to make moves and items.
sidebar:
  order: 2
---

Astrid is the server's combat bot. She runs battles and holds your characters, their moves, and their items.

This page is a full walkthrough. It takes you from an approved character sheet to a working character inside Astrid, one step at a time, and explains every word as it comes up. Keep your approved sheet open next to you. You will copy from it as you go.

If you have not submitted a character yet, start with [Templates](../../rules/templates/) and get your sheet approved first. Come back here after that.

## Words to know first

You will see these words on your sheet and in Astrid's commands. Here is what each one means.

### The six stats

Every character has six stats. They are numbers that say what your character can do in a battle. Your character does not know these numbers in the story. They are only for us, the players.

- **HP** is health. It is how much damage your character can take before they start to Flicker. At 0 HP a Gem Poofs and an Organic Collapses.
- **ATK** is physical strength. It is added to the damage of every weapon hit and every physical move. Weapons add to it.
- **DEF** is how well your character soaks physical hits. Every physical hit against them is cut by DEF divided by 4. Armor adds to it.
- **SPD** is quickness. It sets who acts first in a round, and every 4 SPD makes your character a little harder to hit.
- **INT** is how fast your character learns and notices things. Every magic hit against them is cut by INT divided by 4. INT never grows with level.
- **MAG** is how strong your character's magic is. It is added to the damage of SPELLs and sets how hard they are to resist.

### Gem-Type profile

A **Gem-Type profile** is the base version of a Gem's type: its starting stats and its built-in powers. Astrid already knows every profile. When you make a Gem, you only pick the type, and Astrid fills in the base stats and powers for you. You can read every profile in [Gem-Types](../../gem-types/).

### Modifier

A **modifier** is the Era or essence your Gem was made from. It is on your sheet as the Era. It changes the starting stats a little and gives your Gem a Special, a small extra power. Every Gem has exactly one. Astrid applies it for you when you pick it during creation. See [Modifiers](../../rules/modifiers/).

### Cut Quality

**Cut Quality** is how well your Gem was made: Standard, Perfect, or Defective. Most Gems are Standard, which changes nothing. Perfect and Defective change stats. Cut Quality is separate from the modifier and stacks on top of it. Only staff can add it in Astrid, so there is a step for that below.

### SP and the Star Gauge

**SP** is what moves cost to use in battle. SP is not stored on one character. Your whole party shares one SP pool.

The **Star Gauge** is a meter with 10 marks, also shared by your side. It fills as the battle goes on: at the start of rounds, on critical hits, on dodges, and when someone Defends. Every time it fills up, your party gains 5 SP. The pool can hold at most 9 SP.

### Powers, spells, moves, and SKILLs

These words sound alike, so here is the difference:

- **Powers and abilities** are the general words for what your character can do. They are listed on your sheet under Powers & Abilities.
- **Spells** are uses of a Gem's built-in powers. If your Gem-Type has a power, its spells come with the profile. Astrid already has them. You use them with `/act` in battle.
- **Moves** are abilities you make yourself in Astrid with `/addmove`. If your approved sheet has a power that is not part of the Gem-Type profile, you build it as a move.
- **SKILLs** are things your character learned, like Swordsmanship or Acrobatics. They are not powers from the gemstone. Staff record them for you, and you use them with `/skill` in battle. See [SKILLs](../../rules/skills/).

### Level and EXP

New characters start at **Level 1** with **0 EXP**, even if they are very old in the story. Winning battles earns EXP, and EXP raises the level. Astrid tracks both for you.

## Step 1: Make the character

This step creates your character inside Astrid. The commands are typed in Discord. Most options fill in as you type, so start typing and pick from the list.

### If your character is a Gem

Use `/createcharacter gem`. It asks for:

- **name**: copy the Name from your sheet.
- **gem_type**: copy the Gem Type from your sheet. This one pick sets the base stats and the built-in powers.
- **modifier**: copy the Era from your sheet. Leave it off only if your sheet says Standard. Astrid applies the stat changes and the Special for you.
- **driving_emotion**: only Era 2A Gems need this. It is the emotion that drives your Gem. If your sheet does not name one, pick the emotion that fits them best.
- **level**: leave this off. New characters start at Level 1.

Example. Say your approved sheet is for a Ruby, Era 2A, whose driving emotion is hope:

```
/createcharacter gem name:Ruby gem_type:RUBY modifier:"Era 2A" driving_emotion:hope
```

That is all it takes. Astrid builds the stats from the Ruby profile plus the Era 2A modifier, the same math shown on your sheet.

### If your character is an Organic

Use `/createcharacter organic`. Organics have no Gem-Type profile, so you type the stats in yourself. Copy them from your sheet:

```
/createcharacter organic name:John hp:28 atk:4 def:4 spd:5 int:5 mag:0
```

HP can be at most 20 plus twice the DEF. If your sheet's HP is higher than that, ask staff before you continue. Leave **level** off, same as Gems.

### Check the character card

Now look at what Astrid made:

```
/viewcharacter character:YourName
```

Compare every number on the card to your sheet, one by one. Two things can make a number look wrong at this point, and both are normal:

1. **Cut Quality is not added yet.** If your sheet says Perfect or Defective, the card will not match until staff add it in Step 2.
2. **The wrong modifier was picked.** If the numbers are off by a little in several places, the Era was probably picked wrong. Ask staff for help fixing it.

If one single stat is wrong, you can fix it yourself with `/updatecharacter`, which changes one stat to a new value. Use this only to match your approved sheet, not to change your character.

Two optional details:

- `/editcharacter height` sets your character's height in centimeters. Copy it from Natural Height on your sheet if you want it recorded.
- If an Era 2A Gem was made without a driving emotion, `/editcharacter emotion` adds one. You only get to choose it once, so pick well.

In battle, an Era 2A Gem can stir their emotion with `/emotion`, once per battle. They become Charged for 3 turns: their attacks and SPELLs deal 3 more damage, and they cannot Defend.

## Step 2: Ask staff for the parts only they can add

Some parts of your sheet can only be added by staff. Send staff a message with your character's name and ask for these, as needed:

- **Cut Quality.** If your sheet says Perfect or Defective, staff run `/setcutquality` for you. Perfect Gem adds +2 HP, +1 ATK, and +1 MAG. Perfect Polish, for Metals, adds +2 HP, +1 ATK, and +1 DEF. Defective takes 1 off two stats, which are named on your sheet. Standard needs nothing.
- **SKILLs.** For each learned SKILL and Expertise on your sheet, staff run `/setskill`. After that, `/skills` shows what your character has learned and which skill moves are open to them.
- **Signature Ability.** If your Gem-Type has a Signature Ability and Astrid needs to know which built-in ACT it is, staff set that with `/editcharacter`.

When staff say they are done, run `/viewcharacter` again. Now every number should match your sheet.

## Step 3: Give them their powers

Your sheet lists Powers & Abilities. They reach Astrid in two ways.

### Powers that come with the Gem-Type

If a power on your sheet comes from your Gem-Type profile, it is already in Astrid. You do not need to make it. In battle, `/act` lists everything your character can use, including these. The same goes for your modifier's Special.

### Powers you make yourself

If your approved sheet has a power that is not part of the Gem-Type profile, you build it with `/addmove`. Make one move for each such power. It asks for:

- **character**: your character's name.
- **movename**: copy the power's name from your sheet.
- **spcost**: copy the SP cost from your sheet. If your sheet has no cost written, use this guide: 1 SP is a small effect, 2 to 3 is useful, 4 to 5 is a strong group effect, and 6 or more is the most powerful. Costs run from 0 to 9.
- **castline**: the line Astrid shows when the move is used. Write it the way your sheet describes the power, in your character's style.
- **effect**: pick the one kind that matches what the power does:
  - **Damage**: the power hurts someone. Then pick a **damage_style**: Balanced or Heavy, Physical (uses ATK) or Magic (uses MAG). Physical fits powers that hit, cut, or push. Magic fits powers that burn, freeze, or blast. You do not need to write any math. Astrid works out the damage from the style.
  - **Heal**: the power fixes someone. Set **heal_percent** to how much of their max HP it restores (1 to 100). Healing can bring back a Poofed or Collapsed ally.
  - **Apply a status**: the power does not hurt directly, it leaves a condition like poison or stun. Set **debuff_type** (the condition, like `poison`, `burn`, or `stunned`) and **debuff_duration** (how many turns it lasts, 1 to 10). The target gets a chance to resist.
  - **Boost an ally stat**: the power makes an ally stronger for a short time. Pick **boost_stat**, **boost_amount** (1 or 2), and **boost_duration** (2 or 3 turns).
- **targets_all**: turn this on if the power hits or helps the whole group instead of one target.

A damage move can also leave a status. To do that, set both **debuff_type** and **debuff_duration** on the damage move.

### Try it before you save it

`/addmove` has a **mode** option:

- `mode:Preview only` shows the finished move without saving it. Use this first, every time. Read it over and check it against your sheet.
- `mode:Submit for staff review` sends the move to staff instead of saving it. Use this if you are not sure about the cost or the effect. Check on it later with `/abilityrequests`.
- Leaving **mode** off saves the move right away.

One honest limit: Astrid can only run the kinds of effects listed above on her own. If your approved power does something special that is not one of those kinds, Astrid cannot run that part by itself. The move can still be made, and whoever runs the battle handles the special part. Ask staff if you are not sure.

Type `/abilityguide` in Discord any time for a short version of this step.

## Step 4: Give them their gear and items

Your sheet can list up to two weapons, one armor, and two accessories. Gear reaches Astrid through requests, because staff check each piece.

### Requesting gear

Send one request per piece on your sheet:

```
/requestweapon character:Ruby name:Fire Sword abbreviated_name:FS type:slash description:A blazing blade
/requestarmor character:Ruby armorname:Steel Plate abbreviation:SP description:Heavy armor
```

There are also `/requestaccessory`, `/requestconsumable`, and `/requestmisc`. Copy the name and description from your sheet. Staff look at each request with `/reviewitem` and approve or deny it, so check back after you send one. Approved gear goes into Astrid's item list, ready to equip.

### Wearing gear

- `/equip character:Ruby item:Fire Sword slot:weapon` puts a piece on. The slots are Weapon, Off-hand Weapon, Armor, and Accessory.
- `/viewequipment character:Ruby` shows what is worn.
- `/unequip character:Ruby slot:weapon` takes a piece off.

Weapons set how your character hits and how much damage a FIGHT does. Armor and accessories add their listed bonuses to your stats.

### Consumables

Consumables are one-use items like potions and snacks. Simple ones you can make yourself, right away, with `/inventory add`. You can give one healing, SP restore, or a short stat boost. Healing dice come in three sizes: 2d4 (small), 2d8 (standard), and 4d8 (rare).

Use `/inventory` to see what a character is carrying. Each character can only carry so much: Organics hold 5 item units and Gems hold 10. Stacks count toward the limit. A bag accessory adds more room, and Pearls and characters with the Hammerspace passive have no limit.

In battle, `/item` uses a consumable. Each character can use one item per round, and items do not cost SP.

## Step 5: Check everything works

Before your first battle, go through this list with your sheet open:

1. `/viewcharacter` and compare every stat to your sheet.
2. `/skills` and check your learned SKILLs are there.
3. `/viewequipment` and check your gear is worn.
4. `/inventory` and check your items.
5. If you can, join a test battle or ask staff to start one, and type `/act` to see your full move list. Every power on your sheet should be in it.

If something is missing, it is almost always one of these:

- A staff step from Step 2 is not done yet.
- A name is spelled differently from your sheet. Astrid needs the name to match exactly.
- A move or item request is still waiting for staff review.

## Making more things later

Once your character is set up, the same commands cover everything else:

- **New powers** your character learns later: `/addmove`, same as Step 3.
- **New gear**: the request commands from Step 4.
- **New consumables**: `/inventory add`, or `/requestconsumable` if it needs approval.

Staff make the rest. Ask staff if you need one of these:

- **Enemies** for battles, with `/createenemy` and `/addenemyact`.
- **Fusions**, with `/createfusion`. A fusion can have its own move on top of the moves it borrows from its parts. See [Fusion](../../rules/fusion/).
- **Custom damage types**, with `/adddamagetype`, for moves that need their own math.

## Quick tips

- Type `/guide` in Discord for Astrid's own step-by-step help, and `/help` for the full command list.
- Most command options fill in as you type, so start typing and pick from the list.
- If a command does not work, check the spelling of the character's name first. Astrid needs the name to match.
- When in doubt, preview. `/addmove mode:Preview only` shows a move without saving it, and staff review is there for anything you are unsure about.
