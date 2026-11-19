/**
 * Diamonds, Rank 1.1, Know Your Diamond.
 *
 * Page text lives in src/data/diamond-pages/<slug>.json and the theme in
 * src/diamond-pages/themes/<slug>.html (see src/pages/diamonds/[slug].astro).
 * This file holds the data the Know Your Diamond index uses (name, art,
 * domains, court, height) plus the older structured profile.
 * Add a Diamond by adding one entry here and their art at
 * public/images/diamonds/<slug>.webp (or .svg for a vector trace). Only Diamonds with a submitted
 * and approved profile go in this list. The rest are listed on the
 * Diamonds index as forthcoming, with no page and no invented details.
 *
 * Writing rules for Diamond pages: simple, everyday English.
 * No em-dashes. Never use: hums, hushed, echo/echoes, calculated,
 * strict, flawless precision, grounded/grounding. No AI filler.
 *
 * Status names in spell text use [[Name]] tokens, rendered with the
 * local status icon from public/images/statuses/.
 */

export interface DiamondSpell {
  name: string;
  cost: number;
  kind: 'mobility' | 'offensive' | 'debuff' | 'buff' | 'utility' | 'defensive';
  text: string;
}

export interface DiamondAbility {
  name: string;
  parent: string;
  complexity: string;
  origin: string;
  level: string;
  description: string;
  passives: { name: string; text: string }[];
  spells: DiamondSpell[];
  statChanges: string;
  weaknesses: string;
}

export interface DiamondTheme {
  /** Page background. */
  bg: string;
  /** Deep background glow. */
  glow: string;
  /** Main accent, used for bars, chips and headings. */
  accent: string;
  /** Second accent, used for gold or bright details. */
  accent2: string;
  /** Show floating meteor rocks behind the page. */
  meteors: boolean;
  /** Show floating Saturn rings behind the page. */
  rings?: boolean;
  /** Show floating energy orbs and stars behind the page. */
  orbs?: boolean;
  /** Show floating clock gears behind the page. */
  gears?: boolean;
  /** Design note for the background. Not shown on the page. */
  backgroundLabel: string;
}

export interface Diamond {
  slug: string;
  name: string;
  pronouns: string;
  height: string;
  color: string;
  /** Only set when the submission names a Pillar, like Alpha Black's Space. */
  pillar?: string;
  domains: string[];
  subDomains: string[];
  court: string;
  personality: string;
  purpose: string;
  powers: { name: string; level: string }[];
  weaknesses: string;
  quote: string;
  art: string;
  /** Caption under the hero art, for reference art rather than a portrait. */
  artCaption?: string;
  /** Extra design references, shown in a gallery on the page. */
  references?: { label: string; image: string; caption: string }[];
  theme: DiamondTheme;
  abilities: DiamondAbility[];
  /** Art and design credits, shown in an Art Credits box. Only list what Oliver has confirmed. */
  credits?: { label: string; name: string }[];
  /** Deity Diamonds (the four who emerged on their own) or Ruling Diamonds (made since). */
  group: 'deity' | 'ruling';
  /** Short status tag on the index, like "Absorbed". */
  status?: string;
  /** The page only has what's known so far; the rest comes with the submission. */
  partial?: boolean;
  updated: string;
}

