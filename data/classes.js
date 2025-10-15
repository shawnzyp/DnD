export default {
        "5e": [
          {
            name: "Barbarian",
            role: "Primal frontliner & damage sponge",
            primaryAbility: "Strength",
            hitDie: "d12",
            summary:
              "Unleash rage-fueled durability and explosive melee damage while shrugging off blows for the party.",
            signatureFeatures: [
              "Rage grants bonus damage and resistance to bludgeoning, piercing, and slashing damage",
              "Reckless Attack trades defense for advantage on heavy-hitting swings",
              "Danger Sense keeps you nimble against traps and area effects"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Barbarian",
                url: "https://www.dndbeyond.com/sources/srd/classes#Barbarian"
              }
            ],
            comparison: {
              note:
                "The One D&D 2024 Barbarian keeps Rage scaling but folds weapon mastery options directly into class progression, tightening the gap between primal and martial kits.",
              link: {
                label: "Playtest 8 Barbarian",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-8/barbarian"
              }
            },
            subclasses: [
              {
                name: "Path of the Totem Warrior",
                spotlight:
                  "Channel guardian spirits to tailor resistances, mobility, or pack tactics for your crew.",
                features: [
                  "Totem Spirit choices at 3rd level reshape defenses or positioning to match party needs",
                  "Aspect and Totemic Attunement scale exploration and social advantages with primal flavor"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to BECMI's Berserker-style fighter, the Totem Warrior layers narrative-driven spirit boons rather than flat attack bonuses.",
                  link: {
                    label: "SRD Totem Options",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#BarbarianPaths"
                  }
                }
              },
              {
                name: "Path of Wild Magic",
                spotlight:
                  "Ride chaotic surges that weave support, control, and extra damage into every rage.",
                features: [
                  "Wild Magic Surge table introduces unpredictable effects each time you rage",
                  "Bolstering Magic fuels allies with additional d3 bonuses reminiscent of 3.5e aid spells"
                ],
                sources: [
                  {
                    label: "Tasha's Cauldron of Everything",
                    url: "https://dnd.wizards.com/products/tashas-cauldron-everything"
                  }
                ],
                comparison: {
                  note:
                    "Shares the chaos niche with the 2024 Path of the World Tree but keeps surges swingier, so tables wanting steadier reliability might prefer the newer design.",
                  link: {
                    label: "World Tree Barbarian Preview",
                    url: "https://www.dndbeyond.com/posts/1560-barbarian-class-features-in-one-dnd"
                  }
                }
              }
            ]
          },
          {
            name: "Wizard",
            role: "Versatile arcane controller & utility expert",
            primaryAbility: "Intelligence",
            hitDie: "d6",
            summary:
              "Prepare spells from the largest arcane list, bending encounters with control, rituals, and raw damage.",
            signatureFeatures: [
              "Arcane Recovery refreshes spell slots on a short rest",
              "Spellbook preparation lets you flex answers for every arcane problem",
              "Traditions reward specialization without locking out generalist tools"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Wizard",
                url: "https://www.dndbeyond.com/sources/srd/classes#Wizard"
              }
            ],
            comparison: {
              note:
                "3.5e wizards juggle spell slots with metamagic costs; the 5e chassis trims bookkeeping but keeps iconic prep flexibility.",
              link: {
                label: "3.5 SRD Wizard",
                url: "https://www.d20srd.org/srd/classes/wizard.htm"
              }
            },
            subclasses: [
              {
                name: "School of Abjuration",
                spotlight:
                  "Shield allies with spell wards and absorb damage with a replenishing arcane ward.",
                features: [
                  "Arcane Ward temp HP functions like a portable spell battery for defense",
                  "Projected Ward lets you intercept hits, echoing 4e's defender mechanics"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "One D&D retools the ward to scale with proficiency, so legacy 5e abjurers may feel swingier but reward heavy spell-slot investment.",
                  link: {
                    label: "2024 Wizard Playtest",
                    url: "https://www.dndbeyond.com/sources/ua/ph-playtest-7/wizard"
                  }
                }
              },
              {
                name: "Bladesinging",
                spotlight:
                  "Blend swordplay and spellcasting with mobility boosts and defensive flourishes.",
                features: [
                  "Bladesong adds AC, speed, and concentration resilience for finesse builds",
                  "Extra Attack at 6th level mirrors 4e swordmage tactics without sacrificing high-level spells"
                ],
                sources: [
                  {
                    label: "Tasha's Cauldron of Everything",
                    url: "https://dnd.wizards.com/products/tashas-cauldron-everything"
                  }
                ],
                comparison: {
                  note:
                    "3.5e gish builds relied on prestige classes like Eldritch Knight; Bladesinging packages that chassis for faster table onboarding.",
                  link: {
                    label: "Eldritch Knight (3.5 SRD)",
                    url: "https://www.d20srd.org/srd/prestigeClasses/eldritchKnight.htm"
                  }
                }
              }
            ]
          }
        ],
        onednd: [
          {
            name: "Barbarian",
            role: "Weapon mastery bruiser",
            primaryAbility: "Strength",
            hitDie: "d12",
            summary:
              "Refined rage progression that locks in weapon masteries and streamlined defensive boosts.",
            signatureFeatures: [
              "Persistent rage that no longer ends automatically when incapacitated",
              "Weapon Mastery options let barbarians swap rider effects as they level",
              "Primal Knowledge grants utility skills to keep pace with 5e support classes"
            ],
            sources: [
              {
                label: "Player's Handbook (2024)",
                url: "https://www.dndbeyond.com/posts/1548-everything-we-know-about-the-2024-players-handbook"
              },
              {
                label: "UA Playtest 8",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-8/barbarian"
              }
            ],
            comparison: {
              note:
                "Legacy 5e barbarians must chase feats for mastery-like riders, while the 2024 chassis bakes them into class levels for parity with fighter options.",
              link: {
                label: "5e Barbarian SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Barbarian"
              }
            },
            subclasses: [
              {
                name: "Path of the World Tree",
                spotlight:
                  "Teleport allies and root foes with planar tendrils inspired by cosmic Yggdrasil lore.",
                features: [
                  "Aspect of the Tree grants short-range teleportation similar to 5e's Horizon Walker",
                  "Rage of the World Tree punishes movement, emulating Sentinel-style lockdown"
                ],
                sources: [
                  {
                    label: "UA Playtest 6",
                    url: "https://www.dndbeyond.com/sources/ua/ph-playtest-6/barbarian"
                  }
                ],
                comparison: {
                  note:
                    "Builds on 5e's Path of Wild Magic mobility but replaces random surges with deterministic ally repositioning for steadier teamwork.",
                  link: {
                    label: "Wild Magic Path (5e)",
                    url: "https://www.dndbeyond.com/sources/tcoe/subclasses-barbarian#PathoftheWildMagic"
                  }
                }
              },
              {
                name: "Path of the Zealot",
                spotlight:
                  "Channel divine wrath for relentless frontline pressure that is hard to keep down.",
                features: [
                  "Divine Fury adds radiant or necrotic riders on the first hit each turn",
                  "Zealous Presence offers party-wide advantage as a bonus action"
                ],
                sources: [
                  {
                    label: "Player's Handbook (2024)",
                    url: "https://www.dndbeyond.com/posts/1548-everything-we-know-about-the-2024-players-handbook"
                  }
                ],
                comparison: {
                  note:
                    "The 2024 update mirrors 5e's Zealot but explicitly ties resurrection perks to the revised death save rules, simplifying rulings versus 3.5's raise dead costs.",
                  link: {
                    label: "Raise Dead SRD (5e)",
                    url: "https://www.dndbeyond.com/sources/srd/spells#RaiseDead"
                  }
                }
              }
            ]
          },
          {
            name: "Bard",
            role: "Flexible support caster & inspiration engine",
            primaryAbility: "Charisma",
            hitDie: "d8",
            summary:
              "Harmonize spell lists with refreshed inspiration mechanics and clearer role definitions across tiers.",
            signatureFeatures: [
              "Songs of Restoration guarantee staple healing spells without preparation",
              "Bardic Inspiration recharges on a short rest and can be used reactively when allies fail",
              "Magical Secrets unlock themed spell list swaps at tier-based milestones"
            ],
            sources: [
              {
                label: "Player's Handbook (2024)",
                url: "https://www.dndbeyond.com/posts/1548-everything-we-know-about-the-2024-players-handbook"
              },
              {
                label: "UA Playtest 5",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-5/bard"
              }
            ],
            comparison: {
              note:
                "5e bards had to expend inspiration before seeing rolls; the 2024 design mirrors 3.5's immediate-action boosts so you can react to a failed d20.",
              link: {
                label: "Bardic Music (3.5 SRD)",
                url: "https://www.d20srd.org/srd/classes/bard.htm"
              }
            },
            subclasses: [
              {
                name: "College of Dance",
                spotlight:
                  "Spin into melee with agile footwork that fuels inspiration and battlefield control.",
                features: [
                  "Dance Step lets you reposition without provoking, similar to 5e's Rogue Cunning Action",
                  "Rhythm of War trades inspiration dice for ally movement, echoing 4e warlord tactics"
                ],
                sources: [
                  {
                    label: "UA Playtest 5",
                    url: "https://www.dndbeyond.com/sources/ua/ph-playtest-5/bard"
                  }
                ],
                comparison: {
                  note:
                    "Compared to the 5e College of Swords, Dance focuses on support repositioning instead of raw damage, pairing well with the refreshed inspiration timing.",
                  link: {
                    label: "College of Swords (Xanathar's)",
                    url: "https://www.dndbeyond.com/sources/xgte/subclasses-bard#CollegeofSwords"
                  }
                }
              },
              {
                name: "College of Lore",
                spotlight:
                  "Knowledge-focused bard with expanded cutting words and bonus spells for every occasion.",
                features: [
                  "Lore Bards gain more prepared spells per tier than 5e predecessors",
                  "Improved Cutting Words can blunt spell damage as well as attack rolls"
                ],
                sources: [
                  {
                    label: "Player's Handbook (2024)",
                    url: "https://www.dndbeyond.com/posts/1548-everything-we-know-about-the-2024-players-handbook"
                  }
                ],
                comparison: {
                  note:
                    "The subclass keeps its 5e identity but the new Magical Secrets cadence mirrors 3.5's bard spell access, smoothing multiclass conversions.",
                  link: {
                    label: "5e Lore Bard SRD",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#BardColleges"
                  }
                }
              }
            ]
          }
        ],
        "35e": [
          {
            name: "Fighter",
            role: "Martial specialist & feat engine",
            primaryAbility: "Strength or Dexterity",
            hitDie: "d10",
            summary:
              "Stack iterative attacks, feat chains, and prestige classes to sculpt any battlefield role.",
            signatureFeatures: [
              "Bonus feats at nearly every even level enable bespoke combat styles",
              "High base attack bonus grants four attacks by level 20",
              "Access to weapon-specific feats like Shock Trooper for tactical spikes"
            ],
            sources: [
              {
                label: "Player's Handbook v3.5",
                url: "https://www.dmsguild.com/product/23615/Players-Handbook-v35"
              },
              {
                label: "d20 SRD Fighter",
                url: "https://www.d20srd.org/srd/classes/fighter.htm"
              }
            ],
            comparison: {
              note:
                "Compared to 5e's fighter, the 3.5 version leans on feat trees instead of per-short-rest maneuvers, so onboarding players often port Battle Master superiority dice for a modern feel.",
              link: {
                label: "5e Battle Master",
                url: "https://www.dndbeyond.com/sources/srd/subclasses#FighterMartialArchetypes"
              }
            },
            subclasses: [
              {
                name: "Eldritch Knight (Prestige)",
                spotlight:
                  "Blend martial prowess with arcane spellcasting through prestige progression.",
                features: [
                  "Advances base attack while adding up to 9th-level spellcasting",
                  "Bonus feats tailor gish combos unavailable in 5e's subclass version"
                ],
                sources: [
                  {
                    label: "Dungeon Master's Guide v3.5",
                    url: "https://www.dmsguild.com/product/23731/Dungeon-Masters-Guide-v35"
                  },
                  {
                    label: "d20 SRD Eldritch Knight",
                    url: "https://www.d20srd.org/srd/prestigeClasses/eldritchKnight.htm"
                  }
                ],
                comparison: {
                  note:
                    "5e folds the Eldritch Knight into a fighter subclass with limited spells known; porting that chassis back trims spellbook maintenance for new groups.",
                  link: {
                    label: "5e Eldritch Knight",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#FighterMartialArchetypes"
                  }
                }
              },
              {
                name: "Dervish",
                spotlight:
                  "Whirlwind across the battlefield with acrobatic slashes and full-attack mobility.",
                features: [
                  "Dervish Dance enables full attacks after moving, something 5e handles via Action Surge",
                  "Slashing Frenzy adds bonus damage during whirlwind rounds"
                ],
                sources: [
                  {
                    label: "Complete Warrior",
                    url: "https://www.dmsguild.com/product/17539/Complete-Warrior-35"
                  }
                ],
                comparison: {
                  note:
                    "Its move-and-full-attack niche mirrors 4e's martial strikers; modern tables often translate it to 5e via the Mobile feat plus Echo Knight teleports.",
                  link: {
                    label: "Mobile Feat (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/feats#Mobile"
                  }
                }
              }
            ]
          },
          {
            name: "Cleric",
            role: "Divine buffer & versatile caster",
            primaryAbility: "Wisdom",
            hitDie: "d8",
            summary:
              "Tailor spell prep and domain powers to either frontline durability or potent support.",
            signatureFeatures: [
              "Two domain choices add bonus spells and unique powers",
              "Turn Undead scales into destroy effects against weak undead",
              "Spontaneous cure or inflict casting keeps slots flexible"
            ],
            sources: [
              {
                label: "Player's Handbook v3.5",
                url: "https://www.dmsguild.com/product/23615/Players-Handbook-v35"
              },
              {
                label: "d20 SRD Cleric",
                url: "https://www.d20srd.org/srd/classes/cleric.htm"
              }
            ],
            comparison: {
              note:
                "5e domains arrive at level 1 with lighter bookkeeping, while 3.5 clerics juggle turning pools and domain slots for granular customization.",
              link: {
                label: "5e Cleric SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Cleric"
              }
            },
            subclasses: [
              {
                name: "Radiant Servant of Pelor",
                spotlight:
                  "Specialize in turning undead and blasting foes with intensified light spells.",
                features: [
                  "Greater turning destroys undead outright, similar to 5e's Channel Divinity: Turn Undead at higher tiers",
                  "Empower Healing boosts cure spells, echoing 2024 domain scaling"
                ],
                sources: [
                  {
                    label: "Complete Divine",
                    url: "https://www.dmsguild.com/product/17519/Complete-Divine-35"
                  }
                ],
                comparison: {
                  note:
                    "The subclass prefigures 5e's Light Domain; modern conversions often swap in radiant flame strike dice from the SRD for smoother math.",
                  link: {
                    label: "Light Domain (5e)",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#ClericDivineDomains"
                  }
                }
              },
              {
                name: "Warpriest",
                spotlight:
                  "Blend martial attacks and divine spellcasting for frontline pressure.",
                features: [
                  "Battle Blessing reduces metamagic overhead on buffs",
                  "Weapon Focus/Specialization bonuses mirror 5e's Blessed Warrior fighting style"
                ],
                sources: [
                  {
                    label: "Complete Divine",
                    url: "https://www.dmsguild.com/product/17519/Complete-Divine-35"
                  }
                ],
                comparison: {
                  note:
                    "5e's War Domain compresses this kit into Channel Divinity options, making iterative attack math unnecessary for quick conversion.",
                  link: {
                    label: "War Domain (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#ClericDivineDomains"
                  }
                }
              }
            ]
          }
        ],
        "2e": [
          {
            name: "Cleric",
            role: "Armor-clad miracle worker",
            primaryAbility: "Wisdom",
            hitDie: "d8",
            summary:
              "Access spheres of influence based on deity, wielding both healing and battlefield miracles.",
            signatureFeatures: [
              "Spheres replace 3.5 domains, dictating spell availability",
              "Turning undead uses d20 tables unique to each faith",
              "Specialty priest kits tailor granted powers and weapon proficiencies"
            ],
            sources: [
              {
                label: "Player's Handbook (2e)",
                url: "https://www.dmsguild.com/product/16868/Players-Handbook-2e"
              },
              {
                label: "Faiths & Avatars",
                url: "https://www.dmsguild.com/product/17469/Faiths-and-Avatars-2e"
              }
            ],
            comparison: {
              note:
                "5e streamlined clerics into unified spell lists; referencing specialty priest kits helps port bespoke miracles back into modern campaigns.",
              link: {
                label: "Cleric Basics (5e)",
                url: "https://www.dndbeyond.com/sources/basic-rules/classes#Cleric"
              }
            },
            subclasses: [
              {
                name: "Morninglord of Lathander",
                spotlight:
                  "Radiant-themed specialty priest with resurrection boons and sunlight powers.",
                features: [
                  "Bonus spells mimic 5e's Light Domain list",
                  "Greater Resurrection reduces material costs, a perk later echoed by 2024 epic boons"
                ],
                sources: [
                  {
                    label: "Faiths & Avatars",
                    url: "https://www.dmsguild.com/product/17469/Faiths-and-Avatars-2e"
                  }
                ],
                comparison: {
                  note:
                    "Modern tables can mirror the Morninglord's dawnfire aura with 5e's Dawn spell while keeping 2e's unique resurrections intact.",
                  link: {
                    label: "Dawn Spell (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/spells#Dawn"
                  }
                }
              },
              {
                name: "Battle Priest of Tempus",
                spotlight:
                  "Martial-focused clergy wielding heavy armor and commanding war rites.",
                features: [
                  "Access to Combat and War spheres keeps damage spells online",
                  "Battle fury abilities foreshadow 5e's War Domain Channel Divinity"
                ],
                sources: [
                  {
                    label: "Faiths & Avatars",
                    url: "https://www.dmsguild.com/product/17469/Faiths-and-Avatars-2e"
                  }
                ],
                comparison: {
                  note:
                    "Easily mapped onto 5e by combining the War Domain with martial weapon proficiency feats from Tasha's optional rules.",
                  link: {
                    label: "Martial Adept (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/feats#MartialAdept"
                  }
                }
              }
            ]
          },
          {
            name: "Ranger",
            role: "Wilderness scout & skirmisher",
            primaryAbility: "Strength and Dexterity",
            hitDie: "d10",
            summary:
              "Excel at ambushes, animal empathy, and planar tracking with kit-based customization.",
            signatureFeatures: [
              "Two-weapon fighting without penalties at low levels",
              "Tracking proficiency scales with level and favored enemy bonuses",
              "Spellcasting arrives late but includes unique animal friendship rites"
            ],
            sources: [
              {
                label: "Player's Handbook (2e)",
                url: "https://www.dmsguild.com/product/16868/Players-Handbook-2e"
              },
              {
                label: "Complete Ranger's Handbook",
                url: "https://www.dmsguild.com/product/16899/The-Complete-Rangers-Handbook-2e"
              }
            ],
            comparison: {
              note:
                "3.5 and 5e rangers both revise favored enemy math; referencing 2e kits like Stalker helps add exploration abilities modern subclasses sometimes lack.",
              link: {
                label: "Ranger (5e Basic Rules)",
                url: "https://www.dndbeyond.com/sources/basic-rules/classes#Ranger"
              }
            },
            subclasses: [
              {
                name: "Stalker Kit",
                spotlight:
                  "Urban infiltrator variant specializing in stealth and informant networks.",
                features: [
                  "Contacts and disguise proficiencies echo 5e's Gloom Stalker options",
                  "Backstab multipliers reward ambush tactics similar to rogue Sneak Attack"
                ],
                sources: [
                  {
                    label: "Complete Ranger's Handbook",
                    url: "https://www.dmsguild.com/product/16899/The-Complete-Rangers-Handbook-2e"
                  }
                ],
                comparison: {
                  note:
                    "Pairs cleanly with 5e's Gloom Stalker by porting umbral sight and initiative bonuses to emulate kit advantages.",
                  link: {
                    label: "Gloom Stalker (Xanathar's)",
                    url: "https://www.dndbeyond.com/sources/xgte/subclasses-ranger#GloomStalker"
                  }
                }
              },
              {
                name: "Beastmaster Kit",
                spotlight:
                  "Leverage animal companions with morale rules and shared tricks.",
                features: [
                  "Multiple animal followers scale with level, unlike 5e's single companion",
                  "Special handling rules inform modern sidekick stat blocks"
                ],
                sources: [
                  {
                    label: "Complete Ranger's Handbook",
                    url: "https://www.dmsguild.com/product/16899/The-Complete-Rangers-Handbook-2e"
                  }
                ],
                comparison: {
                  note:
                    "5e's revised Beast Master from Tasha's streamlines action economy; use those stat blocks when porting kits to cut down micro-managing morale checks.",
                  link: {
                    label: "Primal Companion (Tasha's)",
                    url: "https://www.dndbeyond.com/sources/tcoe/subclasses-ranger#BeastMasterConclave"
                  }
                }
              }
            ]
          }
        ],
        becmi: [
          {
            name: "Fighter",
            role: "Straightforward warrior scaling into domain leadership",
            primaryAbility: "Strength",
            hitDie: "d8",
            summary:
              "Simple early play that graduates into weapon mastery trees and dominion command.",
            signatureFeatures: [
              "Name level unlocks dominion management and mass combat options",
              "Weapon mastery tiers add crit ranges and damage bumps absent from OD&D",
              "Plate armor access from level 1 keeps survivability high"
            ],
            sources: [
              {
                label: "Rules Cyclopedia",
                url: "https://www.dmsguild.com/product/17171/Rules-Cyclopedia-Basic"
              }
            ],
            comparison: {
              note:
                "5e fighters chase magic items for mastery-style boosts, while BECMI builds them directly into the class—great inspiration for optional mastery modules in modern campaigns.",
              link: {
                label: "Weapon Mastery (Rules Cyclopedia)",
                url: "https://www.dragonsfoot.org/forums/viewtopic.php?t=36241"
              }
            },
            subclasses: [
              {
                name: "Knight of the Order",
                spotlight:
                  "Chivalric path with heraldry, followers, and dominion obligations.",
                features: [
                  "Gains a keep and loyal retainers at Name level",
                  "Order codes foreshadow 5e's paladin oaths and downtime guidelines"
                ],
                sources: [
                  {
                    label: "Companion Set",
                    url: "https://www.dmsguild.com/product/17182/Companion-Set-Basic"
                  }
                ],
                comparison: {
                  note:
                    "Map the order's tenets onto 5e paladin oaths to modernize roleplay expectations while keeping BECMI domain play intact.",
                  link: {
                    label: "Oath of Devotion (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#PaladinSacredOaths"
                  }
                }
              },
              {
                name: "Warlord",
                spotlight:
                  "Mass-combat specialist using War Machine rules to command troops.",
                features: [
                  "Adds tactical bonuses to army morale and initiative",
                  "Integrates with dominion taxation and troop upkeep subsystems"
                ],
                sources: [
                  {
                    label: "Companion Set",
                    url: "https://www.dmsguild.com/product/17182/Companion-Set-Basic"
                  }
                ],
                comparison: {
                  note:
                    "4e's warlord and 5e's Battle Master maneuvers borrow similar command themes—porting superiority dice can simplify War Machine swings for new players.",
                  link: {
                    label: "Battle Master (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#FighterMartialArchetypes"
                  }
                }
              }
            ]
          },
          {
            name: "Magic-User",
            role: "Classic Vancian spellcaster",
            primaryAbility: "Intelligence",
            hitDie: "d4",
            summary:
              "Prepare a handful of potent spells and rely on clever resource management until higher circles unlock.",
            signatureFeatures: [
              "Spells are memorized verbatim and forgotten when cast",
              "Stronghold research unlocks new spells and magical experiments",
              "At name level you can craft constructs and magical items"
            ],
            sources: [
              {
                label: "Rules Cyclopedia",
                url: "https://www.dmsguild.com/product/17171/Rules-Cyclopedia-Basic"
              }
            ],
            comparison: {
              note:
                "3.5 and 5e wizards share the spellbook DNA but offer more low-level slots; blending modern ritual casting with BECMI memorization keeps nostalgia without stalling pacing.",
              link: {
                label: "Ritual Casting (5e Basic)",
                url: "https://www.dndbeyond.com/sources/basic-rules/spellcasting#Rituals"
              }
            },
            subclasses: [
              {
                name: "Elementalist",
                spotlight:
                  "Focus your spell research on elemental devastation and planar contacts.",
                features: [
                  "Expanded lists add exclusive elemental spells unavailable to generalists",
                  "Circle rituals open gateways similar to 5e's Planar Binding"
                ],
                sources: [
                  {
                    label: "Master Set",
                    url: "https://www.dmsguild.com/product/17183/Master-Set-Basic"
                  }
                ],
                comparison: {
                  note:
                    "Translate Elementalist blasts using 5e's elemental adept feats to maintain high damage without breaking bounded accuracy.",
                  link: {
                    label: "Elemental Adept (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/feats#ElementalAdept"
                  }
                }
              },
              {
                name: "Wyrd",
                spotlight:
                  "Mystic seer who blends enchantment and divination with fate-weaving.",
                features: [
                  "Prophecy rituals mimic 5e's divination spells but with campaign-scale stakes",
                  "Can craft talismans granting limited rerolls akin to 2024 Heroic Inspiration"
                ],
                sources: [
                  {
                    label: "Gazetteer Series",
                    url: "https://www.dmsguild.com/product/229802/Mystara-Gazetteer-Compilation"
                  }
                ],
                comparison: {
                  note:
                    "Layer in 5e's Portent mechanic from the Divination wizard to emulate Wyrd fate dice without bespoke charts.",
                  link: {
                    label: "Divination Tradition (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#WizardArcaneTraditions"
                  }
                }
              }
            ]
          }
        ]
      };
