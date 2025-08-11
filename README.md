# Catalyst Core Character Tracker

Top bar controls
	•	Initiative Tracker. Opens a simple encounter tracker to enter names and initiative values, then sorts them. Use it at the start of combat and between rounds.
	•	Load. Restores your last saved character from this browser. If you have more than one save option in your build, pick by name or slot.
	•	Save. Writes your entire character sheet, combat state, and session journal to this browser’s storage.
	•	Roll/Flip Log. Opens your session’s history of dice rolls and coin flips in a scrollable overlay.

Tools panel
	•	Dice Roller. Choose a die (d4 to d100), set a quantity, roll, and the result appears inline and in the Log.
	•	Coin Flip. Quick heads-or-tails that also records to the Log.
	•	Results persist in the Log even if you switch tabs.

Combat tab

Hit Points
	•	HP bar and pill. Shows current and max HP as current/max. On first load, the bar fills to max.
	•	Damage. Click to subtract the entered amount from current HP.
	•	Heal. Click to add the entered amount, capped at max.
	•	Reset HP. Instantly sets current HP to max.
	•	Temp HP. If your build shows a Temp HP field, that value is displayed as a bonus in the pill and is not added to the max.

Stamina Points
	•	SP bar and pill. Shows current and max SP as current/max. On first load, the bar fills to max.
	•	Spend buttons. Quick subtractors for common costs. Many tables prefer -1, -4, -5. If you see -2 and -3, they behave the same way and can be ignored if you do not need them.
	•	Reset SP. Restores SP to max. If your table rules refresh SP each round, click this at end of your turn.

Cinematic Action Point
	•	Description. A short rules reminder lives on the card, with a simple state tracker.
	•	Use. Marks it spent.
	•	Reset. Makes it available again. Typical pacing is 1 per encounter or per narrative beat.

Initiative Tracker workflow
	1.	Click Initiative Tracker on the top bar.
	2.	Enter participant names and rolls.
	3.	Sort and step through turns.
	4.	Between rounds, use Reset SP if your table refreshes SP each round.

Abilities tab
	•	Ability Scores. STR, DEX, CON, INT, WIS, CHA. Enter raw scores.
	•	Auto modifiers. Modifiers calculate automatically from scores and are used across the sheet.
	•	Saving Throws. Values auto-calc from abilities and proficiency, with room for bonuses.
	•	Skills. Skills and passive values auto-calc from abilities and proficiency. You can add situational bonuses in their bonus boxes if present in your build.

Powers tab
	•	Add Power. Creates a power card with name, SP cost, damage dice selector, save type, tags, and a freeform description.
	•	Roll Power. When you click the roll on a power, the result records to the Log and the listed SP cost is deducted from your SP bar automatically.
	•	Signature Move. A dedicated card for your hallmark ability with name, SP cost, any save, special notes, a narrative description, and meaning. It does not block adding other powers.

Gear tab
	•	Weapons, Armor, Items. Use the Add buttons to create entries with notes on effects, damage, or utility.
	•	Armor and TC. If your build includes Toughness Class fields, set your base TC and any modifiers here.
	•	Inventory notes. Freeform notes allow you to track charges, weight, or rarity.

Story tab
	•	Identity and Origin. Narrative identity fields that also appear on your print-style view if you export in other builds.
	•	Tier Roll and Bonus HP. These determine your HP max. The Combat tab reflects that automatically.
	•	Journal. A running session journal. Text here is saved with your character.

Logging and history
	•	Roll/Flip Log overlay. Shows dice and coin results in order.
	•	Timestamps. Entries are time-stamped per action.
	•	Clearing. If your build includes a Clear Log action, use it between sessions to keep things tidy.

Save and load
	•	Save. Writes the entire character, including journal and current HP/SP bars, to this browser’s local storage.
	•	Load. Restores the last saved state.
	•	Scope. Saves are device and browser specific. Saving on your phone does not sync to your desktop unless you have added a cloud backend yourself.
