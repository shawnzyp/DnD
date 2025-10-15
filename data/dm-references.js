export default [
        {
          key: "actions",
          title: "Combat Actions",
          description: "Standard combat options most characters can take on their turn.",
          columns: ["Action", "Summary", "Key Notes"],
          caption: "Actions are available unless a specific rule or condition prevents their use.",
          rows: [
            {
              cells: [
                { text: "Attack", tag: "Action" },
                { text: "Make one melee or ranged weapon attack with a wielded weapon." },
                { text: "Extra Attack features let you repeat the option; you can replace one attack with a grapple or shove." }
              ]
            },
            {
              cells: [
                { text: "Cast a Spell", tag: "Action" },
                { text: "Cast a spell that has a casting time of one action." },
                { text: "Provide required components; concentration begins once the spell takes effect." }
              ]
            },
            {
              cells: [
                { text: "Dash", tag: "Action" },
                { text: "Gain extra movement equal to your speed for the turn." },
                { text: "Applies after other bonuses to speed; difficult terrain still increases the cost of movement." }
              ]
            },
            {
              cells: [
                { text: "Disengage", tag: "Action" },
                { text: "Your movement doesn't provoke opportunity attacks this turn." },
                { text: "Ideal for slipping out of melee; some creatures ignore the benefit with special senses or features." }
              ]
            },
            {
              cells: [
                { text: "Dodge", tag: "Action" },
                { text: "Attacks against you have disadvantage and you gain advantage on Dexterity saves until your next turn." },
                { text: "The benefit ends if you are incapacitated or if your speed drops to 0." }
              ]
            },
            {
              cells: [
                { text: "Help", tag: "Action" },
                { text: "Grant advantage on an ally's next ability check, or attack a creature within 5 feet of you." },
                { text: "Assisting an attack requires the target to be in reach; you can also narrate tool proficiencies to justify help." }
              ]
            },
            {
              cells: [
                { text: "Hide", tag: "Action" },
                { text: "Attempt to become unseen using Dexterity (Stealth)." },
                { text: "You need cover or heavy obscurity; success ends once you reveal yourself or leave concealment." }
              ]
            },
            {
              cells: [
                { text: "Ready", tag: "Action" },
                { text: "Prepare an action to use later as a reaction when a trigger occurs." },
                { text: "Describe the trigger and response; holding a spell requires concentration until the reaction resolves." }
              ]
            },
            {
              cells: [
                { text: "Search", tag: "Action" },
                { text: "Focus on finding clues using Wisdom (Perception) or Intelligence (Investigation)." },
                { text: "The DM chooses the skill involved and may apply advantage or disadvantage from circumstances." }
              ]
            },
            {
              cells: [
                { text: "Use an Object", tag: "Action" },
                { text: "Interact with a second object or activate an item that specifically requires an action." },
                { text: "Covers complex manipulations beyond the free interaction granted each turn." }
              ]
            }
          ]
        },
        {
          key: "dcs",
          title: "Ability Check Benchmarks",
          description: "Use these typical difficulty classes when an ability check needs a target number.",
          columns: ["Difficulty", "Target DC", "Typical Use Cases"],
          rows: [
            {
              cells: [
                { text: "Very Easy" },
                { text: "5" },
                { text: "Tasks almost anyone can accomplish, such as noticing a loud conversation or walking across a sturdy bridge." }
              ]
            },
            {
              cells: [
                { text: "Easy" },
                { text: "10" },
                { text: "Routine adventuring tasks: climbing a knotted rope, recalling common monster lore, or calming a skittish mount." }
              ]
            },
            {
              cells: [
                { text: "Moderate" },
                { text: "15" },
                { text: "Meaningful challenges like picking a standard lock, tracking in soft ground, or resisting common toxins." }
              ]
            },
            {
              cells: [
                { text: "Hard" },
                { text: "20" },
                { text: "Serious obstacles: spotting a hidden door, persuading a reluctant official, or balancing on a narrow ledge." }
              ]
            },
            {
              cells: [
                { text: "Very Hard" },
                { text: "25" },
                { text: "Expert-level feats such as bypassing arcane wards, deciphering an ancient cipher, or besting a seasoned warrior." }
              ]
            },
            {
              cells: [
                { text: "Nearly Impossible" },
                { text: "30" },
                { text: "Legendary achievements: stealing secrets from an ancient dragon or disabling a deity's vault lock." }
              ]
            }
          ]
        },
        {
          key: "travel",
          title: "Overland Travel Pace",
          description: "Pick a pace to determine how far the party moves and what tradeoffs apply.",
          columns: ["Pace", "Per Hour", "Per Day", "Effect"],
          rows: [
            {
              cells: [
                { text: "Fast", tag: "Speed" },
                { text: "4 miles" },
                { text: "30 miles" },
                { text: "-5 penalty to passive Wisdom (Perception) scores; creatures may surprise the party more easily." }
              ]
            },
            {
              cells: [
                { text: "Normal", tag: "Speed" },
                { text: "3 miles" },
                { text: "24 miles" },
                { text: "Default travel pace with no special modifiers." }
              ]
            },
            {
              cells: [
                { text: "Slow", tag: "Speed" },
                { text: "2 miles" },
                { text: "18 miles" },
                { text: "Allows the group to move stealthily; passive perception scores remain unchanged." }
              ]
            },
            {
              cells: [
                { text: "Forced March", tag: "Check" },
                { text: "—" },
                { text: "Beyond 8 hours" },
                { text: "After 8 hours of travel, each additional hour requires a DC 10 Constitution save or the creature takes one level of exhaustion." }
              ]
            },
            {
              cells: [
                { text: "Difficult Terrain", tag: "Terrain" },
                { text: "Halved" },
                { text: "Halved" },
                { text: "Each foot of movement costs an extra foot; combine with the chosen pace to find the final distance." }
              ]
            }
          ]
        },
        {
          key: "hazards",
          title: "Environmental Hazards",
          description: "Common exploration hazards and how to adjudicate them at the table.",
          columns: ["Hazard", "Threat", "Effect", "Mitigation"],
          rows: [
            {
              cells: [
                { text: "Extreme Cold", tag: "Arctic" },
                { text: "Freezing temperatures" },
                { text: "Each hour exposed requires a DC 10 Constitution save or the creature gains one level of exhaustion." },
                { text: "Cold weather gear, magical warmth, or natural resistance to cold prevents the save; shelter grants advantage." }
              ]
            },
            {
              cells: [
                { text: "Extreme Heat", tag: "Desert" },
                { text: "Scorching sun and high humidity" },
                { text: "Each hour requires a Constitution save starting at DC 5 and increasing by 1 for each additional hour; failure causes one level of exhaustion." },
                { text: "Shade, ample water, or immunity to fire damage avoids the save; heavy armor imposes disadvantage." }
              ]
            },
            {
              cells: [
                { text: "Frigid Water", tag: "Aquatic" },
                { text: "Icy lakes, winter seas" },
                { text: "A creature can swim for a number of minutes equal to its Constitution score; afterward it must succeed on a DC 10 Constitution save each minute or gain one level of exhaustion." },
                { text: "Resistance or immunity to cold damage prevents the checks; leaving the water and warming up ends the risk." }
              ]
            },
            {
              cells: [
                { text: "Thin Air", tag: "Altitude" },
                { text: "Elevations above 20,000 feet" },
                { text: "After 1 hour, each hour requires a DC 10 Constitution save; failure imposes disadvantage on all ability checks until acclimated and a second failure adds one level of exhaustion." },
                { text: "Spending time acclimating or using magic such as create food and water or lesser restoration mitigates the effect." }
              ]
            },
            {
              cells: [
                { text: "Strong Wind", tag: "Storm" },
                { text: "Gale-force gusts" },
                { text: "Disadvantage on ranged weapon attacks and Wisdom (Perception) checks relying on hearing; open flames are extinguished." },
                { text: "Take shelter behind windbreaks, secure flight with tethering, or rely on spells like control winds." }
              ]
            }
          ]
        },
        {
          key: "bonusActions",
          title: "Common Bonus Actions",
          description: "Use when a feature, spell, or weapon grants a secondary action in the same turn.",
          columns: ["Option", "Effect", "Notes"],
          caption: "Only one bonus action is available per turn, even if multiple features offer options.",
          rows: [
            {
              cells: [
                { text: "Two-Weapon Fighting", tag: "Attack" },
                { text: "Make one melee weapon attack with an off-hand light weapon." },
                { text: "Requires the Attack action with a light melee weapon; no ability modifier to damage unless feature allows." }
              ]
            },
            {
              cells: [
                { text: "Bardic Inspiration", tag: "Bard" },
                { text: "Grant a creature within 60 ft. a die to add to an ability check, attack, or save." },
                { text: "Die size scales with level; a creature can hold one inspiration die at a time." }
              ]
            },
            {
              cells: [
                { text: "Cunning Action", tag: "Rogue" },
                { text: "Dash, Disengage, or Hide as a bonus action." },
                { text: "Available starting at rogue level 2; combines with movement earned from the action." }
              ]
            },
            {
              cells: [
                { text: "Second Wind", tag: "Fighter" },
                { text: "Regain 1d10 + fighter level hit points." },
                { text: "Refreshes on a short or long rest." }
              ]
            },
            {
              cells: [
                { text: "Misty Step", tag: "Spell" },
                { text: "Teleport 30 ft. to an unoccupied space you can see." },
                { text: "No opportunity attacks; verbal component only." }
              ]
            }
          ]
        },
        {
          key: "reactions",
          title: "Notable Reactions",
          description: "Triggered responses that resolve outside your turn.",
          columns: ["Reaction", "Trigger", "Effect"],
          caption: "A creature refreshes its reaction at the start of its turn.",
          rows: [
            {
              cells: [
                { text: "Opportunity Attack", tag: "Core" },
                { text: "A creature you see leaves your reach." },
                { text: "Make one melee attack; moving willingly or teleporting avoids the trigger." }
              ]
            },
            {
              cells: [
                { text: "Shield", tag: "Spell" },
                { text: "Hit by an attack or targeted by magic missile." },
                { text: "+5 AC until your next turn and negate magic missile." }
              ]
            },
            {
              cells: [
                { text: "Counterspell", tag: "Spell" },
                { text: "Creature within 60 ft. casts a spell." },
                { text: "Interrupt; succeed automatically vs. 3rd-level or lower spells or make an ability check for higher." }
              ]
            },
            {
              cells: [
                { text: "Feather Fall", tag: "Spell" },
                { text: "You or a creature within 60 ft. falls." },
                { text: "Up to five targets descend at 60 ft. per round and take no falling damage." }
              ]
            },
            {
              cells: [
                { text: "Protection Style", tag: "Martial" },
                { text: "A creature you can see attacks a target other than you within 5 ft." },
                { text: "Use a shield to impose disadvantage on the attack roll." }
              ]
            }
          ]
        },
        {
          key: "resting",
          title: "Resting & Recovery",
          description: "Track how downtime restores abilities under SRD 5.1 with 2024 previews for bastions.",
          columns: ["Rest", "Duration", "Benefits", "Limitations"],
          rows: [
            {
              cells: [
                { text: "Short Rest", tag: "1+ hr" },
                { text: "At least 1 hour", tag: "Time" },
                { text: "Spend Hit Dice, recharge short-rest features." },
                { text: "Interruptions of strenuous activity reset the rest." }
              ]
            },
            {
              cells: [
                { text: "Long Rest", tag: "8 hr" },
                { text: "8 hours (6 resting, 2 light activity)", tag: "Time" },
                { text: "Regain all Hit Dice, half HD spent, long-rest abilities, reset spell slots." },
                { text: "One long rest per 24 hours; ending early grants no benefits." }
              ]
            },
            {
              cells: [
                { text: "Bastion Turn", tag: "2024" },
                { text: "1 week of downtime", tag: "Time" },
                { text: "Advance bastion projects, recruit retainers, or craft boons per 2024 DMG preview." },
                { text: "Requires bastion ownership and a secure location." }
              ]
            }
          ]
        },
        {
          key: "skillChallenges4e",
          title: "4e Skill Challenge Difficulty",
          description: "Baseline difficulty classes for 4e-style skill challenges by tier.",
          caption: "After determining the party's level, add half that level (rounded down) to the listed base DCs.",
          columns: ["Tier", "Level Range", "Moderate DC", "Hard DC", "Guidance"],
          rows: [
            {
              cells: [
                { text: "Heroic", tag: "4e" },
                { text: "Levels 1-10" },
                { text: "Base 10 + 1/2 level" },
                { text: "Base 15 + 1/2 level" },
                { text: "Use for neighborhood intrigue, wilderness travel, or early dungeon delves." }
              ]
            },
            {
              cells: [
                { text: "Paragon", tag: "4e" },
                { text: "Levels 11-20" },
                { text: "Base 12 + 1/2 level" },
                { text: "Base 19 + 1/2 level" },
                { text: "Represents complex political plays, planar journeys, and mid-campaign climaxes." }
              ]
            },
            {
              cells: [
                { text: "Epic", tag: "4e" },
                { text: "Levels 21-30" },
                { text: "Base 14 + 1/2 level" },
                { text: "Base 23 + 1/2 level" },
                { text: "Reserved for world-shaping challenges and legendary foes." }
              ]
            }
          ]
        },
        {
          key: "xpBudget35e",
          title: "3.5e Encounter XP Budgets",
          description: "Quick encounter budgeting based on the 3.5e Dungeon Master's Guide encounter level guidance.",
          caption: "Multiply the suggested per-character XP by the party size, then match that total against CR values in the DMG.",
          columns: ["Encounter Type", "Recommended EL", "XP per Character", "Usage Notes"],
          rows: [
            {
              cells: [
                { text: "Easy warm-up", tag: "3.5e" },
                { text: "APL - 1" },
                { text: "~50 × party level" },
                { text: "Good for attrition and foreshadowing; minimal risk if resources are full." }
              ]
            },
            {
              cells: [
                { text: "Challenging", tag: "3.5e" },
                { text: "APL" },
                { text: "~75 × party level" },
                { text: "Standard encounter; expect to consume key spells or per-day abilities." }
              ]
            },
            {
              cells: [
                { text: "Very difficult", tag: "3.5e" },
                { text: "APL + 1" },
                { text: "~100 × party level" },
                { text: "Stack monsters or leverage terrain; plan escape routes for the party." }
              ]
            },
            {
              cells: [
                { text: "Overpowering", tag: "3.5e" },
                { text: "APL + 4" },
                { text: "120+ × party level" },
                { text: "Likely lethal without advantages; reserve for climactic showdowns." }
              ]
            }
          ]
        },
        {
          key: "legacySaves",
          title: "Legacy Saving Throw Matrix",
          description: "Quick reference for B/X and AD\u0026D-style saving throw targets at low levels.",
          caption: "Targets are the numbers characters must meet or beat on a d20; adjust for magic items or situational bonuses.",
          columns: ["Class & Edition", "Levels", "Death/Poison", "Wands", "Spells/Breath"],
          rows: [
            {
              cells: [
                { text: "Fighter (B/X)", tag: "B/X" },
                { text: "Levels 1-3" },
                { text: "12" },
                { text: "13" },
                { text: "15 / 16" }
              ]
            },
            {
              cells: [
                { text: "Cleric (B/X)", tag: "B/X" },
                { text: "Levels 1-3" },
                { text: "11" },
                { text: "12" },
                { text: "14 / 15" }
              ]
            },
            {
              cells: [
                { text: "Magic-User (B/X)", tag: "B/X" },
                { text: "Levels 1-3" },
                { text: "13" },
                { text: "14" },
                { text: "16 / 17" }
              ]
            },
            {
              cells: [
                { text: "Fighter (AD\u0026D 1e)", tag: "AD&D" },
                { text: "Levels 1-3" },
                { text: "14" },
                { text: "16" },
                { text: "17 / 18" }
              ]
            },
            {
              cells: [
                { text: "Cleric (AD\u0026D 1e)", tag: "AD&D" },
                { text: "Levels 1-3" },
                { text: "11" },
                { text: "12" },
                { text: "14 / 15" }
              ]
            },
            {
              cells: [
                { text: "Magic-User (AD\u0026D 1e)", tag: "AD&D" },
                { text: "Levels 1-3" },
                { text: "13" },
                { text: "14" },
                { text: "15 / 16" }
              ]
            }
          ]
        },
        {
          key: "cover",
          title: "Cover & Obscurement",
          description: "Apply cover bonuses when terrain shields combatants.",
          columns: ["Type", "AC Bonus", "Dex Save Bonus", "Notes"],
          rows: [
            {
              cells: [
                { text: "Half Cover", tag: "Partial" },
                { text: "+2" },
                { text: "+2" },
                { text: "Targets behind low walls, furniture, or medium creatures." }
              ]
            },
            {
              cells: [
                { text: "Three-Quarters Cover", tag: "Substantial" },
                { text: "+5" },
                { text: "+5" },
                { text: "Targets peering through arrow slits or behind portcullises." }
              ]
            },
            {
              cells: [
                { text: "Total Cover", tag: "Blocked" },
                { text: "—" },
                { text: "—" },
                { text: "Cannot be targeted directly; area effects may still apply." }
              ]
            },
            {
              cells: [
                { text: "Heavily Obscured", tag: "Vision" },
                { text: "—" },
                { text: "—" },
                { text: "Blocks vision, imposing the blinded condition for sight-based perception." }
              ]
            }
          ]
        },
        {
          key: "concentration",
          title: "Concentration at a Glance",
          description: "Remind casters how to maintain or lose ongoing magic.",
          columns: ["Event", "Check", "Result"],
          caption: "You can concentrate on only one spell at a time; starting a new one ends the previous effect.",
          rows: [
            {
              cells: [
                { text: "Take Damage", tag: "Save" },
                { text: "Constitution save DC 10 or half the damage (rounded up)." },
                { text: "Failure ends the spell immediately." }
              ]
            },
            {
              cells: [
                { text: "Take Another Concentration Spell", tag: "Cast" },
                { text: "—" },
                { text: "Beginning a new concentration spell ends the previous effect." }
              ]
            },
            {
              cells: [
                { text: "Become Incapacitated", tag: "Condition" },
                { text: "—" },
                { text: "Concentration ends automatically." }
              ]
            },
            {
              cells: [
                { text: "Environment Breaks Focus", tag: "Distraction" },
                { text: "DM may call for a Con save vs. relevant DC." },
                { text: "Use for violent motion, extreme weather, or similar SRD disruptions." }
              ]
            }
          ]
        }
      ];
