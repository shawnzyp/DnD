export default [
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
          name: "Kobold Saboteur",
          size: "Small",
          creatureType: "Humanoid",
          alignment: "Lawful evil",
          challenge: "1/8",
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
          name: "Skeleton Archer",
          size: "Medium",
          creatureType: "Undead",
          alignment: "Lawful evil",
          challenge: "1/4",
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
        }
      ];
