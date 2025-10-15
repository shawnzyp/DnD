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
        }
      ];
