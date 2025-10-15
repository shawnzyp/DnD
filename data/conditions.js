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
        }
      ];
