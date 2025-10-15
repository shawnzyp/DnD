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
                "Compared to 3.5e barbarians who tracked daily rage uses and risked post-battle fatigue, 5e refreshes Rage on long rests and drops the exhaustion crash so you can unleash fury more often.",
              link: {
                label: "3.5e Barbarian (SRD)",
                url: "https://www.d20srd.org/srd/classes/barbarian.htm"
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
                    "Calls back to AD&D wild surge tables and 3.5e wild mage antics, but houses the chaos inside a martial chassis rather than a full spellcaster.",
                  link: {
                    label: "Complete Arcane Wild Mage (3.5e)",
                    url: "https://www.dndbeyond.com/posts/1185-wild-magic-through-the-editions"
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
                    "AD&D abjurers specialized by giving up other schools; 5e lets you keep broad spell access while gaining the Arcane Ward durability package.",
                  link: {
                    label: "AD&D Specialist Wizard",
                    url: "https://www.dmsguild.com/product/17529/The-Complete-Wizard-Handbook-2e"
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
          },
          {
            name: "Bard",
            role: "Support caster & skill maestro",
            primaryAbility: "Charisma",
            hitDie: "d8",
            summary:
              "Inspire allies, weave enchantments, and flex into any role with magical secrets and expansive expertise.",
            signatureFeatures: [
              "Bardic Inspiration fuels clutch saves and attacks as a reaction",
              "Jack of All Trades boosts nearly every ability check",
              "Magical Secrets poach spells from any list for ultimate flexibility"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Bard",
                url: "https://www.dndbeyond.com/sources/srd/classes#Bard"
              }
            ],
            comparison: {
              note:
                "3.5e bards juggled daily music uses and incremental song bonuses, while 5e bards lean on short-rest inspiration dice and broader spell access for flexible support.",
              link: {
                label: "3.5e Bard Overview",
                url: "https://www.d20srd.org/srd/classes/bard.htm"
              }
            },
            subclasses: [
              {
                name: "College of Lore",
                spotlight:
                  "Blend battlefield control and social dominance with cutting words and early magical secrets.",
                features: [
                  "Cutting Words subtracts from enemy rolls as a reaction, echoing 4e leader debuffs",
                  "Additional Magical Secrets at 6th level accelerate access to off-list spells"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to AD&D bards who required multiclass hoops, Lore bards front-load skills and magic from a single progression.",
                  link: {
                    label: "AD&D Bard Overview",
                    url: "https://www.dmsguild.com/product/17065/ADnD-Players-Handbook-2e"
                  }
                }
              },
              {
                name: "College of Valor",
                spotlight:
                  "March into melee with extra attack, battle magic, and team-wide weapon competence.",
                features: [
                  "Combat Inspiration empowers allies with damage boosts and AC reactions",
                  "Extra Attack at 6th level parallels 4e skald bard striker hybrids"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "4e skald bards filled a similar melee-support niche, but 5e's Valor bards keep spell versatility while adding Extra Attack to stay in the fray.",
                  link: {
                    label: "4e Bard (Skald)",
                    url: "https://www.dmsguild.com/product/125230/Players-Handbook-2-4e"
                  }
                }
              }
            ]
          },
          {
            name: "Cleric",
            role: "Divine healer & adaptable spellcaster",
            primaryAbility: "Wisdom",
            hitDie: "d8",
            summary:
              "Channel divine power to heal, ward, and smite with domain-flavored miracles tailored to your deity.",
            signatureFeatures: [
              "Channel Divinity offers scaling burst healing, damage, or utility",
              "Prepared spell list flexes daily prayers to fit the adventure",
              "Divine Intervention delivers dramatic deus ex machina moments at higher levels"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Cleric",
                url: "https://www.dndbeyond.com/sources/srd/classes#Cleric"
              }
            ],
            comparison: {
              note:
                "Compared to 3.5e clerics juggling multiple domain spell slots and turn undead for divine feats, 5e offers fewer daily prep decisions but quicker access to Channel Divinity options.",
              link: {
                label: "3.5e Cleric (SRD)",
                url: "https://www.d20srd.org/srd/classes/cleric.htm"
              }
            },
            subclasses: [
              {
                name: "Life Domain",
                spotlight:
                  "Maximize healing throughput and protect allies with divine vitality.",
                features: [
                  "Disciple of Life adds flat bonuses to every healing spell",
                  "Blessed Healer splashes self-healing when you restore others"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to 3.5e healbots who spammed cure wands, Life clerics keep pace with damage curves via scaling dice and bonuses.",
                  link: {
                    label: "3.5 Cleric Overview",
                    url: "https://www.d20srd.org/srd/classes/cleric.htm"
                  }
                }
              },
              {
                name: "Light Domain",
                spotlight:
                  "Blast foes with radiant fire and illuminate shadows while shielding allies.",
                features: [
                  "Warding Flare imposes disadvantage like 4e defender marks",
                  "Corona of Light at high levels supercharges radiant damage against big bads"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "4e invokers and clerics leaned on radiant blasts too, but 5e's Light domain retains classic bonus spells and Warding Flare for a more reactive defense toolkit.",
                  link: {
                    label: "4e Invoker Preview",
                    url: "https://www.dmsguild.com/product/125230/Players-Handbook-2-4e"
                  }
                }
              }
            ]
          },
          {
            name: "Druid",
            role: "Nature spellcaster & shapeshifting controller",
            primaryAbility: "Wisdom",
            hitDie: "d8",
            summary:
              "Command primal magic, wild shape into beasts, and sustain allies with versatile elemental support.",
            signatureFeatures: [
              "Wild Shape transforms you into beasts for scouting, combat, or utility",
              "Druidic spellcasting covers healing, control, and summoning",
              "Timeless Body and Beast Spells keep you relevant into high tiers"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Druid",
                url: "https://www.dndbeyond.com/sources/srd/classes#Druid"
              }
            ],
            comparison: {
              note:
                "3.5e druids also drew from beast stat blocks but layered templates and feats; 5e pares that back, keeping forms accessible while still rewarding Moon Circle investment.",
              link: {
                label: "3.5e Druid Overview",
                url: "https://www.d20srd.org/srd/classes/druid.htm"
              }
            },
            subclasses: [
              {
                name: "Circle of the Moon",
                spotlight:
                  "Dominate frontline combat via beefy beast forms and swift transformations.",
                features: [
                  "Combat Wild Shape lets you shift as a bonus action and spend spell slots for healing",
                  "Elemental Wild Shape unlocks versatile forms reminiscent of 3.5e elemental wilding"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "3.5e wild shape stacking with prestige classes like Master of Many Forms let druids overshadow martials; 5e's Moon druids keep power high but within bounded accuracy.",
                  link: {
                    label: "Master of Many Forms (3.5e)",
                    url: "https://www.d20srd.org/srd/prestigeClasses/masterOfManyForms.htm"
                  }
                }
              },
              {
                name: "Circle of the Land",
                spotlight:
                  "Specialize in regional spell themes and sustain spell slots with natural recovery.",
                features: [
                  "Natural Recovery mimics wizard Arcane Recovery for druid spell slots",
                  "Land's Stride keeps you mobile through magical and natural hazards"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to AD&D druids bound by strict hierarchies, Land druids focus on spell variety over political advancement.",
                  link: {
                    label: "AD&D Druid Class",
                    url: "https://www.dmsguild.com/product/17065/ADnD-Players-Handbook-2e"
                  }
                }
              }
            ]
          },
          {
            name: "Fighter",
            role: "Martial striker & tactical generalist",
            primaryAbility: "Strength or Dexterity",
            hitDie: "d10",
            summary:
              "Master weapons and tactics with extra attacks, action surges, and feats that define the battlefield.",
            signatureFeatures: [
              "Fighting Style customizes defense, archery, or dueling specializations",
              "Action Surge grants burst turns reminiscent of 4e encounter powers",
              "Extra Attack scales faster than any other martial class"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Fighter",
                url: "https://www.dndbeyond.com/sources/srd/classes#Fighter"
              }
            ],
            comparison: {
              note:
                "4e fighters used marks and encounter powers to force positioning; 5e keeps things lighter, letting subclasses and feats layer control onto a straightforward action-surge chassis.",
              link: {
                label: "4e Fighter Overview",
                url: "https://www.dmsguild.com/product/125149/Players-Handbook-4e"
              }
            },
            subclasses: [
              {
                name: "Champion",
                spotlight:
                  "Critical-hit specialist with passive boosts perfect for straightforward martial play.",
                features: [
                  "Improved Critical doubles your crit range, echoing 3.5e's keen weapon stacking",
                  "Remarkable Athlete fills in skill gaps for strength-based heroes"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "3.5e weapon masters chased crit range stacking too, but 5e's Champion keeps the play pattern streamlined without juggling feat chains.",
                  link: {
                    label: "3.5e Weapon Master",
                    url: "https://www.dmsguild.com/product/23731/Dungeon-Masters-Guide-v35"
                  }
                }
              },
              {
                name: "Battle Master",
                spotlight:
                  "Command superiority dice to control positioning, protect allies, and outmaneuver foes.",
                features: [
                  "Superiority dice fuel maneuvers for damage, control, and utility",
                  "Know Your Enemy gleans intel similar to 4e tactical assessment features"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "3.5e fighters relied on feat chains; Battle Masters concentrate that complexity into a reusable maneuver economy.",
                  link: {
                    label: "3.5 Fighter Overview",
                    url: "https://www.d20srd.org/srd/classes/fighter.htm"
                  }
                }
              }
            ]
          },
          {
            name: "Monk",
            role: "Mobile striker & skirmisher",
            primaryAbility: "Dexterity & Wisdom",
            hitDie: "d8",
            summary:
              "Channel ki into rapid strikes, mobility, and defensive stances to dismantle foes up close.",
            signatureFeatures: [
              "Martial Arts enables bonus-action strikes scaling with level",
              "Ki points fuel Flurry of Blows, Step of the Wind, and Patient Defense",
              "Deflect Missiles and Evasion keep monks agile against ranged and area threats"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Monk",
                url: "https://www.dndbeyond.com/sources/srd/classes#Monk"
              }
            ],
            comparison: {
              note:
                "3.5e monks wrestled with multi-ability dependence and flurry penalties; 5e smooths the math with proficiency scaling and ki-fueled bonus actions.",
              link: {
                label: "3.5e Monk (SRD)",
                url: "https://www.d20srd.org/srd/classes/monk.htm"
              }
            },
            subclasses: [
              {
                name: "Way of the Open Hand",
                spotlight:
                  "Knock foes down, shove them away, and disrupt ki to control the battlefield.",
                features: [
                  "Open Hand Technique adds rider effects to Flurry of Blows",
                  "Quivering Palm delivers lethal finishing moves reminiscent of classic wuxia tales"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "AD&D monks shared stunning fists but lacked the control riders modern Open Hand techniques provide.",
                  link: {
                    label: "AD&D Monk Class",
                    url: "https://www.dmsguild.com/product/17065/ADnD-Players-Handbook-2e"
                  }
                }
              },
              {
                name: "Way of Shadow",
                spotlight:
                  "Blend stealth, teleportation, and ki-fueled illusions for ninja-style tactics.",
                features: [
                  "Shadow Step teleports between dim light areas like a short-range misty step",
                  "Cloak of Shadows grants invisibility without concentration for infiltration"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to 4e's assassin hybrids, Way of Shadow keeps damage modest but multiplies utility via ki-powered spells.",
                  link: {
                    label: "4e Shadow Assassin",
                    url: "https://www.dndbeyond.com/compendium/dnd4e/classes/assassin"
                  }
                }
              }
            ]
          },
          {
            name: "Paladin",
            role: "Divine striker & frontline defender",
            primaryAbility: "Strength & Charisma",
            hitDie: "d10",
            summary:
              "Smite enemies with radiant bursts while protecting allies through auras and healing magic.",
            signatureFeatures: [
              "Divine Smite converts spell slots into radiant burst damage",
              "Lay on Hands provides a versatile pool of healing and condition removal",
              "Aura of Protection boosts party saving throws within your presence"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Paladin",
                url: "https://www.dndbeyond.com/sources/srd/classes#Paladin"
              }
            ],
            comparison: {
              note:
                "Compared to 3.5e paladins who burned spell slots for smite attempts a few times per day, 5e paladins convert any spell slot into radiant burst damage on demand.",
              link: {
                label: "3.5e Paladin (SRD)",
                url: "https://www.d20srd.org/srd/classes/paladin.htm"
              }
            },
            subclasses: [
              {
                name: "Oath of Devotion",
                spotlight:
                  "Classic holy knight with radiant weapons and protection against deception.",
                features: [
                  "Sacred Weapon adds Charisma to attack rolls and shines light like classic paladin blessings",
                  "Aura of Devotion shields allies from charm effects reminiscent of 3.5e aura abilities"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to BECMI paladins limited by strict codes, Devotion offers broader spellcasting and oath spells for modern campaigns.",
                  link: {
                    label: "BECMI Paladin Overview",
                    url: "https://www.drivethrurpg.com/product/17171/Basic-Dungeons--Dragons-Set-Rulebook-BECMI"
                  }
                }
              },
              {
                name: "Oath of Vengeance",
                spotlight:
                  "Relentless hunter focused on single-target burst and pursuit.",
                features: [
                  "Vow of Enmity grants advantage against priority foes, mirroring 4e avenger mechanics",
                  "Relentless Avenger extends opportunity attacks into forced movement for chase scenes"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "3.5e avengers and paladins leaned on swift smite feats; 5e's Vengeance oath captures that relentless hunter vibe with Vow of Enmity and mobility tricks.",
                  link: {
                    label: "3.5e Complete Champion",
                    url: "https://www.dmsguild.com/product/19834/Complete-Champion"
                  }
                }
              }
            ]
          },
          {
            name: "Ranger",
            role: "Martial scout & nature-themed striker",
            primaryAbility: "Dexterity & Wisdom",
            hitDie: "d10",
            summary:
              "Track prey, cast primal spells, and leverage favored terrain to control the wilds.",
            signatureFeatures: [
              "Favored Enemy and Natural Explorer tailor exploration benefits",
              "Fighting Style and Hunter's Mark amplify weapon damage",
              "Primeval Awareness and spellcasting provide utility scouting"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Ranger",
                url: "https://www.dndbeyond.com/sources/srd/classes#Ranger"
              }
            ],
            comparison: {
              note:
                "3.5e rangers juggled favored enemy bonuses and two-weapon feat chains; 5e trims the bookkeeping and front-loads exploration perks with optional features from Tasha's.",
              link: {
                label: "3.5e Ranger Overview",
                url: "https://www.d20srd.org/srd/classes/ranger.htm"
              }
            },
            subclasses: [
              {
                name: "Hunter",
                spotlight:
                  "Customizable predator that picks defensive or offensive tactics to match threats.",
                features: [
                  "Hunter's Prey choices provide burst damage or control riders",
                  "Multiattack Defense scales survivability in drawn-out fights"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "3.5e rangers relied on combat style feat chains; Hunter condenses options into level-based choices for streamlined prep.",
                  link: {
                    label: "3.5 Ranger Overview",
                    url: "https://www.d20srd.org/srd/classes/ranger.htm"
                  }
                }
              },
              {
                name: "Beast Master",
                spotlight:
                  "Fight alongside a loyal animal companion with coordinated strikes and shared defenses.",
                features: [
                  "Ranger's Companion fights independently as you level, especially with Tasha's optional rules",
                  "Bestial Fury adds extra attacks and mobility to your team"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Tasha's Cauldron of Everything already offered Primal Companion updates, so 5e Beast Masters can emulate the smoother pet rules without waiting for later editions.",
                  link: {
                    label: "Tasha's Ranger Optional Features",
                    url: "https://www.dndbeyond.com/sources/tcoe/ranger"
                  }
                }
              }
            ]
          },
          {
            name: "Rogue",
            role: "Stealth striker & skill specialist",
            primaryAbility: "Dexterity",
            hitDie: "d8",
            summary:
              "Sneak past danger, deliver precision damage, and solve problems with a deep skill toolkit.",
            signatureFeatures: [
              "Sneak Attack adds scaling burst damage once per turn",
              "Cunning Action fuels bonus-action mobility and utility",
              "Evasion and Uncanny Dodge mitigate incoming damage"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Rogue",
                url: "https://www.dndbeyond.com/sources/srd/classes#Rogue"
              }
            ],
            comparison: {
              note:
                "AD&D thieves wrestled with percentile skills and backstab positioning; 5e rogues simplify stealth with proficiency scaling and Sneak Attack once per turn.",
              link: {
                label: "AD&D Thief Skills",
                url: "https://www.dmsguild.com/product/17065/ADnD-Players-Handbook-2e"
              }
            },
            subclasses: [
              {
                name: "Thief",
                spotlight:
                  "Master of infiltration and item manipulation with unparalleled mobility.",
                features: [
                  "Fast Hands expands bonus-action utility for traps and items",
                  "Second-Story Work boosts climbing and jumping like classic AD&D burglars"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to B/X thieves tied to percentile skills, 5e Thieves leverage proficiency bonuses and Cunning Action for broader competence.",
                  link: {
                    label: "B/X Thief Overview",
                    url: "https://basicfantasy.org/downloads.html"
                  }
                }
              },
              {
                name: "Assassin",
                spotlight:
                  "Strike from surprise with devastating alpha damage and social infiltration tools.",
                features: [
                  "Assassinate grants advantage and auto-crit against surprised foes",
                  "Infiltration Expertise builds custom identities for long cons"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "3.5e assassins were prestige classes; 5e folds the killer fantasy into a level 3 subclass without alignment restrictions.",
                  link: {
                    label: "3.5 Assassin Prestige Class",
                    url: "https://www.d20srd.org/srd/prestigeClasses/assassin.htm"
                  }
                }
              }
            ]
          },
          {
            name: "Sorcerer",
            role: "Innate arcane blaster",
            primaryAbility: "Charisma",
            hitDie: "d6",
            summary:
              "Harness innate magic with metamagic customization and spontaneous spellcasting.",
            signatureFeatures: [
              "Flexible casting trades spell slots for sorcery points and vice versa",
              "Metamagic tweaks spell range, duration, and damage",
              "Font of Magic scales sorcery point pool to power signature combos"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Sorcerer",
                url: "https://www.dndbeyond.com/sources/srd/classes#Sorcerer"
              }
            ],
            comparison: {
              note:
                "3.5e sorcerers learned fewer spells than wizards but cast more often; 5e keeps spontaneous casting while giving metamagic knobs to customize each slot.",
              link: {
                label: "3.5e Sorcerer (SRD)",
                url: "https://www.d20srd.org/srd/classes/sorcerer.htm"
              }
            },
            subclasses: [
              {
                name: "Draconic Bloodline",
                spotlight:
                  "Manifest draconic resilience and elemental damage matching your wyrm ancestor.",
                features: [
                  "Draconic Resilience boosts AC and HP like inherited scales",
                  "Elemental Affinity adds Charisma to damage and empowers spell resistance"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to 3.5e dragon disciple prestige paths, Draconic sorcerers gain their scales and breath boosts without multiclass detours.",
                  link: {
                    label: "3.5 Dragon Disciple",
                    url: "https://www.d20srd.org/srd/prestigeClasses/dragonDisciple.htm"
                  }
                }
              },
              {
                name: "Wild Magic",
                spotlight:
                  "Unpredictable spellcasting that trades reliability for explosive surges and support.",
                features: [
                  "Wild Magic Surge table creates random beneficial or chaotic effects",
                  "Tides of Chaos grants advantage with the risk of triggering surges"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "AD&D wild mages inspired the same chaotic table; 5e keeps the surges unpredictable, rewarding tables that enjoy dramatic swings.",
                  link: {
                    label: "AD&D Wild Mage",
                    url: "https://www.dmsguild.com/product/17529/The-Complete-Wizard-Handbook-2e"
                  }
                }
              }
            ]
          },
          {
            name: "Warlock",
            role: "Pact-bound blaster & debuffer",
            primaryAbility: "Charisma",
            hitDie: "d8",
            summary:
              "Forge bargains with eldritch patrons to hurl cantrip barrages, curses, and pact magic invocations.",
            signatureFeatures: [
              "Pact Magic slots recharge on short rests for frequent spellcasting",
              "Eldritch Invocations customize utility, defense, and at-will powers",
              "Pact Boon defines your theme with familiars, weapons, or grimoires"
            ],
            sources: [
              {
                label: "Player's Handbook (2014)",
                url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
              },
              {
                label: "SRD 5.1 Warlock",
                url: "https://www.dndbeyond.com/sources/srd/classes#Warlock"
              }
            ],
            comparison: {
              note:
                "3.5e warlocks introduced at-will eldritch blast, but 5e refines the pact magic cadence with short-rest slots and customizable invocations.",
              link: {
                label: "3.5e Warlock (Complete Arcane)",
                url: "https://www.dmsguild.com/product/28938/Complete-Arcane-35"
              }
            },
            subclasses: [
              {
                name: "The Fiend",
                spotlight:
                  "Deal infernal damage and harness temporary hit points from vanquished foes.",
                features: [
                  "Dark One's Blessing grants temp HP when you defeat enemies",
                  "Hurl Through Hell banishes targets through a torment dimension for burst damage"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "3.5e warlocks lacked pact-specific high-level features; the Fiend patron adds flavorful capstones tied to infernal bargains.",
                  link: {
                    label: "3.5 Warlock (Complete Arcane)",
                    url: "https://www.dmsguild.com/product/28938/Complete-Arcane-35"
                  }
                }
              },
              {
                name: "The Great Old One",
                spotlight:
                  "Whisper mind-bending secrets that dominate, frighten, and scry on foes.",
                features: [
                  "Awakened Mind communicates telepathically without a shared language",
                  "Create Thrall turns defeated enemies into enthralled agents"
                ],
                sources: [
                  {
                    label: "Player's Handbook",
                    url: "https://dnd.wizards.com/products/tabletop-games/rpg-products/rpg_playershandbook"
                  }
                ],
                comparison: {
                  note:
                    "Compared to Call of Cthulhu-inspired psionics from 2e, GOO warlocks wrap horror themes into a tight short-rest chassis.",
                  link: {
                    label: "2e Psionics Handbook",
                    url: "https://www.dmsguild.com/product/17449/The-Complete-Psionics-Handbook-2e"
                  }
                }
              }
            ]
          },
          {
            name: "Artificer",
            role: "Arcane inventor & support engineer",
            primaryAbility: "Intelligence",
            hitDie: "d8",
            summary:
              "Engineer arcane gadgets, infuse allies' gear, and blend spells with expertise to solve any problem.",
            signatureFeatures: [
              "Infuse Item turns mundane gear into temporary magic for your team",
              "Tool Expertise doubles proficiency with artisan's tools for superior crafting checks",
              "Prepared half-caster spellcasting fueled by Intelligence and unique cantrips"
            ],
            sources: [
              {
                label: "Eberron: Rising from the Last War",
                url: "https://dnd.wizards.com/products/eberron-rising-last-war"
              },
              {
                label: "Systems Reference Document 5.1 (Artificer)",
                url: "https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf"
              }
            ],
            comparison: {
              note:
                "3.5e artificers paid XP to craft permanent items; 5e trades that bookkeeping for reusable infusions and a half-caster spell list.",
              link: {
                label: "Eberron Campaign Setting (3.5e)",
                url: "https://www.dmsguild.com/product/28489/Eberron-Campaign-Setting-3e"
              }
            },
            subclasses: [
              {
                name: "Alchemist",
                spotlight:
                  "Potion-slinging support who brews elixirs and battlefield acids to aid allies.",
                features: [
                  "Experimental Elixirs grant daily buffs ranging from healing to flight",
                  "Alchemical Savant boosts healing and damage from spells that rely on your crafted reagents"
                ],
                sources: [
                  {
                    label: "Eberron: Rising from the Last War",
                    url: "https://dnd.wizards.com/products/eberron-rising-last-war"
                  },
                  {
                    label: "Tasha's Cauldron of Everything",
                    url: "https://dnd.wizards.com/products/tashas-cauldron-everything"
                  }
                ],
                comparison: {
                  note:
                    "Unearthed Arcana versions relied on random elixir tables; the finalized Alchemist offers guaranteed formulas so support players can plan ahead.",
                  link: {
                    label: "Unearthed Arcana: Artificer (2019)",
                    url: "https://media.wizards.com/2019/dnd/downloads/UA-Artificer.pdf"
                  }
                }
              },
              {
                name: "Battle Smith",
                spotlight:
                  "Field commander fighting beside a Steel Defender while empowering weapon attacks.",
                features: [
                  "Steel Defender acts as a construct companion that obeys your bonus action commands",
                  "Arcane Jolt lets you heal allies or add force damage whenever you land weapon strikes"
                ],
                sources: [
                  {
                    label: "Eberron: Rising from the Last War",
                    url: "https://dnd.wizards.com/products/eberron-rising-last-war"
                  },
                  {
                    label: "Tasha's Cauldron of Everything",
                    url: "https://dnd.wizards.com/products/tashas-cauldron-everything"
                  }
                ],
                comparison: {
                  note:
                    "4e artificers empowered allies with infusions and constructs; 5e's Battle Smith keeps that vibe with a persistent defender instead of daily healing infusions.",
                  link: {
                    label: "Eberron Player's Guide (4e)",
                    url: "https://www.dmsguild.com/product/124484/Eberron-Players-Guide-4e"
                  }
                }
              }
            ]
          }
        ],
        "2024": [
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
          },
          {
            name: "Cleric",
            role: "Divine leader & radiant controller",
            primaryAbility: "Wisdom",
            hitDie: "d8",
            summary:
              "Channel divinity-fueled support that leans into unified Divine spell lists and streamlined domain progression.",
            signatureFeatures: [
              "Channel Divinity refreshes after every short rest and scales to 3 uses by tier 3",
              "Spell preparation keys off the Divine list plus domain exclusives, aligning with 2024 list consolidation",
              "Weapon Mastery access via Blessed Strikes encourages wielding maces or warhammers without feat tax"
            ],
            sources: [
              {
                label: "Player's Handbook (2024)",
                url: "https://www.dndbeyond.com/posts/1548-everything-we-know-about-the-2024-players-handbook"
              },
              {
                label: "UA Playtest 7 Cleric",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-7/cleric"
              }
            ],
            comparison: {
              note:
                "2014 clerics prepared from domain-specific lists and seldom touched weapon riders; earlier editions like AD&D granted broader armor but weaker at-will healing, whereas 2024 doubles down on radiant smites and shared Divine spells.",
              link: {
                label: "5e Cleric SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Cleric"
              }
            },
            subclasses: [
              {
                name: "Life Domain",
                spotlight:
                  "Classic healer boosted with automatic aid spells and empowered Blessed Healer burst heals.",
                features: [
                  "Disciple of Life now scales with spell level and can trigger on bonus-action healing spells",
                  "Preserve Life uses benefit from flexible targeting like Mass Healing Word previews"
                ],
                sources: [
                  {
                    label: "Life Domain Preview",
                    url: "https://www.dndbeyond.com/posts/1562-life-domain-cleric-updates"
                  }
                ],
                comparison: {
                  note:
                    "The 2024 Life cleric inherits potent healing like 5e but folds Prayer of Healing style mass cures into Channel Divinity, echoing 4e leader burst-heal pacing.",
                  link: {
                    label: "4e Healing Word",
                    url: "https://www.dndbeyond.com/posts/1193-healing-word-through-the-editions"
                  }
                }
              },
              {
                name: "War Domain",
                spotlight:
                  "Armored battle chaplain who capitalizes on weapon masteries while blessing allies' strikes.",
                features: [
                  "War Priest extra attacks now key off Weapon Mastery traits like Cleave",
                  "Guided Strike applies to any attack roll, mirroring UA previews for tactical crit fishing"
                ],
                sources: [
                  {
                    label: "War Domain Preview",
                    url: "https://www.dndbeyond.com/posts/1563-war-domain-cleric-first-look"
                  }
                ],
                comparison: {
                  note:
                    "2014 War clerics spent precious Channel uses on bonus attacks; the 2024 version leans into mastery riders similar to 3.5's Warpriest feat synergy.",
                  link: {
                    label: "3.5 Complete Divine Warpriest",
                    url: "https://www.dmsguild.com/product/19335/Complete-Divine-35"
                  }
                }
              }
            ]
          },
          {
            name: "Druid",
            role: "Primal shapeshifter & battlefield controller",
            primaryAbility: "Wisdom",
            hitDie: "d8",
            summary:
              "Template-driven Wild Shape and curated Primal spell access emphasize nature control alongside support rituals.",
            signatureFeatures: [
              "Wild Shape templates remove monster stat-block hunting while preserving Circle identity",
              "Channel Nature fuels both Wild Shape and subclass stances for clearer resource cadence",
              "Primal spell list highlights nature, weather, and healing staples without cross-list dilution"
            ],
            sources: [
              {
                label: "UA Playtest 6 Druid",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-6/druid"
              },
              {
                label: "2024 Player's Handbook Preview",
                url: "https://www.dndbeyond.com/posts/1557-druid-class-features-in-one-dnd"
              }
            ],
            comparison: {
              note:
                "2014 druids relied on beast stat blocks and could overshadow martials with Moon Circle spikes; 2024's templates echo 4e primal controller design, trading raw numbers for reliable utility and team buffs.",
              link: {
                label: "5e Druid SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Druid"
              }
            },
            subclasses: [
              {
                name: "Circle of the Moon",
                spotlight:
                  "Front-line shapeshifter with lunar forms that mix tanking and radiant bursts.",
                features: [
                  "Lunar Form tables offer defensive, mobility, and spellcasting variants keyed to proficiency",
                  "Moonlight Step grants bonus action teleports inspired by UA design goals"
                ],
                sources: [
                  {
                    label: "Circle of the Moon Preview",
                    url: "https://www.dndbeyond.com/posts/1558-moon-druid-template-revamp"
                  }
                ],
                comparison: {
                  note:
                    "Still the premier bear-tank, but the 2024 version balances damage more like 3.5's Wild Shape by capping spell slot synergy while adding radiant options absent in 2014.",
                  link: {
                    label: "3.5 Wild Shape Overview",
                    url: "https://www.d20srd.org/srd/classes/druid.htm#wildShape"
                  }
                }
              },
              {
                name: "Circle of the Land",
                spotlight:
                  "Terrain-specialist druid with expanded ritual repertoire and restorative boons.",
                features: [
                  "Land's Aid grants temporary hit points when casting nature rituals as previewed in the PHB updates",
                  "Nature's Ward now provides exhaustion resistance, echoing UA feedback"
                ],
                sources: [
                  {
                    label: "Land Druid Preview",
                    url: "https://www.dndbeyond.com/posts/1561-land-druid-returns"
                  }
                ],
                comparison: {
                  note:
                    "The subclass swaps 2014's narrow bonus spell lists for themed prepared spells akin to AD&D spheres, improving adaptability without overshadowing clerics.",
                  link: {
                    label: "AD&D Priest Spheres",
                    url: "https://www.dmsguild.com/product/110274/Players-Handbook-2e"
                  }
                }
              }
            ]
          },
          {
            name: "Fighter",
            role: "Weapon mastery commander & adaptable striker",
            primaryAbility: "Strength or Dexterity",
            hitDie: "d10",
            summary:
              "Expanded mastery slots and tactical surges reinforce the fighter as the benchmark martial damage dealer.",
            signatureFeatures: [
              "Mastery Progression grants multiple weapon masteries known and swap opportunities each level",
              "Second Wind scales into Tactician's Rally, granting teamwide temp HP and positioning",
              "Weapon Expertise at high tiers emulates Battlemaster dice without subclass dependency"
            ],
            sources: [
              {
                label: "UA Playtest 8 Fighter",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-8/fighter"
              },
              {
                label: "2024 Fighter Preview",
                url: "https://www.dndbeyond.com/posts/1553-fighter-class-overview"
              }
            ],
            comparison: {
              note:
                "2014 fighters leaned on Action Surge and subclass dice for spice, while 2024 baseline masteries evoke 4e martial powers, making core fighters less feat-dependent than AD&D weapon specialization trees.",
              link: {
                label: "5e Fighter SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Fighter"
              }
            },
            subclasses: [
              {
                name: "Champion",
                spotlight:
                  "Straightforward crit specialist now bolstered with heroic rerolls and extra masteries.",
                features: [
                  "Improved Critical now stacks with Weapon Expert rerolls previewed in the PHB",
                  "Resilient Athlete adds burst mobility akin to UA's Heroic Warrior options"
                ],
                sources: [
                  {
                    label: "Champion Preview",
                    url: "https://www.dndbeyond.com/posts/1554-champion-fighter-refresh"
                  }
                ],
                comparison: {
                  note:
                    "The 2024 Champion diverges from 2014's passive crit-fishing by layering mobility reminiscent of 3.5's Fleet of Foot feats, keeping the subclass competitive.",
                  link: {
                    label: "3.5 Fleet of Foot",
                    url: "https://www.d20srd.org/srd/epic/feats.htm#fleetOfFoot"
                  }
                }
              },
              {
                name: "Battle Master",
                spotlight:
                  "Tactical maneuver expert with upgraded dice and baseline masteries to combo riders.",
                features: [
                  "Combat Superiority dice recharge on short rests and scale to d12, aligning with UA expectations",
                  "Maneuver synergy with weapon masteries encourages controlling battlefield flow"
                ],
                sources: [
                  {
                    label: "Battle Master Preview",
                    url: "https://www.dndbeyond.com/posts/1555-battlemaster-in-2024"
                  }
                ],
                comparison: {
                  note:
                    "Compared to 2014, fewer maneuvers are gated behind feats, and the kit leans more toward 4e's Warlord support with Rallying Mark-style riders.",
                  link: {
                    label: "4e Martial Power Warlord",
                    url: "https://www.dmsguild.com/product/125066/Martial-Power"
                  }
                }
              }
            ]
          },
          {
            name: "Monk",
            role: "Mobile striker & control skirmisher",
            primaryAbility: "Dexterity and Wisdom",
            hitDie: "d8",
            summary:
              "Rebuilt Discipline Point economy and weapon masteries transform the monk into a reliable skirmisher.",
            signatureFeatures: [
              "Discipline Points equal proficiency bonus ensure more consistent resource flow than 2014 ki",
              "Martial Arts die scaling ties into Weapon Mastery access on monk weapons",
              "Deflect Attacks extends projectile deflection to melee strikes per UA previews"
            ],
            sources: [
              {
                label: "UA Playtest 6 Monk",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-6/monk"
              },
              {
                label: "2024 Monk Preview",
                url: "https://www.dndbeyond.com/posts/1559-monk-overhaul"
              }
            ],
            comparison: {
              note:
                "2014 monks struggled with ki starvation and lacked weapon synergy; the 2024 design channels 4e's striker accuracy and AD&D martial arts tables by embedding control riders into core features.",
              link: {
                label: "5e Monk SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Monk"
              }
            },
            subclasses: [
              {
                name: "Way of the Open Hand",
                spotlight:
                  "Classic pressure-point artist with new push, prone, or redirect riders tied to Discipline.",
                features: [
                  "Open Hand Technique now consumes Discipline to trigger multiple riders per turn",
                  "Quivering Palm integrates with revised Stunning Strike DC math for climactic finishes"
                ],
                sources: [
                  {
                    label: "Open Hand Preview",
                    url: "https://www.dndbeyond.com/posts/1564-open-hand-monk-first-look"
                  }
                ],
                comparison: {
                  note:
                    "Stunning Strike no longer dominates play like 2014, instead resembling 3.5's Stunning Fist cadence with explicit save DC scaling.",
                  link: {
                    label: "3.5 Stunning Fist",
                    url: "https://www.d20srd.org/srd/feats.htm#stunningFist"
                  }
                }
              },
              {
                name: "Warrior of Shadow",
                spotlight:
                  "Stealthy teleporting monk leveraging umbral step and battlefield denial.",
                features: [
                  "Shadow Step now functions with bonus-action teleportation keyed to Dim Light templates",
                  "Cloak of Shadow grants reactive invisibility previewed for 2024"
                ],
                sources: [
                  {
                    label: "Shadow Monk Preview",
                    url: "https://www.dndbeyond.com/posts/1565-shadow-monk-updates"
                  }
                ],
                comparison: {
                  note:
                    "Unlike 2014's Way of Shadow reliance on spell slots, the 2024 version channels 4e's Assassin-like umbral powers without multiclass dips.",
                  link: {
                    label: "4e Shadow Classes",
                    url: "https://www.dmsguild.com/product/17820/Players-Handbook-3-4e"
                  }
                }
              }
            ]
          },
          {
            name: "Paladin",
            role: "Aura-driven defender & burst striker",
            primaryAbility: "Charisma and Strength",
            hitDie: "d10",
            summary:
              "Rebalanced smite economy and aura scaling anchor the paladin as a durable support striker with weapon mastery access.",
            signatureFeatures: [
              "Lay on Hands now scales with proficiency, offering more uses for quick triage",
              "Divine Smite is limited to once per turn but frontloads radiant riders with Mastery combos",
              "Auras activate earlier and extend to 30 feet by late tiers, emphasizing defender positioning"
            ],
            sources: [
              {
                label: "UA Playtest 6 Paladin",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-6/paladin"
              },
              {
                label: "2024 Paladin Preview",
                url: "https://www.dndbeyond.com/posts/1556-paladin-updates"
              }
            ],
            comparison: {
              note:
                "2014 paladins nova-smote multiple times per round and had limited weapon riders; 2024 follows 3.5's smite cadence while echoing 4e aura leadership by widening buffs.",
              link: {
                label: "5e Paladin SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Paladin"
              }
            },
            subclasses: [
              {
                name: "Oath of Devotion",
                spotlight:
                  "Shining exemplar with vow magic emphasizing radiant weapon masteries and protection.",
                features: [
                  "Sacred Weapon integrates with Weapon Mastery to apply Push or Cleave riders",
                  "Aura of Devotion wards charm conditions as showcased in PHB teasers"
                ],
                sources: [
                  {
                    label: "Devotion Paladin Preview",
                    url: "https://www.dndbeyond.com/posts/1566-oath-of-devotion-spotlight"
                  }
                ],
                comparison: {
                  note:
                    "2014 Devotion paladins leaned on Channel Divinity for one-off buffs; the 2024 version mirrors AD&D paladin immunities with persistent aura scaling.",
                  link: {
                    label: "AD&D Paladin Abilities",
                    url: "https://www.dmsguild.com/product/110274/Players-Handbook-2e"
                  }
                }
              },
              {
                name: "Oath of Vengeance",
                spotlight:
                  "Relentless hunter locking foes down with pursuit auras and once-per-turn smite spikes.",
                features: [
                  "Relentless Avenger now adds mastery riders to opportunity attacks",
                  "Abjure Foe leverages the new Frightened rework for control"
                ],
                sources: [
                  {
                    label: "Vengeance Paladin Preview",
                    url: "https://www.dndbeyond.com/posts/1567-oath-of-vengeance-refresh"
                  }
                ],
                comparison: {
                  note:
                    "2014 Vengeance paladins stacked bonus-action smites; the 2024 iteration feels closer to 4e avengers with mobility boosts and single-swing potency.",
                  link: {
                    label: "4e Avenger Class",
                    url: "https://www.dmsguild.com/product/125230/Players-Handbook-2-4e"
                  }
                }
              }
            ]
          },
          {
            name: "Ranger",
            role: "Skirmishing scout & precision striker",
            primaryAbility: "Dexterity and Wisdom",
            hitDie: "d10",
            summary:
              "Hunter's Mark-centric gameplay and weapon masteries reinforce the ranger as a mobile controller with exploration utility.",
            signatureFeatures: [
              "Hunter's Mark is always prepared and adds scaling damage without consuming concentration at tier 3",
              "Expertise in two skills anchors the exploration pillar alongside revamped Favored Enemy",
              "Weapon Mastery choices reinforce ranged control with Slow or Push riders"
            ],
            sources: [
              {
                label: "UA Playtest 5 Ranger",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-5/ranger"
              },
              {
                label: "2024 Ranger Preview",
                url: "https://www.dndbeyond.com/posts/1550-ranger-updates"
              }
            ],
            comparison: {
              note:
                "2014 rangers juggled niche favored terrains and lacked damage reliability; the 2024 kit calls back to 3.5's Swift Hunter builds by tying precision damage to evergreen marks instead of situational bonuses.",
              link: {
                label: "5e Ranger SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Ranger"
              }
            },
            subclasses: [
              {
                name: "Hunter",
                spotlight:
                  "Versatile striker with pick-your-prey options tuned for weapon mastery riders.",
                features: [
                  "Colossus Slayer triggers alongside Hunter's Mark without extra actions per UA feedback",
                  "Multiattack features tie into Mastery types like Cleave or Slow"
                ],
                sources: [
                  {
                    label: "Hunter Ranger Preview",
                    url: "https://www.dndbeyond.com/posts/1551-hunter-ranger-evolves"
                  }
                ],
                comparison: {
                  note:
                    "The subclass trades 2014's situational damage options for evergreen triggers akin to 4e ranger Quarry powers.",
                  link: {
                    label: "4e Ranger Powers",
                    url: "https://www.dmsguild.com/product/125066/Martial-Power"
                  }
                }
              },
              {
                name: "Beast Master",
                spotlight:
                  "Companion-focused ranger whose bond benefits from unified stat blocks and teamwork actions.",
                features: [
                  "Primal Companion now scales automatically with proficiency and weapon masteries",
                  "Coordinated Assault lets both ranger and beast trigger mark damage"
                ],
                sources: [
                  {
                    label: "Beast Master Preview",
                    url: "https://www.dndbeyond.com/posts/1552-beastmaster-rebalanced"
                  }
                ],
                comparison: {
                  note:
                    "2014 Beast Masters lost their action economy commanding pets; the 2024 version resembles 3.5's animal companion progression with shared attacks baked in.",
                  link: {
                    label: "3.5 Animal Companion",
                    url: "https://www.d20srd.org/srd/classes/ranger.htm#animalCompanion"
                  }
                }
              }
            ]
          },
          {
            name: "Rogue",
            role: "Skill virtuoso & precision striker",
            primaryAbility: "Dexterity",
            hitDie: "d8",
            summary:
              "Expanded Cunning Action choices and automatic expertise keep rogues at the top of skill and single-target damage charts.",
            signatureFeatures: [
              "Cunning Strike converts Sneak Attack dice into status riders drawn from official previews",
              "Steady Aim remains optional while Weapon Mastery adds Slow or Vex to finesse builds",
              "Reliable Talent appears earlier, reflecting 2024's focus on consistent skill ceilings"
            ],
            sources: [
              {
                label: "UA Playtest 7 Rogue",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-7/rogue"
              },
              {
                label: "2024 Rogue Preview",
                url: "https://www.dndbeyond.com/posts/1549-rogue-class-highlights"
              }
            ],
            comparison: {
              note:
                "2014 rogues needed feats or allies for conditions; Cunning Strike echoes AD&D special attack tables and 3.5's debilitating strikes by letting rogues trade damage for control.",
              link: {
                label: "5e Rogue SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Rogue"
              }
            },
            subclasses: [
              {
                name: "Thief",
                spotlight:
                  "Classic burglar with boosted Fast Hands options and climb speed mobility.",
                features: [
                  "Fast Hands interacts with Magic Items per 2024 attunement previews",
                  "Supreme Sneak grants advantage without sacrificing bonus actions"
                ],
                sources: [
                  {
                    label: "Thief Preview",
                    url: "https://www.dndbeyond.com/posts/1549-rogue-class-highlights"
                  }
                ],
                comparison: {
                  note:
                    "Unlike 2014, Thief's Use Magic Device taps unified wand rules, nodding to 2e's rogue scroll use while staying balanced.",
                  link: {
                    label: "2e Use Scrolls",
                    url: "https://www.dmsguild.com/product/110274/Players-Handbook-2e"
                  }
                }
              },
              {
                name: "Soulknife",
                spotlight:
                  "Psionic infiltrator manifesting psychic blades with new debuff riders.",
                features: [
                  "Psionic Power dice refresh every long rest but flex into Cunning Strike effects",
                  "Manifest Echo lets you throw blades with Vex mastery for advantage setups"
                ],
                sources: [
                  {
                    label: "Soulknife Preview",
                    url: "https://www.dndbeyond.com/posts/1568-soulknife-evolution"
                  }
                ],
                comparison: {
                  note:
                    "2014 Soulknife relied on psionic energy dice as a Tasha's subclass; the 2024 frame hearkens back to 3.5's Psychic Rogue by deepening control riders.",
                  link: {
                    label: "3.5 Psychic Rogue",
                    url: "https://www.d20srd.org/srd/variant/classes/psychicRogue.htm"
                  }
                }
              }
            ]
          },
          {
            name: "Sorcerer",
            role: "Innate arcane blaster & flexible metamagic specialist",
            primaryAbility: "Charisma",
            hitDie: "d6",
            summary:
              "More spell preparation and refreshed Origin features let sorcerers shape the Arcane list with identity-rich metamagic.",
            signatureFeatures: [
              "Innate Sorcery grants bonus spells known tied to origin, easing the 2014 scarcity",
              "Sorcery Points recharge with Font of Magic using new conversion tables for broader play",
              "Spell list consolidation to Arcane gives access to iconic utility once exclusive to wizards"
            ],
            sources: [
              {
                label: "UA Playtest 7 Sorcerer",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-7/sorcerer"
              },
              {
                label: "2024 Sorcerer Preview",
                url: "https://www.dndbeyond.com/posts/1558-sorcerer-changes"
              }
            ],
            comparison: {
              note:
                "2014 sorcerers suffered from limited known spells compared to 3.5; the 2024 approach mirrors AD&D's wild mage optional spell gains while retaining modern metamagic pacing.",
              link: {
                label: "5e Sorcerer SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Sorcerer"
              }
            },
            subclasses: [
              {
                name: "Draconic Sorcery",
                spotlight:
                  "Heritage caster with element-flexible damage boosts and resilient scales.",
                features: [
                  "Draconic Resilience grants natural armor that stacks with new Shielded Spell metamagic",
                  "Elemental Affinity now switches damage types when you cast Arcane list spells previewed in 2024"
                ],
                sources: [
                  {
                    label: "Draconic Sorcerer Preview",
                    url: "https://www.dndbeyond.com/posts/1558-sorcerer-changes"
                  }
                ],
                comparison: {
                  note:
                    "Compared to 2014's static element choice, the 2024 draconic sorcerer channels 3.5's Energy Substitution feats for adaptability.",
                  link: {
                    label: "3.5 Energy Substitution",
                    url: "https://www.d20srd.org/srd/divine/divineAbilitiesFeats.htm#energySubstitution"
                  }
                }
              },
              {
                name: "Lunar Sorcery",
                spotlight:
                  "Phase-shifting caster balancing radiant, psychic, and necrotic spell lists.",
                features: [
                  "Lunar Embodiment rotates bonus spells per phase, drawing from official UA preview tables",
                  "Moon Fire empowers radiant cantrips with Vex mastery synergy"
                ],
                sources: [
                  {
                    label: "Lunar Sorcerer Preview",
                    url: "https://www.dndbeyond.com/posts/1428-lunar-sorcerer-unearthed-arcana"
                  }
                ],
                comparison: {
                  note:
                    "Originally a 2014 UA, the 2024 implementation leans into spell list swapping reminiscent of 2e specialty priests, a new twist for arcane casters.",
                  link: {
                    label: "2e Specialty Priests",
                    url: "https://www.dmsguild.com/product/110274/Players-Handbook-2e"
                  }
                }
              }
            ]
          },
          {
            name: "Warlock",
            role: "Pact-bound blaster & magical utility dealer",
            primaryAbility: "Charisma",
            hitDie: "d8",
            summary:
              "Rebalanced Pact Magic slots and customizable invocations let warlocks blend Arcane spells with patron-specific perks.",
            signatureFeatures: [
              "Spell slots scale to 5th level but refresh on short rest, while higher tiers grant Patron Spells via Mystic Arcanum",
              "Pact Boons arrive at level 1, letting you combine Blade, Chain, or Tome features immediately",
              "Invocation trees include weapon mastery support so Pact of the Blade competes with fighters"
            ],
            sources: [
              {
                label: "UA Playtest 7 Warlock",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-7/warlock"
              },
              {
                label: "2024 Warlock Preview",
                url: "https://www.dndbeyond.com/posts/1552-warlock-changes"
              }
            ],
            comparison: {
              note:
                "2014 warlocks capped at 5th-level slots with limited customization; the 2024 framework nods to 3.5 pact magic by front-loading boons and broadening spell prep akin to AD&D invoker kits.",
              link: {
                label: "5e Warlock SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Warlock"
              }
            },
            subclasses: [
              {
                name: "The Fiend",
                spotlight:
                  "Infernal pact caster wielding resilience and explosive blasts tied to new invocation trees.",
                features: [
                  "Dark One's Blessing scales with proficiency and stacks with temp HP masteries",
                  "Hurl Through Hell appears as a high-tier Mystic Arcanum rider per 2024 preview"
                ],
                sources: [
                  {
                    label: "Fiend Warlock Preview",
                    url: "https://www.dndbeyond.com/posts/1552-warlock-changes"
                  }
                ],
                comparison: {
                  note:
                    "The 2024 Fiend inherits 2014's damage focus but leans harder into survivability like 4e's infernal pact warlock, rewarding frontline pact blade builds.",
                  link: {
                    label: "4e Infernal Pact",
                    url: "https://www.dmsguild.com/product/125228/Players-Handbook-4e"
                  }
                }
              },
              {
                name: "The Great Old One",
                spotlight:
                  "Telepathic manipulator specializing in psychic riders and battlefield fear.",
                features: [
                  "Awakened Mind now grants proficiency bonus uses of telepathic commands",
                  "Eldritch Whispers introduces Cunning Strike-style debuffs in UA previews"
                ],
                sources: [
                  {
                    label: "Great Old One Preview",
                    url: "https://www.dndbeyond.com/posts/1552-warlock-changes"
                  }
                ],
                comparison: {
                  note:
                    "Earlier editions lacked psychic-focused warlocks; the 2024 version draws from 3.5's Binder influence with contact other plane style boons baked in.",
                  link: {
                    label: "3.5 Binder",
                    url: "https://www.d20srd.org/srd/variant/magic/incarnum/auraMagic.htm"
                  }
                }
              }
            ]
          },
          {
            name: "Wizard",
            role: "Arcane scholar & flexible controller",
            primaryAbility: "Intelligence",
            hitDie: "d6",
            summary:
              "Rebalanced spell preparation, class features, and weapon options reinforce the wizard as the archetypal Arcane toolkit caster.",
            signatureFeatures: [
              "Memorize Spell lets wizards swap prepared spells during short rests, fulfilling a key 2024 design promise",
              "Scholarly Focus replaces some subclass features with universal Arcane Recovery boosts",
              "Weapon Mastery access to simple weapons gives staff-focused builds new defensive riders"
            ],
            sources: [
              {
                label: "UA Playtest 7 Wizard",
                url: "https://www.dndbeyond.com/sources/ua/ph-playtest-7/wizard"
              },
              {
                label: "2024 Wizard Preview",
                url: "https://www.dndbeyond.com/posts/1557-wizard-class-update"
              }
            ],
            comparison: {
              note:
                "2014 wizards dominated versatility but lacked mid-day swaps; the 2024 approach nods to AD&D memorization pacing while keeping 5e's bounded accuracy.",
              link: {
                label: "5e Wizard SRD",
                url: "https://www.dndbeyond.com/sources/srd/classes#Wizard"
              }
            },
            subclasses: [
              {
                name: "Evoker",
                spotlight:
                  "Damage-focused mage with empowered area spells and sculpted blasts.",
                features: [
                  "Sculpt Spells expands to protect more allies as proficiency increases",
                  "Potent Cantrip integrates with Arcane list updates for reliable damage"
                ],
                sources: [
                  {
                    label: "Evoker Preview",
                    url: "https://www.dndbeyond.com/posts/1557-wizard-class-update"
                  }
                ],
                comparison: {
                  note:
                    "Evocation specialists hearken back to 3.5's focused specialist wizards by trading spell slots for consistent blasting without meta-tax.",
                  link: {
                    label: "3.5 Focused Specialist",
                    url: "https://www.d20srd.org/srd/variant/classes/specialistWizardVariants.htm"
                  }
                }
              },
              {
                name: "Illusionist",
                spotlight:
                  "Deceptive arcanist crafting visual trickery and psychic misdirection.",
                features: [
                  "Improved Illusions grant half-cover and debuff riders based on UA preview feedback",
                  "Illusory Self recharges on short rests thanks to memorization updates"
                ],
                sources: [
                  {
                    label: "Illusionist Preview",
                    url: "https://www.dndbeyond.com/posts/1557-wizard-class-update"
                  }
                ],
                comparison: {
                  note:
                    "The subclass leans into AD&D illusionist specialty schools, contrasting 2014's limited once-per-rest decoy with a sturdier suite of trickery tools.",
                  link: {
                    label: "AD&D Illusionist",
                    url: "https://www.dmsguild.com/product/110274/Players-Handbook-2e"
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
        "4e": [
          {
            name: "Fighter",
            role: "Martial Defender & battlefield controller",
            primaryAbility: "Strength or Dexterity",
            hitDie: "HP: 15 + Con score; +6 per level",
            summary:
              "Lock foes in place with marks and martial power cards that reward tactical positioning across the grid.",
            signatureFeatures: [
              "Combat Challenge marks enemies and punishes them for shifting or attacking allies",
              "Combat Superiority boosts opportunity attack accuracy and enables forced-movement riders",
              "At-will, encounter, and daily exploits offer reliable lockdown tailored to defender duties"
            ],
            sources: [
              {
                label: "Player's Handbook (4e)",
                url: "https://www.dmsguild.com/product/125228/Players-Handbook-4e"
              },
              {
                label: "Martial Power",
                url: "https://www.dmsguild.com/product/125235/Martial-Power"
              }
            ],
            comparison: {
              note:
                "5e fighters lean on Action Surge and subclass dice for burst turns; the 4e chassis revolves around sticky marks and immediate interrupts, so forward conversions often graft on 2024 weapon masteries or Sentinel-style feats to keep that control identity.",
              link: {
                label: "Fighter Class (5e Basic Rules)",
                url: "https://www.dndbeyond.com/sources/basic-rules/classes#Fighter"
              }
            },
            subclasses: [
              {
                name: "Battlerager Vigor",
                spotlight:
                  "Spiked-armor bruiser build that turns punishment into temp HP and retaliation swings.",
                features: [
                  "Battlerager Vigor grants temp HP whenever you hit with an invigorating power or absorb a marked foe's blow",
                  "Spiked armor training adds splash damage and forced-movement payoffs for charging into enemy lines"
                ],
                sources: [
                  {
                    label: "Martial Power",
                    url: "https://www.dmsguild.com/product/125235/Martial-Power"
                  }
                ],
                comparison: {
                  note:
                    "5e's Battlerager Barbarian mimics the temp HP loop but lacks defender marks; porting the build forward usually means pairing the Barbarian with Sentinel or Shield Master to replicate 4e's stickiness.",
                  link: {
                    label: "Battlerager Barbarian (SCAG)",
                    url: "https://www.dndbeyond.com/sources/scag/classes#BarbarianPrimalPaths"
                  }
                }
              }
            ]
          },
          {
            name: "Cleric",
            role: "Divine Leader & battlefield coach",
            primaryAbility: "Wisdom",
            hitDie: "HP: 12 + Con score; +5 per level",
            summary:
              "Channel the divine power source to heal, buff, and direct allies with radiant prayers and Channel Divinity tricks.",
            signatureFeatures: [
              "Healer's Lore adds Wisdom to each healing power, stretching party surges",
              "Channel Divinity and Turn Undead arrive as encounter powers for tactical spikes",
              "Leader prayers layer attack bonuses, saving throws, and free movement onto the team"
            ],
            sources: [
              {
                label: "Player's Handbook (4e)",
                url: "https://www.dmsguild.com/product/125228/Players-Handbook-4e"
              },
              {
                label: "Divine Power",
                url: "https://www.dmsguild.com/product/125237/Divine-Power"
              }
            ],
            comparison: {
              note:
                "5e clerics focus on prepared spell slots and fewer Channel Divinity uses each rest; 4e clerics hand out bonuses every round, so modern tables often borrow Tasha's optional domain features to keep that constant support cadence.",
              link: {
                label: "Cleric Class (5e Basic Rules)",
                url: "https://www.dndbeyond.com/sources/basic-rules/classes#Cleric"
              }
            },
            subclasses: [
              {
                name: "Battle Cleric's Lore (Warpriest)",
                spotlight:
                  "Essentials Warpriest build that trades heavier armor and melee accuracy for weapon-infused prayers.",
                features: [
                  "Battle Cleric's Lore grants scale armor proficiency and Strength-based bonuses on at-will attacks",
                  "Domain powers swap daily slots for themed attack riders like Sun Burst or Storm Hammer"
                ],
                sources: [
                  {
                    label: "Heroes of the Fallen Lands",
                    url: "https://www.dmsguild.com/product/101891/Heroes-of-the-Fallen-Lands"
                  }
                ],
                comparison: {
                  note:
                    "5e's War Domain captures the same martial-cleric fantasy but drops the automatic +2 AC from Battle Cleric's Lore; conversions usually lean on Fighting Initiate or Blessed Warrior fighting styles to bridge the gap.",
                  link: {
                    label: "War Domain (5e SRD)",
                    url: "https://www.dndbeyond.com/sources/srd/subclasses#ClericDivineDomains"
                  }
                }
              }
            ]
          },
          {
            name: "Wizard",
            role: "Arcane Controller & ritual savant",
            primaryAbility: "Intelligence",
            hitDie: "HP: 10 + Con score; +4 per level",
            summary:
              "Master the arcane power source with spellbook-prepared power cards that reshape the battlefield each round.",
            signatureFeatures: [
              "Spellbook lets you reselect daily and utility powers after each extended rest",
              "Implement mastery (orb, staff, wand) modifies control riders like save penalties or AC bonuses",
              "Built-in Ritual Casting unlocks an expansive utility library without extra feats"
            ],
            sources: [
              {
                label: "Player's Handbook (4e)",
                url: "https://www.dmsguild.com/product/125228/Players-Handbook-4e"
              },
              {
                label: "Arcane Power",
                url: "https://www.dmsguild.com/product/125236/Arcane-Power"
              }
            ],
            comparison: {
              note:
                "5e wizards juggle spell slots and concentration checks, whereas 4e wizards rotate encounter powers and save-ends control; bridging editions often means translating key encounter powers into once-per-short-rest options with baked-in riders.",
              link: {
                label: "Wizard Class (5e Basic Rules)",
                url: "https://www.dndbeyond.com/sources/basic-rules/classes#Wizard"
              }
            },
            subclasses: [
              {
                name: "Orb of Imposition",
                spotlight:
                  "Control-focused build that deepens save-ends effects through orb implement mastery.",
                features: [
                  "Once per encounter you extend or intensify a save-ends condition, keeping solos locked down",
                  "Synergizes with powers like Sleep and Maze of Mirrors to stack hefty attack penalties"
                ],
                sources: [
                  {
                    label: "Player's Handbook (4e)",
                    url: "https://www.dmsguild.com/product/125228/Players-Handbook-4e"
                  },
                  {
                    label: "Arcane Power",
                    url: "https://www.dmsguild.com/product/125236/Arcane-Power"
                  }
                ],
                comparison: {
                  note:
                    "Later-edition controllers depend on concentration or limited spell-save DC boosts; Orb wizards stack recurring penalties, so conversions often borrow 2024 Sustained Spell previews or homebrew exhaustion riders to emulate that inevitability.",
                  link: {
                    label: "2024 Wizard Preview",
                    url: "https://www.dndbeyond.com/sources/ua/ph-playtest-7/wizard"
                  }
                }
              }
            ]
          },
          {
            name: "Ranger",
            role: "Martial Striker & mobile hunter",
            primaryAbility: "Dexterity or Strength",
            hitDie: "HP: 12 + Con score; +5 per level",
            summary:
              "Lean on the martial power source for high-accuracy skirmishes, stacking Hunter's Quarry damage while darting around the map.",
            signatureFeatures: [
              "Hunter's Quarry adds d6 precision damage once per round against a focused target",
              "Fighting Style features bake in two-weapon or archery bonuses to at-will exploits",
              "Utility powers grant shifting, stealth edges, and terrain traversal to keep you elusive"
            ],
            sources: [
              {
                label: "Player's Handbook (4e)",
                url: "https://www.dmsguild.com/product/125228/Players-Handbook-4e"
              },
              {
                label: "Martial Power 2",
                url: "https://www.dmsguild.com/product/125241/Martial-Power-2"
              }
            ],
            comparison: {
              note:
                "5e rangers regained reliable damage through Tasha's optional features, but 4e assumes guaranteed quarry dice each round; when updating forward, many DMs graft Favored Foe (Tasha's) or Hunter's Mark at-will usage to sustain that striker cadence.",
              link: {
                label: "Ranger Class (5e Basic Rules)",
                url: "https://www.dndbeyond.com/sources/basic-rules/classes#Ranger"
              }
            },
            subclasses: [
              {
                name: "Beastmaster",
                spotlight:
                  "Companion-focused build that commands an animal ally alongside your own skirmisher attacks.",
                features: [
                  "Shared standard actions let the beast strike whenever you do, keeping striker DPR high without sacrificing your turn",
                  "Companion choices (wolf, raptor, bear, panther) add flanking, flight, or knockdown utility keyed to role"
                ],
                sources: [
                  {
                    label: "Martial Power",
                    url: "https://www.dmsguild.com/product/125235/Martial-Power"
                  },
                  {
                    label: "Martial Power 2",
                    url: "https://www.dmsguild.com/product/125241/Martial-Power-2"
                  }
                ],
                comparison: {
                  note:
                    "5e's original Beast Master split actions awkwardly until Tasha's overhaul; the 4e Beastmaster always shares attacks with its companion, so modern adaptations lean on Primal Companion rules or custom bonus-action riders to mimic that responsiveness.",
                  link: {
                    label: "Beast Master (Tasha's Cauldron)",
                    url: "https://www.dndbeyond.com/sources/tcoe/subclasses-ranger#BeastMasterConclave"
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
