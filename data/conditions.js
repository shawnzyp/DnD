export default [
  {
    name: "Blinded",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "None",
    summary: "A blinded creature can't see, automatically fails sight-based checks, and attack rolls against it gain advantage while its own attacks suffer disadvantage.",
    source: "SRD 5.1",
    effects: [
      "Vision-based Perception checks automatically fail",
      "Attack rolls against the creature have advantage",
      "The creature's attack rolls have disadvantage"
    ],
    keywords: ["senses", "perception", "advantage"]
  },
  {
    name: "Charmed",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "Varies",
    summary: "A charmed creature can't attack the charmer and treats the charmer's social checks with friendly bias.",
    source: "SRD 5.1",
    effects: [
      "The charmed creature can't target the charmer with harmful abilities",
      "The charmer has advantage on social ability checks to interact with the creature"
    ],
    keywords: ["influence", "social", "enchantment"]
  },
  {
    name: "Deafened",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "None",
    summary: "A deafened creature can't hear and fails sound-based checks; 2024 material keeps the same core drawback.",
    source: "SRD 5.1",
    effects: [
      "Hearing-based Perception checks automatically fail",
      "The creature has disadvantage on ability checks that rely on hearing"
    ],
    keywords: ["senses", "perception", "sound"]
  },
  {
    name: "Exhaustion",
    duration: "Until rested or restored",
    durationTag: "ongoing",
    savingThrow: "None",
    summary: "Exhaustion imposes six escalating levels of penalties in SRD 5.1; 2024 rules swap this ladder for a stacking -1 penalty to d20 tests and DCs per level.",
    source: "SRD 5.1",
    effects: [
      "Level 1: Disadvantage on ability checks",
      "Level 2: Speed halved",
      "Level 3: Disadvantage on attack rolls and saving throws",
      "Level 4: Hit point maximum halved",
      "Level 5: Speed reduced to 0",
      "Level 6: Death"
    ],
    keywords: ["fatigue", "penalty", "rest"]
  },
  {
    name: "Frightened",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "Varies",
    summary: "Fearful creatures struggle to focus, gaining disadvantage on ability checks and attacks while the source is in sight and cannot willingly move closer to it.",
    source: "SRD 5.1",
    effects: [
      "Disadvantage on ability checks and attack rolls while the source of fear is in sight",
      "Cannot willingly move closer to the source of fear"
    ],
    keywords: ["fear", "control", "movement"]
  },
  {
    name: "Grappled",
    duration: "Until escaped or released",
    durationTag: "special",
    savingThrow: "Varies (usually Strength or Dexterity to escape)",
    summary: "Movement drops to 0 and can't be increased. Ends if the grappler is incapacitated or moved away from the target's reach.",
    source: "SRD 5.1",
    effects: [
      "Speed becomes 0",
      "Bonuses to speed don't apply",
      "Condition ends if the grappler is incapacitated or the creature is removed from reach"
    ],
    keywords: ["movement", "escape", "control"]
  },
  {
    name: "Incapacitated",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "None",
    summary: "Incapacitated creatures can't take actions or reactions; 2024 clarifies they still maintain concentration unless another effect ends it.",
    source: "SRD 5.1",
    effects: [
      "The creature can't take actions",
      "The creature can't take reactions"
    ],
    keywords: ["actions", "control", "stunned"]
  },
  {
    name: "Invisible",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "Varies",
    summary: "An invisible creature can't be seen without magic or special senses and gains advantage on attacks while attackers suffer disadvantage.",
    source: "SRD 5.1",
    effects: [
      "Invisible creatures are impossible to see without special senses",
      "Attack rolls against the creature have disadvantage",
      "The creature's attack rolls have advantage"
    ],
    keywords: ["stealth", "senses", "advantage"]
  },
  {
    name: "Paralyzed",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "Varies",
    summary: "The creature is incapacitated, can't move or speak, automatically fails Strength and Dexterity saves, and critical hits land at close range.",
    source: "SRD 5.1",
    effects: [
      "The creature is incapacitated and can't move or speak",
      "Automatically fails Strength and Dexterity saving throws",
      "Attack rolls against the creature have advantage, and within 5 feet they become critical hits on a hit"
    ],
    keywords: ["incapacitated", "dexterity", "critical"]
  },
  {
    name: "Petrified",
    duration: "Until cured",
    durationTag: "ongoing",
    savingThrow: "Varies",
    summary: "A petrified creature is transformed into stone, incapacitated, and resistant to most damage; older editions sometimes left gear unaffected, so note table rulings.",
    source: "SRD 5.1",
    effects: [
      "The creature is incapacitated and can't move or speak",
      "The creature is unaware of its surroundings",
      "Attack rolls against the creature have advantage",
      "The creature has resistance to all damage",
      "The creature automatically fails Strength and Dexterity saving throws",
      "The creature is immune to poison and disease, although poison and disease already present are suspended"
    ],
    keywords: ["transformation", "control", "resistance"]
  },
  {
    name: "Poisoned",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "Varies",
    summary: "Toxic afflictions sap vitality, imposing disadvantage on attack rolls and ability checks until cured or the effect ends.",
    source: "SRD 5.1",
    effects: [
      "Disadvantage on attack rolls",
      "Disadvantage on ability checks"
    ],
    keywords: ["toxins", "penalty", "disease"]
  },
  {
    name: "Prone",
    duration: "Until standing or otherwise moved",
    durationTag: "instant",
    savingThrow: "None",
    summary: "Fallen creatures crawl or stand slowly, making melee swings against them easier while ranged shots are harder.",
    source: "SRD 5.1",
    effects: [
      "The creature's only movement option is to crawl unless it stands, costing half its movement",
      "Attack rolls against the creature have advantage if within 5 feet, otherwise disadvantage",
      "The creature's attack rolls have disadvantage"
    ],
    keywords: ["movement", "melee", "positioning"]
  },
  {
    name: "Restrained",
    duration: "Until escaped or released",
    durationTag: "special",
    savingThrow: "Varies",
    summary: "Restrained creatures can't move and suffer attack penalties; 2024 clarifies they still have disadvantage on Dexterity saves despite weapon mastery tweaks.",
    source: "SRD 5.1",
    effects: [
      "The creature's speed becomes 0",
      "Attack rolls against the creature have advantage",
      "The creature's attack rolls have disadvantage",
      "The creature has disadvantage on Dexterity saving throws"
    ],
    keywords: ["movement", "control", "dexterity"]
  },
  {
    name: "Stunned",
    duration: "Varies by source",
    durationTag: "ongoing",
    savingThrow: "Varies",
    summary: "A stunned creature is incapacitated, can't move, and can speak only falteringly, while attackers enjoy advantage and the victim fails Strength and Dexterity saves.",
    source: "SRD 5.1",
    effects: [
      "The creature is incapacitated, can't move, and can speak only falteringly",
      "Automatically fails Strength and Dexterity saving throws",
      "Attack rolls against the creature have advantage"
    ],
    keywords: ["incapacitated", "control", "stagger"]
  },
  {
    name: "Unconscious",
    duration: "Until awakened or stabilized",
    durationTag: "ongoing",
    savingThrow: "None",
    summary: "An unconscious creature drops prone, can't act, drops what it holds, and is easy to hit; death saves govern recovery in 5e, while older editions used negative hit point tracking.",
    source: "SRD 5.1",
    effects: [
      "The creature is incapacitated and can't move or speak",
      "The creature is unaware of its surroundings",
      "The creature drops whatever it's holding and falls prone",
      "The creature automatically fails Strength and Dexterity saving throws",
      "Attack rolls against the creature have advantage",
      "Any attack that hits the creature is a critical hit if the attacker is within 5 feet"
    ],
    keywords: ["fallen", "critical", "recovery"]
  }
];