export const DIAMONDS: Diamond[] = [
  {
    slug: 'alpha-black',
    group: 'deity',
    name: 'Alpha Black Diamond',
    pronouns: 'She/Her/Hers',
    height: "166'2\"",
    color: 'Black',
    pillar: 'Space',
    domains: ['Darkness', 'Knowledge'],
    subDomains: [
      'The Underworld',
      'The Void',
      'Eclipses',
      'Concealment',
      'Fear',
      'Memory',
      'Madness',
      'History',
      'Language',
    ],
    court: 'Alpha',
    personality:
      'Alpha Black is kind, and she treats the Gems close to her like her own children. Not many get that close, though. She keeps herself hidden behind a veil of darkness and only lifts it in her own rooms, for Gems she trusts. With everyone else, she is quiet and hard to read. As head of the Agency, she expects the Gems who report to her to stay loyal and keep what they learn to themselves, so even old friends tend to be careful with what they say around her. Theta Gold and Epsilon Blue are the two she respects most and sees as her equals, and together the three of them are worshipped as the deities of Homeworld, since they founded the Gempire and made the first of its Gems.',
    purpose:
      "Alpha Black runs the Agency, the empire's intelligence network. Its spies, informants, and counter-intelligence teams work across every court and colony, and what they learn comes back to her. Her job is to catch threats while they are still small, and to make sure the reports that reach the top have not been changed along the way. She also keeps the other Diamonds informed and protected, so they can rule in the open while she stays out of sight. Very little of importance happens in the empire without her hearing about it.",
    powers: [
      { name: 'Absolute Darkness Manipulation', level: 'Mastered' },
      { name: 'Absolute Memory Manipulation', level: 'Standard' },
    ],
    weaknesses:
      "For all that she is worshipped as a deity, Alpha Black has one clear weakness: her daughters. They are the one subject that can bring out her wrath. When they are in danger, she stops being careful, and anyone who knows that knows exactly how to get her to act without thinking.",
    quote:
      'You will never see most of what I do for you. And that is alright, for we die in the dark so you may live in the light.',
    art: '/images/diamonds/alpha-black.webp',
    theme: {
      bg: '#050310',
      glow: '#1b2a6b',
      accent: '#7fa8ff',
      accent2: '#e8c46a',
      meteors: true,
      backgroundLabel: 'Pillar of Space: a starfield with meteor rocks that drift as you scroll and move',
    },
    abilities: [
      {
        name: 'Absolute Darkness Manipulation',
        parent: 'Umbrakinesis',
        complexity: 'Complex',
        origin: "Alpha Black Diamond's Domain of Darkness and Pillar of Space",
        level: 'Mastered',
        description:
          'Alpha Black can summon her aura as darkness anywhere on the same planet as her, and shape it however she likes: flat shadows, or solid shapes, objects, and creatures that can touch the world. Her shadows act as her eyes, ears, and mouth away from her body, and by bending the light around them she can make illusions. The veil that hangs from her ring is her darkness too. Outside of battle, The Tree is her most common sentence, sized to the offense, from a small one for a set term up to one whose roots never let go.',
        passives: [
          {
            name: 'Suppression Aura',
            text: "While Alpha Black is on the battlefield, her aura presses down on the enemy side. The enemy party's Star Gauge only gains its start-of-round marks, the same as fighting in a dark area. This works on anyone, including the Deity Diamonds.",
          },
          {
            name: 'Darkness',
            text: 'Each spell from this ability that lands adds 1 [[Darkness]] to the battlefield, and Ekleipsis adds 2. [[Darkness]] caps at 5, and fades when the battle ends.',
          },
          {
            name: 'The Tree',
            text: 'When an enemy would go from [[Flickering]] to [[Poofed]], they are [[Mangled]] instead.',
          },
        ],
        spells: [
          {
            name: 'Skia',
            cost: 2,
            kind: 'mobility',
            text: 'Alpha Black or one ally steps into a shadow and out of another, moving to Near, Far, or Behind.',
          },
          {
            name: 'Phantasma',
            cost: 2,
            kind: 'debuff',
            text: 'Alpha Black bends the light around one enemy and fills their view with illusions. Their next attack is made with disadvantage.',
          },
          {
            name: 'Eidolon',
            cost: 3,
            kind: 'offensive',
            text: 'Alpha Black shapes her darkness into solid creatures that strike up to 3 enemies who are Near, each taking [2d4 + MAG] DARK damage.',
          },
          {
            name: 'Desmos',
            cost: 3,
            kind: 'debuff',
            text: "Alpha Black presses her aura down on one target. The target resists with INT. If they fail, they can't use SPELLs or SKILLs for 2 turns. This has no effect on the Deity Diamonds.",
          },
          {
            name: 'Phobos',
            cost: 4,
            kind: 'debuff',
            text: "Alpha Black lets her aura close in on every enemy who is Near. Each resists with INT. Those who fail are [[Frightened]] for 2 turns: they can't move Near her, and their attacks against her are made with disadvantage.",
          },
          {
            name: 'Tartarus',
            cost: 4,
            kind: 'debuff',
            text: "Alpha Black's darkness hardens around one target, sealing them away to be questioned later. The target resists with DEF. If they fail, they're [[Stuck]] for 3 turns, so they can't change position, and the darkness cuts them off completely: they can't target anyone, and no one can target them.",
          },
          {
            name: 'Chaos',
            cost: 4,
            kind: 'offensive',
            text: 'The darkness around one target opens into empty, freezing space, dealing [3d6 + MAG] COLD damage.',
          },
          {
            name: 'Ekleipsis',
            cost: 5,
            kind: 'debuff',
            text: 'Alpha Black blots out every light on the battlefield. Every enemy resists with INT. Those who fail are [[Blinded]] for 2 turns, and their attacks are made with disadvantage. This adds 2 [[Darkness]] instead of 1.',
          },
          {
            name: 'Nyx',
            cost: 7,
            kind: 'debuff',
            text: "Requires 5 [[Darkness]], and uses all of it. For 2 turns, the enemy side of the field falls into total darkness. Every enemy is [[Blinded]] with no resist, so their attacks are made with disadvantage, and the enemy party's Star Gauge gains nothing at all.",
          },
        ],
        statChanges: 'None',
        weaknesses:
          "Her darkness can't reach past the planet she is on. Strong light works against it: each Fire or Light attack that lands on her side of the field removes 1 [[Darkness]]. And she never fights at full strength. Part of her is always occupied with something she will not explain.",
      },
      {
        name: 'Absolute Mnemokinesis',
        parent: 'Mnemokinesis',
        complexity: 'Complex',
        origin: "Alpha Black Diamond's Domain of Knowledge",
        level: 'Standard',
        description:
          'Alpha Black can draw the memories out of anyone she or her darkness touches, and keep them as holo-records. Done by her own hand, the effect is much stronger, and painful for anyone but a Diamond. She remembers every name she has ever heard, and every language she has ever heard spoken.',
        passives: [
          {
            name: 'Sensory Scrying',
            text: 'As the mother of the Era 0 and Era 1 Gems, Alpha Black can see and hear through any of them, and speak through them, though she rarely does.',
          },
          {
            name: 'Records',
            text: 'Each time Mnemosyne or Anamnesis lands on a target, Alpha Black gains 1 Record on them, up to 3. Each Record gives that target -1 on every resist roll against her. Records last until the battle ends.',
          },
        ],
        spells: [
          {
            name: 'Mania',
            cost: 2,
            kind: 'debuff',
            text: "Alpha Black loosens one target's grip on what's real. The target resists with INT. If they fail, they're [[Confused]] for 1 turn, and their next attack or spell hits a random target, ally or enemy.",
          },
          {
            name: 'Anamnesis',
            cost: 3,
            kind: 'utility',
            text: 'Alpha Black reads one target in a moment: their stats, their abilities, and what they mean to do next. On the next turn, her allies have advantage against them.',
          },
          {
            name: 'Mnemosyne',
            cost: 3,
            kind: 'offensive',
            text: 'Alpha Black grips one target and pulls at their memories. The target resists with INT. If they fail, they take [2d6 + MAG] PSYCHIC damage, and she learns their stats and abilities.',
          },
          {
            name: 'Mneme',
            cost: 3,
            kind: 'buff',
            text: 'Alpha Black reminds one ally of their best moment. Their next 2 rolls are made with advantage.',
          },
          {
            name: 'Onoma',
            cost: 2,
            kind: 'debuff',
            text: "Requires 1 Record on the target. Alpha Black speaks their true name. The target resists with INT. If they fail, they're [[Stuck]] for 2 turns, so they can't change position, and they can't use Reactions.",
          },
          {
            name: 'Opsis',
            cost: 4,
            kind: 'buff',
            text: "Alpha Black lets her allies see through each other's eyes. For 3 turns, her party can't be [[Blinded]] or ambushed.",
          },
          {
            name: 'Amnesia',
            cost: 4,
            kind: 'debuff',
            text: 'Requires 3 Records on the target. Alpha Black takes everything they know about the fight. They lose their next 2 turns, with no resist.',
          },
        ],
        statChanges: 'None',
        weaknesses:
          "Her strongest Memory spells need Records first, so they're slow to get going. They're mind spells too, so anyone with a high INT is hard to reach. And drawing out memories needs contact.",
      },
    ],
    credits: [{ label: 'Design', name: 'Liyuu (Fiverr)' }],
    updated: '2026-11-18',
  },
  {
    slug: 'saturn-light',
    group: 'ruling',
    name: 'Saturn Light Diamond',
    pronouns: 'He/him',
    height: "30'0\"",
    color: 'Brown',
    domains: ['Vitality', 'Force'],
    subDomains: ['Health', 'Revelry', 'Endurance', 'Strength', 'Motion', 'Impact'],
    court: 'Saturn',
    personality:
      'Saturn Light is the sweet summer child who stands at the bottom of the Diamond pyramid. He views the world in a playful light, almost the same way a Spinel does. He does not take things as seriously as he should, and he believes that bringing people together is the easiest way to resolve a conflict, whether that is by force or not. He is by far the laziest Diamond, always choosing to hang out at his club instead of doing important paperwork. Saturn is also kind of naive. He is aware of the way certain Gems get treated, and he is highly against how some servant Gems get treated, but at the same time he will turn a blind eye to it, because at the end of the day, is it really a problem he has to deal with? Those Gems do not belong to him personally, so he sees no reason to bother interfering. Saturn is not the type to easily show mercy to his court. Well, he is. He sees those in his court as his children. But if a Gem does something that goes against Saturn, or is simply really bad, the Gem will be shattered. No questions asked.',
    purpose:
      'Saturn has a bunch of jobs. He is in charge of organizing events between the other Diamonds and for the entire Gempire, overseeing the production and distribution of Pearls, Spinels, and other servant Gems, and scouting out new potential planets for colonization and overseeing terraformer Gems. Some of these tasks he takes more seriously than others. Organizing events and meetings is one he takes incredibly great pride in. Some might even say no one has ever thrown a better party than Saturn Light himself. As for his other two tasks, Saturn normally leaves finding suitable planets up to his Pearl, as he finds it extremely boring. He does like overseeing servants and terraformers, though.',
    powers: [
      { name: 'Absolute Restoration', level: 'Mastered' },
      { name: 'Absolute Psychokinesis', level: 'Mastered' },
    ],
    weaknesses:
      'Saturn\'s greatest weakness would either be himself, because one day he will be his own greatest downfall. The way he does things is not the same way everyone else does their job. As a Diamond he should be respected and disciplined, because who would want to listen to a Diamond who slacks off all day?',
    quote: 'Whatever life throws at you, duck and let it hit someone else.',
    art: '/images/diamonds/saturn-light/outfit.webp',
    artCaption: 'Appearance collection: outfit, hair, eyes, and earrings',
    references: [
      { label: 'Outfit', image: '/images/diamonds/saturn-light/outfit.webp', caption: 'Brown open shirt, gold necklaces, patterned shawl, gold belt, and a black briefcase' },
      { label: 'Hair', image: '/images/diamonds/saturn-light/hair.webp', caption: 'Curly black hair with blonde highlights' },
      { label: 'Eyes', image: '/images/diamonds/saturn-light/eyes.webp', caption: 'Yellow star eye makeup, one yellow iris and one dark iris' },
      { label: 'Earrings', image: '/images/diamonds/saturn-light/earrings.webp', caption: 'Gold star earrings with pearls' },
    ],
    theme: {
      bg: '#1a0f06',
      glow: '#8a5a2b',
      accent: '#e8c46a',
      accent2: '#ff9a5a',
      meteors: false,
      rings: true,
      backgroundLabel: 'A warm summer party: gold light, brown and gold, with Saturn rings that drift as you scroll and move',
    },
    abilities: [
      {
        name: 'Absolute Restoration',
        parent: 'Restoration',
        complexity: 'Complex',
        origin: "Saturn Light Diamond's Domain of Vitality",
        level: 'Mastered',
        description:
          'Saturn Light can restore anything to the way it was before it was hurt: mending light forms, reviving drained ground, putting broken things back together, and keeping a tired Gem on her feet long past when she should have dropped. Outside of battle, he can even mend a Cracked gem, which few Gems in the empire can do. He prefers using it on others.',
        passives: [
          {
            name: 'Rallying Aura',
            text: "While Saturn Light is on the battlefield, his party's Star Gauge gains 3 marks at the start of each round instead of 2.",
          },
          {
            name: 'Overflow',
            text: "Healing from this ability that goes past an ally's max HP becomes Overflow, extra HP that's lost first when they're hit. An ally can hold up to 10 Overflow, and it fades when the battle ends.",
          },
        ],
        spells: [
          { name: 'Pick-Me-Up', cost: 2, kind: 'buff', text: 'Saturn heals one ally for [1d6 + MAG].' },
          { name: 'Second Wind', cost: 2, kind: 'buff', text: 'Saturn clears one negative status from one ally, like [[Poison]], [[Burn]], [[Stunned]], or [[Frightened]].' },
          { name: 'Toast', cost: 3, kind: 'buff', text: 'Saturn raises a glass, and every ally who is Near heals for [1d4 + MAG].' },
          { name: 'Hype Up', cost: 3, kind: 'buff', text: 'Saturn gets one ally fired up. Their ATK goes up by 2 for 2 turns.' },
          { name: 'Encore', cost: 5, kind: 'buff', text: 'One ally who is [[Flickering]] gets back up with half their max HP.' },
          { name: 'Life of the Party', cost: 7, kind: 'buff', text: 'For 3 turns, Saturn and every ally heal [1d6 + MAG] at the start of each of their turns, and none of them can drop below 1 HP.' },
        ],
        statChanges: 'None',
        weaknesses:
          "Saturn can't use his healing on himself, except through Life of the Party. Mending a Cracked gem takes time and can't be done in battle, and it can't bring back a Shattered one.",
      },
      {
        name: 'Absolute Psychokinesis',
        parent: 'Psychokinesis',
        complexity: 'Complex',
        origin: "Saturn Light Diamond's Domain of Force",
        level: 'Mastered',
        description:
          "Saturn Light can push, pull, lift, and throw anything with his mind, from a single chair to a crowd of Gems who've had too much fun. Every party he's ever thrown has ended with him moving someone out of the way.",
        passives: [
          {
            name: 'Momentum',
            text: 'Each spell from this ability that lands gives Saturn 1 Momentum, up to 3. His next spell that deals damage uses all of it, adding +2 damage for each Momentum spent.',
          },
        ],
        spells: [
          { name: 'Shove', cost: 2, kind: 'mobility', text: 'Saturn pushes one target who is Near back to Far.' },
          { name: 'Yank', cost: 2, kind: 'debuff', text: "Saturn pulls one target's weapon out of their hands. The target resists with SPD. If they fail, they're [[Disarmed]] until they spend a turn getting it back." },
          { name: 'Bouncer', cost: 3, kind: 'defensive', text: 'Saturn puts a wall of force around one ally. The next attack against them is stopped completely, and the attacker is pushed back to Far.' },
          { name: 'Mosh Pit', cost: 3, kind: 'offensive', text: 'Saturn throws every enemy who is Near into each other, dealing [1d6 + MAG] Psychic damage to each.' },
          { name: 'Heavy Hand', cost: 3, kind: 'debuff', text: "Saturn presses one target flat. The target resists with DEF. If they fail, they're [[Knocked Down]] for 2 turns." },
          { name: 'Impact', cost: 4, kind: 'offensive', text: "Saturn hits one target with everything he's got, dealing [3d6 + MAG] Psychic damage." },
          { name: 'Bass Drop', cost: 7, kind: 'offensive', text: "Saturn slams the ground with a wave of force. Every enemy takes [4d6 + MAG] Psychic damage and resists with DEF. Those who fail are [[Knocked Down]]." },
        ],
        statChanges: 'None',
        weaknesses:
          "Saturn's force can't move a Deity Diamond, and anything Far is too far for his strongest pushes. Momentum is also lost if he goes a turn without using a Force spell.",
      },
    ],
    updated: '2026-11-18',
  },
  {
    slug: 'epsilon-blue',
    group: 'deity',
    name: 'Epsilon Blue Diamond',
    pronouns: 'She/Her',
    height: "163'0\"",
    color: 'Blue',
    pillar: 'Energy',
    domains: ['Perception', 'Energy'],
    subDomains: ['Awareness', 'Truth', 'Insight', 'Sight', 'Electricity', 'Magnetism', 'Radiation', 'Sound'],
    court: 'Epsilon',
    personality:
      'On the outside, Epsilon Blue is a rigid, hardworking Diamond, bound by the very systems she herself set up for the laws and legalities of the Gempire. She is quiet yet demanding, graceful yet authoritative. She is the grand judge of Homeworld, and that comes with a certain appraisal that she displays to the courtroom on a daily basis. She is not afraid to judge those based on their actions; it is her whole purpose after all. On the inside, however, you will find a curious, almost child-like personality that directly contradicts her demeanor. It is very rare to see this side of her, but she shows it often to her Pearls and her fellow Diamond companions, though she knows when and when not to be soft to some Gem. From the moment she first took her form, Epsilon Blue has been working tirelessly to ensure that all laws and statutes in place stay in place and that the Gempire continues to flourish. Though she appears less within the public eye, Epsilon still makes an effort to let other Gems know that they are welcome to visit her.',
    purpose:
      'Epsilon Blue Diamond is responsible for court proceedings of Gems suspected of breaking laws, and convicting them accordingly. Though a Diamond, she enjoys sitting through the smaller court sessions to observe her Kyanites and Azurites cases. When not doing that, she is constantly reviewing case verdicts in civil courts as well, as they often get escalated to her, as she is a supreme court judge of sorts. These cases are usually opinion based, with Epsilon Blue having the final say, and about 75%-80% of all cases are just civil ones. This is why her appearances outside dwindle bit by bit. She also oversees Homeworld proper as a mayoral figure, meaning she is seen more often than Alpha Black and even Theta Gold. When she is not in either place, she is somewhere comforting a lone Gem if they decide to come to her for any of their struggles, though she rarely has time for any of her pastimes. She often visits the other Deity Diamonds, and ruling Diamonds if they are available.',
    powers: [
      { name: 'Absolute Perception', level: 'Mastered' },
      { name: 'Energy Manipulation', level: 'Advanced' },
    ],
    weaknesses:
      "Epsilon's greatest weakness is the unknown. With an ability like Absolute Perception, meaning she knows what everything around is, what it is composed of, what its intentions are, what it is for, and who it is from, Epsilon Blue falters in the absence of knowing. Her powers have a weakness too: she is susceptible to those with abilities that affect the senses, particularly blindness. She has another weakness as well: emotional regulation. Though not common, Epsilon Blue will have a spell of deep depressions where she barely leaves her tower and buries herself in her workloads non-stop for months, and even years, at a time. There, she is the most productive workwise, but the least productive selfwise.",
    quote: "Feeling something in the courtroom is like trying to reason with a case by appealing to emotion. You may 'feel' any type of way you want, but what is law is absolute, and nothing shall triumph over it.",
    art: '/images/diamonds/epsilon-blue.webp',
    artCaption: 'Placeholder art, being redesigned.',
    theme: {
      bg: '#060a1e',
      glow: '#1e3a8a',
      accent: '#7fb3ff',
      accent2: '#bfe3ff',
      meteors: false,
      orbs: true,
      backgroundLabel: 'A courtroom under the stars: blue energy orbs and sparks that drift as you scroll and move',
    },
    abilities: [
      {
        name: 'Absolute Perception',
        parent: 'Enhanced Senses',
        complexity: 'Complex',
        origin: "Epsilon Blue Diamond's Domain of Perception",
        level: 'Mastered',
        description:
          'Epsilon Blue perceives everything around her at once: every sound in a room, every flicker of light, every change in someone’s voice. She can tell what a Gem is about to do before they move, see through any disguise, and know when someone is lying to her. Nothing in front of her stays hidden for long.',
        passives: [
          {
            name: 'Aura: Nothing Hidden',
            text: "While Epsilon Blue is on the battlefield, enemies can't hide or turn invisible, and her party can't be ambushed.",
          },
        ],
        spells: [
          { name: 'Read', cost: 2, kind: 'utility', text: 'Epsilon takes in one target at a glance. Her party learns their stats and abilities.' },
          { name: 'Tell', cost: 2, kind: 'defensive', text: "Epsilon spots the small sign that gives one enemy's next move away. Their next attack against her or an ally is made with disadvantage." },
          { name: 'Second Sight', cost: 3, kind: 'buff', text: "Epsilon shares what she sees with every ally who is Near. They can't be [[Blinded]] until her next turn, and their next attack has advantage." },
          { name: 'Exposed', cost: 4, kind: 'debuff', text: "Epsilon finds every weak point in one target's guard. For 2 turns, her allies' hits against them ignore DEF." },
          { name: 'All Is Known', cost: 6, kind: 'buff', text: "Epsilon sees the whole battlefield for what it is. Her party learns every enemy's stats and abilities, and each ally's next attack can't miss and ignores DEF." },
        ],
        statChanges: 'None',
        weaknesses:
          "Her senses are so sharp that they can be turned against her. [[Blinded]], [[Stunned]], and other effects that overwhelm the senses last 1 turn longer on her.",
      },
      {
        name: 'Energy Manipulation',
        parent: 'N/A',
        complexity: 'Complex',
        origin: "Epsilon Blue Diamond's Domain of Energy",
        level: 'Advanced',
        description:
          'Epsilon Blue can draw energy in, hold it, and release it in any form she likes: electricity, magnetism, sound, or radiation. She can power a machine with a touch, pull metal toward her, or let it all out at once.',
        passives: [
          {
            name: 'Conservation',
            text: "Energy can't be destroyed, only stored. Each time an Electric, Fire, or Light attack hits Epsilon, she gains 1 Charge, up to 3. Charge lasts until the battle ends.",
          },
        ],
        spells: [
          { name: 'Spark', cost: 2, kind: 'offensive', text: 'A spark jumps from Epsilon’s hand to one target, dealing [1d6 + MAG] Electric damage.' },
          { name: 'Magnetize', cost: 2, kind: 'mobility', text: 'Epsilon pulls one target to Near or pushes them to Far. Metals and Gem Machines resist with disadvantage. Anyone else resists with DEF.' },
          { name: 'Static Field', cost: 3, kind: 'offensive', text: 'The air around Epsilon fills with static. Every enemy who is Near takes [1d6 + MAG] Electric damage.' },
          { name: 'Discharge', cost: 3, kind: 'offensive', text: "Epsilon lets out everything she's stored into one target, dealing [2d6 + MAG] Electric damage, plus 1d6 for each Charge spent. This uses all of her Charge." },
          { name: 'Thunderclap', cost: 4, kind: 'debuff', text: 'Epsilon claps her hands, and a wave of sound rolls across the battlefield. Every enemy resists with DEF. Those who fail are [[Stunned]] for 1 turn.' },
          { name: 'Fallout', cost: 7, kind: 'offensive', text: 'Epsilon releases radiation across the whole battlefield. Every enemy takes [4d6 + MAG] damage and resists with DEF. Those who fail are [[Poisoned]] for 3 turns.' },
        ],
        statChanges: 'None',
        weaknesses:
          "Anything insulated, or wired into the ground like a Copper, takes half damage from her Electric spells, and her Charge is lost if she's [[Knocked Down]].",
      },
    ],
    updated: '2026-11-18',
  },
  {
    slug: 'theta-gold',
    group: 'deity',
    name: 'Theta Gold Diamond',
    pronouns: 'He/They',
    height: "164'0\"",
    color: 'Gold',
    pillar: 'Time',
    domains: ['Production', 'Time'],
    subDomains: ['Growth', 'Harvest', 'Industry', 'Refinement', 'Replication', 'Seasons', 'Aging', 'Haste'],
    court: 'Theta',
    personality:
      'Theta Gold is a total control freak when it comes to his gem productions. He will only take the optimal kindergarten locations for certain gems to be made and refuses to acknowledge any of the defective or off color gems as his creations. Anything less than perfect in his eyes does not belong in his court. Perfect cut gems are his prized possessions, often showing them off to the other Diamonds as a form of flaunting his work. Theta Gold will often experiment under the table with different gems developing in different conditions to try and give them certain features or powers to see if he could create the perfect gem for different scenarios. As well as taking great pride in his work, Theta Gold will also take great pride in his appearance, making sure he looks the best he can be despite having visible joints similar to a ball-jointed doll along with the lines on his face and spots on his hands. Theta Gold is very much so a workaholic in order to make more perfect cut gems to show off, so he highly prefers work over social outings or events, to which he sends his Cubic Zirconia as a replacement for himself.',
    purpose:
      'Theta Gold Diamond is the creator of most gems. He oversees the production of gems, controlling their quantity, type, and, hopefully, quality as well. He is rarely seen in public due to being deeply buried in his work more often than not. He wants to ensure the absolute quality of his gems and is constantly researching ways to create perfect cut gems more often. Theta Gold will take requests from other courts for gem productions and send them the best of the batch while sending the below-average and defective gems to other courts to fill in lesser roles.',
    powers: [
      { name: 'Absolute Chronokinesis', level: 'Mastered' },
      { name: 'Body Part Detachment', level: 'Advanced' },
      { name: 'Mannequin Creation', level: 'Mastered' },
    ],
    weaknesses:
      "Even though he is perceived as a Deity Diamond, Theta's greatest weaknesses are how little he understands the world outside his office, his need for perfection, and how deeply he forms attachments to certain gems and metals. If any of these are disrupted, changed, or put into danger, Theta Gold quickly becomes overwhelmed and lets his emotions get the better of him, whether it be stress, grief, or anger.",
    quote: "I need you to understand something: this Gempire needs me. I keep the perfect cuts coming in. I keep up production of workers and laborers. I keep up the production of aristocrats and all your little friends. But those defectives? They are not your friends. They are parasites, wastes of resources, and the reason I keep working to prevent more from ever forming. So excuse me if I'm upset with you for bringing one into my court and declaring them your friend before fusing with them before my very eyes. Stop your crying, I shattered them for a good reason and we both know it.",
    art: '/images/diamonds/theta-gold.webp',
    artCaption: 'Redesign sketch',
    theme: {
      bg: '#171106',
      glow: '#8a6d1f',
      accent: '#f2c94c',
      accent2: '#ffe9a8',
      meteors: false,
      gears: true,
      backgroundLabel: 'A workshop out of time: gold clock gears that drift as you scroll and move',
    },
    abilities: [
      {
        name: 'Absolute Chronokinesis',
        parent: 'Chronokinesis',
        complexity: 'Complex',
        origin: "Theta Gold Diamond's Domain of Time",
        level: 'Mastered',
        description:
          'Theta Gold can speed time up, slow it down, wind it back, and stop it, for a single gem or a whole room. He uses it the way he uses everything else: to keep work on schedule.',
        passives: [
          {
            name: 'Punctual',
            text: 'Theta always acts first in the first round of a battle.',
          },
        ],
        spells: [
          { name: 'Haste', cost: 2, kind: 'buff', text: 'Theta speeds up time around one ally. They act first in the next round.' },
          { name: 'Slow', cost: 2, kind: 'debuff', text: 'Theta slows time around one target. The target resists with INT. If they fail, they act last in the next round.' },
          { name: 'Rewind', cost: 3, kind: 'buff', text: "Theta winds one ally back a few moments. They heal for all the damage they've taken since the end of their last turn." },
          { name: 'Wear', cost: 4, kind: 'debuff', text: "Theta ages one target's light form by years in an instant. The target resists with DEF. If they fail, their DEF drops by 4 for 3 turns." },
          { name: 'Overtime', cost: 4, kind: 'mobility', text: 'Theta takes another turn right away. He skips his next turn afterward.' },
          { name: 'Time Stop', cost: 7, kind: 'debuff', text: 'Theta stops time for everyone but his party. Every enemy skips their next turn, with no resist.' },
        ],
        statChanges: 'None',
        weaknesses:
          "Time can't undo a Crack or a Shattering, and stopping time takes everything he has. After Time Stop, he can't use another spell from this ability for 2 turns.",
      },
      {
        name: 'Body Part Detachment',
        parent: 'N/A',
        complexity: 'Complex',
        origin: "Theta Gold Diamond's Domain of Production",
        level: 'Advanced',
        description:
          'Theta Gold can come apart at the joints like a ball-jointed doll and still control every piece. He can also summon up to ten extra disembodied arms and hands made of light to help with his work, whether that is building, carrying, or fighting.',
        passives: [
          {
            name: 'Ball-Jointed',
            text: 'Effects that hold a limb in place, like [[Stuck]] and [[Entangle]], last 1 turn shorter on Theta, since he can just take the limb off.',
          },
        ],
        spells: [
          { name: 'Long Reach', cost: 2, kind: 'mobility', text: 'Theta detaches a hand and sends it across the battlefield. It can grab an item, pull one ally to Near, or make a FIGHT against a target who is Far as if they were Near.' },
          { name: 'Helping Hands', cost: 3, kind: 'buff', text: 'Theta summons a pair of hands for one ally. For 2 turns, that ally gets one extra FIGHT each turn, dealing half damage.' },
          { name: 'Many Hands', cost: 4, kind: 'offensive', text: 'Ten disembodied hands rain down on one target, each dealing [1d4] damage, plus MAG once.' },
        ],
        statChanges: 'None',
        weaknesses:
          'A detached limb can be hit on its own. If one of his extra hands is struck while out, he takes the damage too.',
      },
      {
        name: 'Mannequin Creation',
        parent: 'N/A',
        complexity: 'Complex',
        origin: "Theta Gold Diamond's Domain of Production",
        level: 'Mastered',
        description:
          "Theta Gold can summon physical mannequins at any size to help with his work. Each one is a prototype of the Gem-Type it's sized after, with that type's base stats at level 1, but no mind of its own and no abilities. Unlike holograms, they're solid. The bigger the mannequin, the fewer he can make.",
        passives: [
          {
            name: 'Prototypes',
            text: "Mannequins use the base stats of the Gem-Type they're sized after, with no Signature Ability, Era modifier, or Latent Ability. They act on Theta's turn, can only FIGHT or Defend, and last until they're defeated or the battle ends.",
          },
        ],
        spells: [
          { name: 'Small Mannequin', cost: 2, kind: 'buff', text: 'Theta summons a mannequin sized after any Rank 4 or Rank 5 Gem-Type, like a Ruby, Sapphire, Pearl, or Aquamarine. There is no limit to how many he can have.' },
          { name: 'Militia Mannequin', cost: 3, kind: 'buff', text: 'Theta summons a mannequin sized after any Rank 3 Gem-Type, like a Jasper or Amethyst. He can have up to 3 at a time.' },
          { name: 'Aristocrat Mannequin', cost: 4, kind: 'buff', text: 'Theta summons a mannequin sized after any Rank 2 Gem-Type, like an Agate or Hessonite. He can have up to 2 at a time.' },
          { name: 'Grand Mannequin', cost: 6, kind: 'buff', text: "Theta summons a mannequin the size of a Cubic Zirconia, using the Cubic Zirconia's base stats. He can only have 1 at a time in battle, or 2 outside of it." },
        ],
        statChanges: 'None',
        weaknesses:
          "Mannequins can't think for themselves, so they only follow simple orders, and they can't be healed.",
      },
    ],
    credits: [{ label: 'Design', name: 'err0rc0de_blair' }],
    updated: '2026-11-18',
  },
  {
    slug: 'omega-white',
    group: 'deity',
    status: 'Absorbed',
    name: 'Omega White Diamond',
    pronouns: "She/Her",
    height: "165'0\"",
    color: "White",
    pillar: 'Matter',
    domains: ["The Heavens", "Mind"],
    subDomains: ["Sky", "Light", "Stars", "Sun", "Thought", "Will", "Emotion", "Illusion"],
    court: 'Omega',
    personality: "Omega White believes that because her gem gives off white light, she is light itself, and since every Gem is made of light, every Gem is a piece of her. She judges them the way she would judge herself, and when a Gem doesn't act the way she would, she takes it as a personal attack. The truth is that she has no real self at all. She never lets herself want or feel anything, because then she would have to judge that too. So instead she makes everyone else into her, and everyone around her pays for it.",
    purpose: "Omega White ruled the far side of existence, overseeing her own Gempire and keeping her Homeworld powered and held together, since without her it would have shattered. She did it the only way she knew how, by making every Gem under her exactly the same. After her defeat in the war, Alpha Black absorbed her, and she has been held inside Alpha's space ever since.",
    powers: [{"name": "Absolute Photokinesis", "level": "Mastered"}, {"name": "Mind Control", "level": "Mastered"}, {"name": "Matter Manipulation", "level": "Mastered"}],
    weaknesses: "Her sense of self is so fragile that any Gem acting differently feels like an attack on her, and a Gem feeling something strongly enough can break free of her hold.",
    quote: "Now the impurities you've allowed to fester within yourself are gone! Now you are brilliant; now, you are perfect; now, you are ME!",
    art: '/images/diamonds/omega-white.webp',
    theme: { bg: '', glow: '', accent: '', accent2: '', meteors: false, backgroundLabel: '' },
    abilities: [],
    updated: '2026-11-19',
  },
  {
    slug: 'nightshade-violet',
    group: 'ruling',
    partial: true,
    name: 'Nightshade Violet Diamond',
    pronouns: "",
    height: "",
    color: "Violet",
    domains: [],
    subDomains: ["Darkness"],
    court: 'Nightshade',
    personality: "",
    purpose: "",
    powers: [],
    weaknesses: "",
    quote: "",
    art: '/images/diamonds/nightshade-violet.webp',
    theme: { bg: '', glow: '', accent: '', accent2: '', meteors: false, backgroundLabel: '' },
    abilities: [],
    updated: '2026-11-19',
  },
  {
    slug: 'maroon-red',
    group: 'ruling',
    partial: true,
    name: 'Maroon Red Diamond',
    pronouns: "",
    height: "",
    color: "Maroon",
    domains: ["War"],
    subDomains: [],
    court: 'Maroon',
    personality: "",
    purpose: "",
    powers: [],
    weaknesses: "",
    quote: "",
    art: '/images/diamonds/maroon-red/placeholder.svg',
    theme: { bg: '', glow: '', accent: '', accent2: '', meteors: false, backgroundLabel: '' },
    abilities: [],
    updated: '2026-11-19',
  },
  {
    slug: 'bi-colored-kandy',
    group: 'ruling',
    partial: true,
    name: 'Bi-Colored Kandy Diamond',
    pronouns: "",
    height: "",
    color: "Pink and blue",
    domains: ["Technology"],
    subDomains: [],
    court: 'Kandy',
    personality: "",
    purpose: "",
    powers: [],
    weaknesses: "",
    quote: "",
    art: '/images/diamonds/bi-colored-kandy/placeholder.svg',
    theme: { bg: '', glow: '', accent: '', accent2: '', meteors: false, backgroundLabel: '' },
    abilities: [],
    updated: '2026-11-19',
  },
];

