export default [
        {
          name: "Commoner",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Any",
          challenge: "0",
          terrain: ["Urban", "Village", "Farmland"],
          role: ["Civilian", "Utility"],
          overview: "Everyday townsfolk, farmers, and artisans who populate settlements and provide the social backdrop to adventuring exploits.",
          signatureAbilities: [
            "Humble Tools: Improvised weapons and work gear sell the stakes of collateral damage in urban set pieces.",
            "Local Knowledge: Ready access to gossip, rumors, and regional navigation aids roleplay-heavy sessions.",
            "Mob Morale: Commoners gather as crowds that can cheer, riot, or stampede when manipulated by the party or villains."
          ],
          sources: [
            { label: "Basic Rules", url: "https://dnd.wizards.com/resources/basic-rules" },
            { label: "Curse of Strahd", url: "https://www.dndbeyond.com/sources/cos" }
          ]
        },
        {
          name: "Guard",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Any lawful",
          challenge: "1/8",
          crValue: 0.125,
          terrain: ["Urban", "Road", "Castle"],
          role: ["Soldier", "Sentry"],
          overview: "Town watch patrols and caravan defenders who anchor low-level encounters or reinforce morale scenes at the gates.",
          signatureAbilities: [
            "Formation Fighting: Shields interlock to grant cover bonuses to allies behind the line.",
            "Hold the Line: Opportunity attacks impose speed 0 on creatures they hit, keeping chokepoints sealed.",
            "Alarm Horn: Calls in reinforcements or escalates complications if the party allows a warning shout."
          ],
          sources: [
            { label: "Basic Rules", url: "https://dnd.wizards.com/resources/basic-rules" },
            { label: "Waterdeep: Dragon Heist", url: "https://www.dndbeyond.com/sources/wdh" }
          ]
        },
        {
          name: "Acolyte",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Any",
          challenge: "1/4",
          crValue: 0.25,
          terrain: ["Temple", "Urban", "Pilgrimage"],
          role: ["Support", "Utility"],
          overview: "Lay clergy and monastery healers who patch up adventurers, perform rites, and frame divine politics in social adventures.",
          signatureAbilities: [
            "Channel Aid: Cure wounds and sanctuary spells stabilize allies or NPCs before fights spiral.",
            "Religious Insight: Advantage on Religion checks reveals relic lore and bypasses faith-based wards.",
            "Processional Escort: Ritual presence grants parties safe passage through sacred districts when properly entreated."
          ],
          sources: [
            { label: "Basic Rules", url: "https://dnd.wizards.com/resources/basic-rules" },
            { label: "Baldur's Gate: Descent into Avernus", url: "https://www.dndbeyond.com/sources/bgdia" }
          ]
        },
        {
          name: "Sahuagin Raider",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Lawful evil",
          challenge: "1/2",
          crValue: 0.5,
          terrain: ["Coastal", "Reef", "Undersea"],
          role: ["Skirmisher", "Raider"],
          overview: "Shark-worshiping sea devils that attack ports under cover of waves, dragging victims into the surf for sacrifice.",
          signatureAbilities: [
            "Blood Frenzy: Gains attack advantage against wounded foes, accelerating attrition aboard sinking ships.",
            "Amphibious Assault: Swim speed and underwater breathing let the raider strike from submerged trenches.",
            "Shark Telepathy: Commands local sharks as living hazards or distractions against naval crews."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Ghosts of Saltmarsh", url: "https://www.dndbeyond.com/sources/gos" }
          ]
        },
        {
          name: "Giant Octopus",
          size: "Large",
          creatureType: "Beast",
          alignment: "Unaligned",
          challenge: "1",
          terrain: ["Undersea", "Coastal", "Reef"],
          role: ["Controller", "Ambusher"],
          overview: "Deceptively intelligent cephalopods that drag ships' crews overboard and fill caverns with inky concealment.",
          signatureAbilities: [
            "Tentacle Grapple: Restrains targets while the beast retreats into kelp forests or tidal caves.",
            "Ink Cloud (Recharges on Short Rest): Obscures water around it, granting advantage to allies familiar with the terrain.",
            "Camouflaged Hide: Advantage on Stealth checks makes the octopus an ideal ambush predator for underwater chases."
          ],
          sources: [
            { label: "Basic Rules", url: "https://dnd.wizards.com/resources/basic-rules" },
            { label: "Monster Manual (1e)", url: "https://www.dmsguild.com/product/17004/Monster-Manual-1e" }
          ]
        },
        {
          name: "Aboleth",
          size: "Large",
          creatureType: "Aberration",
          alignment: "Lawful evil",
          challenge: "10",
          terrain: ["Undersea", "Underdark", "Sunken City"],
          role: ["Solo", "Controller"],
          overview: "Ancient psionic leviathans that enslave coastal populations and hoard primordial memories beneath the waves.",
          signatureAbilities: [
            "Enslavement Rays: Charms multiple targets at range, turning allied sailors against each other mid-fight.",
            "Mucous Cloud: On-hit disease reshapes victims into aquatic servants unless cured quickly.",
            "Lair Phantasms: Regional effects and lair actions flood chambers or manifest illusory duplicates for mind games."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monster Manual (1e)", url: "https://www.dmsguild.com/product/17004/Monster-Manual-1e" }
          ]
        },
        {
          name: "Adult Black Dragon",
          size: "Huge",
          creatureType: "Dragon",
          alignment: "Chaotic evil",
          challenge: "14",
          terrain: ["Swamp", "Coastal"],
          role: ["Solo", "Controller"],
          overview: "A patient tyrant that lurks in fetid marshes, reshaping the landscape with acid and dominating local tribes as expendable scouts.",
          signatureAbilities: [
            "Acid Breath (Recharge 5–6): Unleashes a corrosive line that eats through ranks and cover alike, forcing Dexterity saves for half damage.",
            "Amphibious Ambusher: A swim speed and superior darkvision let the dragon strike from underwater tunnels or night skies without warning.",
            "Legendary Actions: Wing beats, tail lashes, and perception sweeps keep the dragon airborne and responsive between turns."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monstrous Manual (AD&D 2e)", url: "https://www.dmsguild.com/product/17171/Monstrous-Compendium--Volume-One-and-Two" }
          ]
        },
        {
          name: "Behir",
          size: "Huge",
          creatureType: "Monstrosity",
          alignment: "Neutral evil",
          challenge: "11",
          terrain: ["Mountain", "Underdark"],
          role: ["Skirmisher", "Striker"],
          overview: "Serpentine predators that coil around storm-lashed peaks or deep caverns, hunting with sudden pounces and lightning blasts.",
          signatureAbilities: [
            "Multiattack & Swallow: Claws and bites restrain prey so the behir can swallow and keep fighting with a belly full of heroes.",
            "Lightning Breath (Recharge 5–6): A focused blast that punishes tightly packed parties climbing a ridge or tunnel.",
            "Spider Climb: Its innate climbing lets it ambush from ceilings, cliffs, or stalagmites far from melee reprisal."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monster Manual (1e)", url: "https://www.dmsguild.com/product/17004/Monster-Manual-1e" }
          ]
        },
        {
          name: "Lava Tube Collapse",
          size: "Gargantuan",
          creatureType: "Environmental Hazard",
          alignment: "Unaligned",
          challenge: "5",
          terrain: ["Volcanic", "Dungeon", "Underdark"],
          role: ["Hazard", "Controller"],
          overview: "Volcanic caverns primed to crumble when disturbed, creating rolling boulder waves and magma spills that reshape encounters.",
          signatureAbilities: [
            "Triggered Collapse: Falling debris forces Dexterity saves or restrains characters beneath rubble.",
            "Magma Flood: On initiative count 20 releases lava surges, dealing ongoing fire damage in affected zones.",
            "Choking Fumes: Reduces visibility and imposes exhaustion on creatures lingering without protection."
          ],
          sources: [
            { label: "Dungeon Master's Guide", url: "https://www.dndbeyond.com/sources/dmg" },
            { label: "Princes of the Apocalypse", url: "https://www.dndbeyond.com/sources/pota" }
          ]
        },
        {
          name: "Frost Giant",
          size: "Huge",
          creatureType: "Giant",
          alignment: "Neutral evil",
          challenge: "8",
          terrain: ["Arctic", "Mountain"],
          role: ["Brute", "Soldier"],
          overview: "Raid leaders from the frozen north who wield great axes like siege engines and command loyal winter wolves.",
          signatureAbilities: [
            "Greataxe Strikes: High damage per swing makes the giant a threat to any front-liner without strong defenses.",
            "Rock Hurling: Giants keep pressure on distant foes or fortifications with improvised boulders.",
            "Frigid Resilience: Cold immunity and hardy saves let them ignore many Arctic hazards the party relies on."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Against the Giants (1e)", url: "https://www.dmsguild.com/product/17035/G1-3-Against-the-Giants-1e" }
          ]
        },
        {
          name: "Gelatinous Cube",
          size: "Large",
          creatureType: "Ooze",
          alignment: "Unaligned",
          challenge: "2",
          terrain: ["Dungeon", "Underdark"],
          role: ["Controller", "Hazard"],
          overview: "Transparent dungeon sweepers that dissolve gear and creatures alike while sliding silently through corridors.",
          signatureAbilities: [
            "Engulf: Creatures sharing its space are paralyzed and dissolved, making tight halls terrifying chokepoints.",
            "Transparent Form: Without careful perception checks the cube remains unseen until it strikes.",
            "Pseudopod Reach: Extends to capture stragglers or retrieve suspended treasure from within."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "d20 SRD", url: "https://www.d20srd.org/srd/monsters/gelatinousCube.htm" }
          ]
        },
        {
          name: "Quicksand Sinkfield",
          size: "Large",
          creatureType: "Environmental Hazard",
          alignment: "Unaligned",
          challenge: "1/2",
          crValue: 0.5,
          terrain: ["Desert", "Swamp", "Jungle"],
          role: ["Hazard", "Controller"],
          overview: "Treacherous patches of quicksand that drag creatures beneath the surface, complicating pursuits and ambushes.",
          signatureAbilities: [
            "Suffocating Pull: Restrained creatures sink deeper each round without aid, risking suffocation.",
            "Hidden Surface: Requires high Perception or Survival checks to spot before entering the hazard zone.",
            "Lure Prey: Often baited with loot or bait monsters to drag adventurers into traps."
          ],
          sources: [
            { label: "Dungeon Master's Guide", url: "https://www.dndbeyond.com/sources/dmg" },
            { label: "Tomb of Annihilation", url: "https://www.dndbeyond.com/sources/toa" }
          ]
        },
        {
          name: "Kobold Saboteur",
          size: "Small",
          creatureType: "Humanoid",
          alignment: "Lawful evil",
          challenge: "1/8",
          crValue: 0.125,
          terrain: ["Dungeon", "Mountain"],
          role: ["Skirmisher", "Trapmaker"],
          overview: "Pack hunters that soften intruders with sling stones, traps, and clever tactics before darting into narrow tunnels.",
          signatureAbilities: [
            "Pack Tactics: Gains advantage when swarming a foe alongside another ally.",
            "Saboteur's Satchel: Carries caltrops, oil, and noise-makers to delay pursuit.",
            "Nimble Escape: Uses bonus actions to hide or disengage after laying snares."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Volo's Guide to Monsters", url: "https://www.dndbeyond.com/sources/vgm" }
          ]
        },
        {
          name: "Wolf",
          size: "Medium",
          creatureType: "Beast",
          alignment: "Unaligned",
          challenge: "1/4",
          crValue: 0.25,
          terrain: ["Forest", "Tundra", "Grassland"],
          role: ["Skirmisher", "Tracker"],
          overview: "Pack hunters that pressure scouting parties; SRD profiles mirror B/X wolves while 4e Monster Vault highlights their teamwork-driven mobility.",
          signatureAbilities: [
            "Pack Tactics: Advantage when adjacent to an ally underscores their encircling tactics for exploration-era ambushes.",
            "Keen Hearing and Smell: Grants advantage on Perception checks, reinforcing tracking scenes across editions.",
            "Trip on a Bite: On-hit Strength saves knock prey prone, encouraging quick resolutions before reinforcements arrive."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Rules Cyclopedia", url: "https://www.dmsguild.com/product/17171/Rules-Cyclopedia-Basic" }
          ]
        },
        {
          name: "Giant Spider",
          size: "Large",
          creatureType: "Beast",
          alignment: "Unaligned",
          challenge: "1",
          terrain: ["Forest", "Underdark", "Ruins"],
          role: ["Controller", "Ambusher"],
          overview: "Ceiling-crawling predators whose web cocoons foreshadow subterranean lairs; 4e Monster Vault venom riders inspire modern restraint conditions.",
          signatureAbilities: [
            "Web (Recharge 5–6): Ranged restraint enforces positioning puzzles for exploration-heavy crawls.",
            "Spider Climb: Ignores vertical obstacles, letting it strike from unseen perches and escape pursuit.",
            "Poisoned Fangs: On-hit Constitution saves deal ongoing poison damage, echoing AD&D's paralytic fangs."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monster Vault (4e)", url: "https://www.dmsguild.com/product/177603/Monster-Vault-Threats-to-the-Nentir-Vale-4e" }
          ]
        },
        {
          name: "Giant Eagle",
          size: "Large",
          creatureType: "Beast",
          alignment: "Neutral good",
          challenge: "1",
          terrain: ["Mountain", "Coastal", "Sky"],
          role: ["Scout", "Support"],
          overview: "Intelligent raptors that ferry heroes or reconnoiter wilderness routes; their cooperative instincts date back to Tolkien-inspired OD&D entries.",
          signatureAbilities: [
            "Keen Sight: Advantage on sight-based Perception bolsters aerial reconnaissance for sandbox expeditions.",
            "Flyby Support: High speed and dive attacks let them harry foes then withdraw without provoking opportunity attacks, mirroring 2024 exploration tweaks.",
            "Allied Speech: Communicate with characters who know a language, reinforcing negotiation options with nature allies."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monster Manual (1e)", url: "https://www.dmsguild.com/product/17004/Monster-Manual-1e" }
          ]
        },
        {
          name: "Boar",
          size: "Medium",
          creatureType: "Beast",
          alignment: "Unaligned",
          challenge: "1/4",
          crValue: 0.25,
          terrain: ["Forest", "Grassland", "Swamp"],
          role: ["Brute", "Hazard"],
          overview: "Ill-tempered foragers whose charges complicate hunting expeditions; OD&D to 2024 stat blocks emphasize their relentless endurance.",
          signatureAbilities: [
            "Charge: Closing 20 feet adds damage and can knock creatures prone, stressing bushwhack tactics.",
            "Relentless (Recharges after a Short Rest): Prevents the boar from dropping below 1 hp once, mirroring AD&D ferocity.",
            "Tusk Gore: Steady damage output punishes careless low-level explorers moving through dense undergrowth."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Rules Cyclopedia", url: "https://www.dmsguild.com/product/17171/Rules-Cyclopedia-Basic" }
          ]
        },
        {
          name: "Skeleton Archer",
          size: "Medium",
          creatureType: "Undead",
          alignment: "Lawful evil",
          challenge: "1/4",
          crValue: 0.25,
          terrain: ["Dungeon", "Desert", "Ruins"],
          role: ["Artillery"],
          overview: "Reanimated archers that hold defensible chokepoints while their necromancer masters advance with melee troops.",
          signatureAbilities: [
            "Sharpened Volley: Longbows pepper the backline with reliable piercing damage.",
            "Undead Fortitude: Keeps the archer fighting through blows that would drop living soldiers.",
            "Siege Awareness: Ignores sleep and fear, ideal for long sieges and midnight assaults."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Rules Cyclopedia", url: "https://www.dmsguild.com/product/17171/Rules-Cyclopedia-Basic" }
          ]
        },
        {
          name: "Orc Raider",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Chaotic evil",
          challenge: "1/2",
          crValue: 0.5,
          terrain: ["Grassland", "Mountain", "Tundra"],
          role: ["Brute", "Skirmisher"],
          overview: "Shock troops that close quickly with greataxes and aggressive charges to overwhelm frontier settlements.",
          signatureAbilities: [
            "Aggressive: Covers extra ground each round to stay in melee with fleeing targets.",
            "Relentless Endurance: Survives finishing blows long enough to retreat or retaliate.",
            "Tribal War Calls: Uses bonus actions to grant advantage on the next attack for nearby orcs."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monster Manual (1e)", url: "https://www.dmsguild.com/product/17004/Monster-Manual-1e" }
          ]
        },
        {
          name: "Bandit Captain",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Any non-lawful",
          challenge: "2",
          terrain: ["Urban", "Forest", "Coastal"],
          role: ["Leader", "Striker"],
          overview: "Seasoned raiders that coordinate ambushes, leverage multiattack, and direct minions with ruthless efficiency.",
          signatureAbilities: [
            "Parry: Uses reactions to turn away a crucial hit while allies reposition.",
            "Multiattack: Combines scimitar and dagger strikes to threaten lightly armored foes.",
            "Tactical Orders: Grants allied bandits a bonus to damage when focusing fire on a single hero."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Ghosts of Saltmarsh", url: "https://www.dndbeyond.com/sources/gos" }
          ]
        },
        {
          name: "Cult Fanatic",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Any evil",
          challenge: "2",
          terrain: ["Urban", "Dungeon"],
          role: ["Support", "Caster"],
          overview: "Devoted priests who combine dagger strikes with dark prayers, bolstering cult cells during infiltration missions.",
          signatureAbilities: [
            "Dark Blessing: Imbues allies with temporary hit points before combat erupts.",
            "Inflict Wounds: Delivers swingy burst damage to punish distracted defenders.",
            "Fanatic Zeal: Fights to the death and triggers morale bonuses for surviving cultists."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Princes of the Apocalypse", url: "https://www.dndbeyond.com/sources/pota" }
          ]
        },
        {
          name: "Veteran Sellsword",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Any",
          challenge: "3",
          terrain: ["Urban", "Road", "Siege"],
          role: ["Soldier", "Bodyguard"],
          overview: "Battle-tested mercenaries wielding sword and crossbow, often hired to defend caravans or noble envoys.",
          signatureAbilities: [
            "Crossbow Volley: Opens with a heavy crossbow before closing to melee.",
            "Second Wind: Recovers hit points mid-fight to stay in the fray longer than green troops.",
            "Formation Fighter: Grants advantage on opportunity attacks when fighting shoulder-to-shoulder."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Waterdeep: Dragon Heist", url: "https://www.dndbeyond.com/sources/wdh" }
          ]
        },
        {
          name: "Owlbear Matriarch",
          size: "Large",
          creatureType: "Monstrosity",
          alignment: "Unaligned",
          challenge: "3",
          terrain: ["Forest", "Ruin", "Frontier"],
          role: ["Solo", "Brute"],
          overview: "Seasoned owlbears that fiercely defend hunting ranges, turning woodland clearings into frantic close-quarters brawls.",
          signatureAbilities: [
            "Rending Beak and Claws: Multiattack bursts that rip through lightly armored characters caught away from allies.",
            "Ferocious Charge: Doubles movement through undergrowth, letting the matriarch crash into backlines despite difficult terrain.",
            "Bloodcurdling Screech: Once per encounter can frighten intruders, buying a round to reposition cubs or finish prey."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/owlbear" },
            { label: "Tales from the Yawning Portal", url: "https://www.dndbeyond.com/sources/tftyp" }
          ]
        },
        {
          name: "Wraith",
          size: "Medium",
          creatureType: "Undead",
          alignment: "Neutral evil",
          challenge: "5",
          terrain: ["Dungeon", "Shadowfell", "Graveyard"],
          role: ["Skirmisher", "Controller"],
          overview: "Malevolent spirits that drain life and spawn specters, perfect for set pieces in haunted keeps.",
          signatureAbilities: [
            "Life Drain: On a failed save, reduces hit point maximum, terrifying even seasoned parties.",
            "Incorporeal Movement: Phases through walls to attack backlines or retreat through sealed crypts.",
            "Create Specter: Fallen heroes might rise as minions, escalating drawn-out fights."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monster Manual (1e)", url: "https://www.dmsguild.com/product/17004/Monster-Manual-1e" }
          ]
        },
        {
          name: "Banshee",
          size: "Medium",
          creatureType: "Undead",
          alignment: "Chaotic evil",
          challenge: "4",
          terrain: ["Ruin", "Forest", "Shadowfell"],
          role: ["Solo", "Controller"],
          overview: "Vengeful spirits whose wails topple heroes in a single action, ideal for gothic set pieces and haunted barrows.",
          signatureAbilities: [
            "Wail of the Banshee: Area save-or-drop effect that forces parties to respect initiative and positioning.",
            "Horrifying Visage: Frightens intruders to scatter the formation before the killing scream.",
            "Incorporeal Movement: Glides through walls to strike support characters or withdraw into crypt alcoves."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/banshee" },
            { label: "Curse of Strahd", url: "https://www.dndbeyond.com/sources/cos" }
          ]
        },
        {
          name: "Bulette",
          size: "Large",
          creatureType: "Monstrosity",
          alignment: "Unaligned",
          challenge: "5",
          terrain: ["Grassland", "Underground", "Farmland"],
          role: ["Solo", "Brute"],
          overview: "Territorial land sharks that erupt from beneath unsuspecting travelers, splintering wagon lines and supply trains.",
          signatureAbilities: [
            "Deadly Leap: Area knockdown and damage punishes clustered explorers when the bulette bursts from the earth.",
            "Burrowing Ambush: Tremorsense and burrow speed let it set up surprise rounds beneath patrol routes.",
            "Thick Carapace: High AC and damage resistances prolong the fight against mid-level martial parties."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/bulette" },
            { label: "Storm King's Thunder", url: "https://www.dndbeyond.com/sources/skt" }
          ]
        },
        {
          name: "Yuan-ti Malison",
          size: "Medium",
          creatureType: "Monstrosity",
          alignment: "Neutral evil",
          challenge: "5",
          terrain: ["Jungle", "Temple", "Swamp"],
          role: ["Controller", "Caster"],
          overview: "Serpentine masterminds that blend swordplay with venomous magic to defend hidden temples.",
          signatureAbilities: [
            "Multiattack: Strikes with scimitars and venomous bites to lock down front-liners.",
            "Innate Spellcasting: Access to suggestion and hold person keeps heroes off-balance.",
            "Shapechanging: Infiltrates humanoid societies before revealing serpentine forms."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Tomb of Annihilation", url: "https://www.dndbeyond.com/sources/toa" }
          ]
        },
        {
          name: "Chimera",
          size: "Large",
          creatureType: "Monstrosity",
          alignment: "Chaotic evil",
          challenge: "6",
          terrain: ["Mountain", "Badlands", "Ruins"],
          role: ["Solo", "Artillery"],
          overview: "Three-headed terrors whose breath weapon and pounce make them signature bosses for mid-tier wilderness expeditions.",
          signatureAbilities: [
            "Multiheaded Fury: Triple attacks chew through tanks while keeping pressure on exposed flanks.",
            "Fire Breath (Recharge 5–6): Cone attack punishes clumped foes scrambling over difficult rocky slopes.",
            "Aerial Dive: Short flight lets the chimera leap canyons or retreat to unreachable ledges."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/chimera" },
            { label: "Mythic Odysseys of Theros", url: "https://www.dndbeyond.com/sources/moot" }
          ]
        },
        {
          name: "Shield Guardian",
          size: "Large",
          creatureType: "Construct",
          alignment: "Unaligned",
          challenge: "7",
          terrain: ["Urban", "Dungeon", "Arcane Laboratory"],
          role: ["Solo", "Defender"],
          overview: "Runed bodyguards bound to arcane amulets, ideal for single-enemy showdowns that stretch the party's endurance.",
          signatureAbilities: [
            "Arcane Shielding: Absorbs spell damage for its master, complicating mage-duel encounters.",
            "Regeneration Matrix: Regains hit points each round, forcing adventurers to focus fire.",
            "Stored Spells: Releases prepared magic like fireball or lightning bolt mid-fight for dramatic swings."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/shield-guardian" },
            { label: "Eberron: Rising from the Last War", url: "https://www.dndbeyond.com/sources/erlw" }
          ]
        },
        {
          name: "Githyanki Knight",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Lawful evil",
          challenge: "8",
          terrain: ["Astral Sea", "Planar Stronghold"],
          role: ["Elite", "Striker"],
          overview: "Astral raiders who lead silver-sword charges from red dragons or spelljamming ships.",
          signatureAbilities: [
            "Silver Greatsword: Carves through planar foes and severs astral cords.",
            "Innate Psionics: Casts plane shift and telekinesis to reposition the battlefield.",
            "Martial Advantage: Deals extra damage when allies surround a target."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Mordenkainen Presents", url: "https://www.dndbeyond.com/sources/mpmm" }
          ]
        },
        {
          name: "Mind-Rending Psychic Maelstrom",
          size: "Gargantuan",
          creatureType: "Environmental Hazard",
          alignment: "Unaligned",
          challenge: "8",
          terrain: ["Far Realm", "Planar Rift", "Underdark"],
          role: ["Hazard", "Controller"],
          overview: "Reality-twisting storms of psionic energy that lash intruders with confusion and planar backlash in aberrant lairs.",
          signatureAbilities: [
            "Psychic Shear: Targets all creatures each round with Intelligence saves or short-term madness.",
            "Gravity Collapse: Warps space to pull victims toward the rift, dealing force damage on impact.",
            "Aberrant Echoes: Summons spectral tentacles that grapple and restrain anyone who fails concentration checks."
          ],
          sources: [
            { label: "Dungeon Master's Guide", url: "https://www.dndbeyond.com/sources/dmg" },
            { label: "Mordenkainen Presents", url: "https://www.dndbeyond.com/sources/mpmm" }
          ]
        },
        {
          name: "Archmage",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Any",
          challenge: "12",
          terrain: ["Urban", "Arcane Tower", "Planar"],
          role: ["Elite", "Controller"],
          overview: "Supreme spellcasters whose layered defenses, contingency magic, and apprentices create intricate boss encounters.",
          signatureAbilities: [
            "Spell Mastery: Access to shield, counterspell, and globe of invulnerability keeps martial characters at bay.",
            "Legendary Preparations: Scripts combat with pre-cast glyphs and summoned elementals before the party arrives.",
            "Planar Escape: Teleport and plane shift options allow retreat or reinforcements if the battle turns."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/archmage" },
            { label: "Waterdeep: Dungeon of the Mad Mage", url: "https://www.dndbeyond.com/sources/wdotmm" }
          ]
        },
        {
          name: "Young Red Dragon",
          size: "Large",
          creatureType: "Dragon",
          alignment: "Chaotic evil",
          challenge: "10",
          terrain: ["Mountain", "Volcano"],
          role: ["Solo", "Artillery"],
          overview: "Volcanic tyrants that claim tribute from mountainside villages while raining fire upon rivals.",
          signatureAbilities: [
            "Fire Breath (Recharge 5–6): Cone of fire devastates clustered adventurers.",
            "Frightful Presence: Forces morale checks that can scatter low-level retainers.",
            "Molten Lair Actions: Melts footing or spews magma vents inside its lair."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Dragonlance Campaign Setting", url: "https://www.dmsguild.com/product/36821/Dragonlance-Campaign-Setting" }
          ]
        },
        {
          name: "Stone Golem",
          size: "Large",
          creatureType: "Construct",
          alignment: "Unaligned",
          challenge: "10",
          terrain: ["Dungeon", "Temple"],
          role: ["Defender", "Solo"],
          overview: "Runic guardians carved from granite that obey ancient commands and shrug off most magic.",
          signatureAbilities: [
            "Immutable Form: Immune to many effects that would disable living guards.",
            "Slow Gaze: Recharges a cone that hinders quick-moving parties.",
            "Magic Resistance: Advantage on saves keeps the golem standing amid spell barrages."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "d20 SRD", url: "https://www.d20srd.org/srd/monsters/golem.htm" }
          ]
        },
        {
          name: "Adult Bronze Dragon",
          size: "Huge",
          creatureType: "Dragon",
          alignment: "Lawful good",
          challenge: "15",
          terrain: ["Coastal", "Undersea Caves", "Storm"],
          role: ["Solo", "Elite"],
          overview: "Strategic dragon guardians who combine flight, lightning, and control over tides to defend coastal communities.",
          signatureAbilities: [
            "Lightning Breath (Recharge 5–6): Line attack shreds enemy spellcasters aboard ships or in seaside keeps.",
            "Repulsion Breath: Pushes invading troops into traps, cliffs, or the sea.",
            "Change Shape: Infiltrates courts to set up intrigue before revealing draconic might."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/adult-bronze-dragon" },
            { label: "Fizban's Treasury of Dragons", url: "https://www.dndbeyond.com/sources/ftod" }
          ]
        },
        {
          name: "Storm Giant Quintessent",
          size: "Huge",
          creatureType: "Giant",
          alignment: "Chaotic good",
          challenge: "16",
          terrain: ["Coastal", "Planar", "Storm"],
          role: ["Solo", "Controller"],
          overview: "Elemental avatars of the tempest that stride storms as living thunderheads, defending giant realms from titanic threats.",
          signatureAbilities: [
            "Arc Lightning: Strikes two targets at once with searing storm bolts.",
            "Tempestuous Touch: Forces Strength saves to avoid being hurled from cliffs.",
            "Mythic Lair Actions: Summons cyclone walls and hurricane-force winds each round."
          ],
          sources: [
            { label: "Mordenkainen Presents", url: "https://www.dndbeyond.com/sources/mpmm" },
            { label: "Storm King's Thunder", url: "https://www.dndbeyond.com/sources/skt" }
          ]
        },
        {
          name: "Death Knight",
          size: "Medium",
          creatureType: "Undead",
          alignment: "Lawful evil",
          challenge: "17",
          terrain: ["Ruin", "Shadowfell", "Battlefield"],
          role: ["Elite", "Soldier"],
          overview: "Cursed paladins clad in obsidian plate, leading undead legions with devastating smites and unholy magic.",
          signatureAbilities: [
            "Hellfire Orb: Once-per-day burst that inflicts massive fire and necrotic damage on tightly packed squads.",
            "Parry & Spell Resistance: Defensive suite lets the knight duel player characters toe-to-toe.",
            "Command Undead: Rallies surrounding undead minions, creating layered encounter waves."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/death-knight" },
            { label: "Adventures in the Forgotten Realms", url: "https://magic.wizards.com/en/products/dungeons-dragons-adventures-forgotten-realms" }
          ]
        },
        {
          name: "Goblin Boss",
          size: "Small",
          creatureType: "Humanoid",
          alignment: "Neutral evil",
          challenge: "1",
          terrain: ["Forest", "Cavern", "Urban"],
          role: ["Leader", "Skirmisher"],
          overview: "Cunning commanders who weaponize mobility and minions to harry caravans before slipping back into the dark.",
          signatureAbilities: [
            "Redirect Attack: Uses nearby goblins as unwilling shields to blunt incoming blows.",
            "Multiattack: Combines scimitar and dagger strikes for swingy burst damage on isolated targets.",
            "Nimble Escape: Bonus-action Disengage or Hide keeps the boss alive long enough to rally reinforcements."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Basic Rules", url: "https://dnd.wizards.com/resources/basic-rules" }
          ]
        },
        {
          name: "Treant",
          size: "Huge",
          creatureType: "Plant",
          alignment: "Chaotic good",
          challenge: "9",
          terrain: ["Forest"],
          role: ["Defender", "Support"],
          overview: "Ancient guardians of woodland realms who animate allies and reshape the battlefield with living roots.",
          signatureAbilities: [
            "Animate Trees: Calls nearby trees into battle, turning a clearing into a crowd of allied bludgeons.",
            "Slam Attacks: Heavy melee swings crush siege gear and punish fire-bearing intruders.",
            "Siege Monster: Deals double damage to structures, making treants ideal for defending or toppling fortifications."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "d20 SRD", url: "https://www.d20srd.org/srd/monsters/treant.htm" }
          ]
        },
        {
          name: "Pit Fiend General",
          size: "Large",
          creatureType: "Fiend",
          alignment: "Lawful evil",
          challenge: "20",
          terrain: ["Nine Hells", "Volcanic", "Siege"],
          role: ["Elite", "Commander"],
          overview: "Diabolical warlords who orchestrate infernal sieges, commanding legions while crushing foes with infernal might.",
          signatureAbilities: [
            "Infernal Command: Grants nearby devils bonus damage and temp HP, multiplying encounter difficulty.",
            "Multiattack with Gout of Flame: Tail, bite, mace, and fireball keep pressure across multiple ranges.",
            "Summon Devils: Calls reinforcements mid-fight to escalate prolonged battles."
          ],
          sources: [
            { label: "Monster Manual (5e)", url: "https://www.dndbeyond.com/monsters/pit-fiend" },
            { label: "Baldur's Gate: Descent into Avernus", url: "https://www.dndbeyond.com/sources/bgdia" }
          ]
        },
        {
          name: "Lich",
          size: "Medium",
          creatureType: "Undead",
          alignment: "Any evil",
          challenge: "21",
          terrain: ["Dungeon", "Urban", "Shadowfell"],
          role: ["Solo", "Artillery"],
          overview: "Immortal spellcasters who trade mortality for arcane supremacy, defending phylacteries with layered wards and minions.",
          signatureAbilities: [
            "Paralyzing Touch: A chilling melee strike that locks down foes for follow-up spells.",
            "Legendary Resistance & Actions: Ensures the lich maintains control of the battlefield despite control effects.",
            "Spellcasting Arsenal: Access to high-level necromancy and control magic lets the lich script entire encounters."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "d20 SRD", url: "https://www.d20srd.org/srd/monsters/lich.htm" }
          ]
        },
        {
          name: "Kraken",
          size: "Gargantuan",
          creatureType: "Monstrosity",
          alignment: "Chaotic evil",
          challenge: "23",
          terrain: ["Ocean", "Storm", "Deep Sea Trench"],
          role: ["Solo", "Siege"],
          overview: "World-wrecking leviathans that capsize fleets, conjure hurricanes, and elevate cults dedicated to primordial chaos.",
          signatureAbilities: [
            "Thunderous Tentacles: Multiattack grapples entire crews while dealing crushing damage to vessels.",
            "Control Weather: Commands maelstroms that scatter support ships and batter coastal settlements.",
            "Lair Lightning: Regional storms and lair actions unleash bolts that punish characters lingering on exposed decks."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monster Manual (1e)", url: "https://www.dmsguild.com/product/17004/Monster-Manual-1e" }
          ]
        },
        {
          name: "Solar",
          size: "Large",
          creatureType: "Celestial",
          alignment: "Lawful good",
          challenge: "21",
          terrain: ["Heavenly", "Planar", "Sanctum"],
          role: ["Solo", "Champion"],
          overview: "Radiant generals of the Upper Planes whose interventions anchor peace accords and rescue missions for planar allies in peril.",
          signatureAbilities: [
            "Flame of Justice: Slaying longbow shots or greatsword strikes ignite foes while healing nearby allies, dramatizing the Solar's battlefield triage.",
            "Searing Burst: Channel divinity to detonate radiant shockwaves that cleanse fiendish influence without harming good-aligned forces.",
            "Lair & Regional Effects: Sanctified lairs grant sunlight and suppress charm or fear, reinforcing negotiation sanctuaries for epic diplomacy."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Mordenkainen Presents: Monsters of the Multiverse", url: "https://www.dndbeyond.com/sources/monsters-of-the-multiverse" }
          ]
        },
        {
          name: "Empyrean",
          size: "Huge",
          creatureType: "Celestial",
          alignment: "Chaotic good",
          challenge: "23",
          terrain: ["Planar", "Mythic Battlefield", "Sky"],
          role: ["Solo", "Support"],
          overview: "Children of the gods whose mood-driven miracles swing between wrath and mercy, often mediating cosmic truces with overwhelming presence.",
          signatureAbilities: [
            "Divine Might: Thunderous maul strikes or radiant bolts smite threats while bolstering sworn allies with temporary hit points.",
            "Legendary Miracle: Legendary actions reshape terrain with gusts, healing rains, or restraining vines, echoing One D&D 2024 preview tweaks.",
            "Regional Blessings: Domains around an empyrean radiate calm emotions, advantage on diplomacy checks, and difficult terrain for fiends."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Mordenkainen Presents: Monsters of the Multiverse", url: "https://www.dndbeyond.com/sources/monsters-of-the-multiverse" }
          ]
        },
        {
          name: "Ancient Gold Dragon",
          size: "Gargantuan",
          creatureType: "Dragon",
          alignment: "Lawful good",
          challenge: "24",
          terrain: ["Mountain", "Coastal", "Planar"],
          role: ["Solo", "Negotiator"],
          overview: "Benevolent dragon sages who arbitrate between kingdoms and celestials, inviting heroes into lairs that double as embassies to the heavens.",
          signatureAbilities: [
            "Weakening & Fire Breath: Alternating breath weapons debuff tyrants or purge undead, letting allies press the diplomatic advantage.",
            "Shape Change Diplomat: Assuming humanoid forms opens councils or infiltration missions with patient, ancient insight.",
            "Lair Concords: Lair actions conjure radiant auroras or restraining geysers that deter violence while negotiations proceed."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Fizban's Treasury of Dragons", url: "https://www.dndbeyond.com/sources/ftod" }
          ]
        },
        {
          name: "Ancient Silver Dragon",
          size: "Gargantuan",
          creatureType: "Dragon",
          alignment: "Lawful good",
          challenge: "23",
          terrain: ["Mountain", "Tundra", "Planar"],
          role: ["Solo", "Defender"],
          overview: "Chivalric guardians who shelter mortals from planar incursions, pairing sky patrols with wise counsel for epic treaty summits.",
          signatureAbilities: [
            "Paralyzing Breath: Nonlethal cone that incapacitates aggressors without derailing parley scenes, echoing 2024 mastery-friendly combat pacing.",
            "Protective Cloud: Cold breath freezes terrain into cover for allies while chilling fiends, and legendary wing beats reposition negotiators.",
            "Regional Effects: Mountain fastnesses gain everbright skies, safe weather, and teleportation wards that secure summit locations."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Mordenkainen Presents: Monsters of the Multiverse", url: "https://www.dndbeyond.com/sources/monsters-of-the-multiverse" }
          ]
        },
        {
          name: "Metallic Dragonborn Council",
          size: "Medium",
          creatureType: "Humanoid",
          alignment: "Neutral good",
          challenge: "18",
          terrain: ["Urban", "Citadel", "Planar"],
          role: ["Leader", "Support"],
          overview: "A conclave of metallic dragonborn emissaries wielding coordinated breath weapons and bastion resources to broker alliances between planes.",
          signatureAbilities: [
            "Council Volley: Coordinated breath strikes (acid, cold, fire, lightning) create zones keyed to weapon mastery riders that allies exploit.",
            "Battlefield Directives: Legendary reactions grant allies advantage on Diplomacy or Initiative checks, keeping peacekeepers a step ahead.",
            "Lair Logistics: Meeting halls function like bastions—granting safe teleport circles, regional aura of courage, and rapid planar reinforcement calls."
          ],
          sources: [
            { label: "Fizban's Treasury of Dragons", url: "https://www.dndbeyond.com/sources/ftod" },
            { label: "2024 Dungeon Master's Guide Preview", url: "https://www.dndbeyond.com/posts/1598-dungeon-masters-guide-2024-preview" }
          ]
        },
        {
          name: "Ancient Red Dragon",
          size: "Gargantuan",
          creatureType: "Dragon",
          alignment: "Chaotic evil",
          challenge: "24",
          terrain: ["Mountain", "Volcano", "Planar"],
          role: ["Solo", "Overlord"],
          overview: "The archetypal tyrant dragon whose volcanic dominion reshapes kingdoms, demanding tribute while immolating dissent.",
          signatureAbilities: [
            "Apocalyptic Fire Breath: 90-foot cone melts fortifications and forces entire warbands into cover or defeat.",
            "Relentless Legendary Actions: Wing attacks, frightening presence, and tail lashes keep heroes pinned under constant pressure.",
            "Regional Effects: Volcanic eruptions, cinder storms, and lair magma flows transform the battlefield into lethal hazards."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Tyranny of Dragons", url: "https://www.dndbeyond.com/sources/tyranny-of-dragons" }
          ]
        },
        {
          name: "Tarrasque",
          size: "Gargantuan",
          creatureType: "Monstrosity",
          alignment: "Unaligned",
          challenge: "30",
          terrain: ["Wasteland", "Mountain", "Urban"],
          role: ["Solo", "Siege"],
          overview: "The unstoppable apex predator whose rampages level civilizations, forcing entire nations into desperate alliances.",
          signatureAbilities: [
            "Reflective Carapace: Hurls spells back at casters, demanding creative tactics beyond raw arcana.",
            "Legendary Resilience: Legendary resistances and immunity to most conditions keep the titan active through control effects.",
            "Siege Rampage: Deals massive damage to structures while chaining bite, horn, and tail attacks across multiple targets, with swallow finishing stragglers."
          ],
          sources: [
            { label: "SRD 5.1", url: "https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf" },
            { label: "Monster Manual (1e)", url: "https://www.dmsguild.com/product/17004/Monster-Manual-1e" }
          ]
        }
      ];