/** Diamonds whose pages are not ready yet. No page, no invented details, just a placeholder line each. */
export const FORTHCOMING_DIAMONDS: { name: string; note: string }[] = [];
const _OLD_FORTHCOMING = [
  { name: 'Nightshade Violet Diamond', note: 'Submission received, a few details still to come' },
  { name: 'Maroon Red Diamond', note: 'The War Diamond. Submission not arrived yet.' },
  { name: 'Bi-Colored Kandy Diamond', note: 'The Tech Diamond. Submission not arrived yet.' },
];

/** Local status icon file for a status name, from public/images/statuses/. */
export function statusIcon(name: string): { file: string; dark: boolean } | null {
  const map: Record<string, string> = {
    Darkness: 'darkness.png',
    Flickering: 'flickering.png',
    Poofed: 'poofed.png',
    Mangled: 'mangled.png',
    Frightened: 'frightened.png',
    Stuck: 'stuck.png',
    Blinded: 'blinded.png',
    Confused: 'confused.svg',
    Poison: 'poison.png',
    Poisoned: 'poison.png',
    Entangle: 'entangle.png',
    Burn: 'burn.png',
    Stunned: 'stunned.png',
    Disarmed: 'disarmed.png',
    'Knocked Down': 'knocked-down.svg',
  };
  const file = map[name];
  if (!file) return null;
  return { file, dark: ['darkness.png', 'blinded.png', 'entangle.png'].includes(file) };
}
