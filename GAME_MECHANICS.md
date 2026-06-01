## Game Mechanics

A player has a collection of dice with various enhancements, stickers, auras. Each dice in the collection needs to have a unique id so we can track its current zone. 

A dice can be in the following 4 zones at any given time:

1. draw zone - this zone is for dice that are available to be picked during your roll phase. When the draw zone has been completely used up, dice in the discard zone are moved to the draw zone and made available again. 
2. roll zone - this zone is for your selected dice and this roll zone size is controlled by your hand size. You draw dice from the draw zone into this zone when starting your roll phase, and then roll/reroll them till you get dice hits (a hit means any symbol has landed face up). If the draw zone does not contain enough dice to reach hand size, move all dice from the discard zone into the draw zone and continue drawing until hand size is reached.
3. active zone - this zone is a temporary zone where dice that have hit during the roll phase get placed in. A dice that lands on a symbol must be moved to the active zone, you do not get to reroll a die symbol.
4. discard zone - after you stop rerolling during your roll phase you score your dice in the active zone, all dice in your active zone are moved to the discard zone.

## Phase/Zone Diagram

|           | Roll Phase                               |             |
| --------- | ---------------------------------------- | ----------- |
| Draw Zone | Roll Zone                                | Active Zone | Discard |
|           | Draw -> Roll -> Move hits to Active Sone |             |


A round consist of 4 days (by default) to travel a set number of miles using the dice and equipment cards to boost your score. For this first prototype I just want to make sure we can roll/score dice and that the dice zone info is accurate.

One behind the scenes, make it fun, feature I want to enable is that the first roll of each day you are guaranteed to hit at least 3 symbols, so we'll need to fudge the rolls a bit if this doesn't occur naturally. After the first roll of the day is generated, if fewer than 3 symbols were rolled, randomly convert blank results into symbol results until exactly 3 symbols are showing.

## Phases

We've already touched on this a bit, but there are a few phases during a round, they are:

1. draw phase - this is where you select dice from your draw zone and place them into your roll zone. Clicking roll starts the next phase, the roll phase.
2. roll phase - this is a loop where you can keep rerolling your dice till you score your dice or you bust. Busting is when you reroll and get zero hits (No symbols) on any of the rerolled dice. A bust occurs whenever the player presses Hit and none of the rerolled dice produce a symbol. Dice moved to the active zone are locked and cannot be rerolled for the remainder of the roll phase.
3. score phase - this phase is a non interactive phase where the game animation will take over and show each dice scoring, equipment effects, fun stuff like that as it totals your final score. The score phase can you kick you back to the draw phase if you have not hit your target score, or it can determine you did not reach your target score in the alotted days so you lose, or if you have hit your target score then moves you out of the game scene and into a win screen with payout information for completing the round successfully. Its important to note that dice in the active zone get moved to your discard zone even if you win the round, and your dices zone information remains intact from round to round, so you must cycle through your entire collection making culling your dice a good strategy to prevent "deck" bloat.

## UI

Presentation wise for the screen while playing i want to show have all dice in there labeled zones laded out in columns, so draw, roll, active, discard. The game should start with all 4 columns visible and the dice in each zone visible but zoomed out. 

Then since the game starts in the draw phase the game needs to animate zooming in to the [draw, roll] zones so only those 2 zones are visible. From here you click on individual dice you want to use and you see them animate moving over to the roll zone. While in the draw phase there will be a "Roll" button but it will be disabled and read "Pick N dice" where N is the number of remaining dice you need to draw to reach your hand size (9 dice by default). Once you have selected your 9 dice you can click the "Roll" button.

Now in the roll phase, the camera animates over so that only [roll,active] zones are visible on the screen. After your dice animate rolling, the dice that hit automatically move to the active zone. From here there are only too options, a "Hit" and "Score" button are visible. Hit means to reroll your remaining dice. Score means to end the roll phase and enter the score phase. After the scoring animations take place scoring your active zone dice (Some dice in the roll zone can still contribute to scoring like steel dice) the dice in your active zone get moved to your discard zone.

If you win or lose just show a view of a red/green page with a "you win" or "you lose" title and a button to play again. Not going to worry about the shop/round select/ or anything else right now.

All four zones should always exist in the UI.

The active phase is emphasized by zooming or centering the relevant zones:

Draw Phase: focus Draw + Roll
Roll Phase: focus Roll + Active
Score Phase: focus Roll + Active then shift to focus Active + Discard after scoring is completed so you can see your active dice move to the discard zone.

## Dice

Currently our mocked up dice are D12 (12 sided) dice. that needs to be changed to be D6 (6 sided dice). Completely remove the current die component ui and replace it with a very simple implementation of just a colored square with slightly round corners. Color and symbol information is below. Make sure the configuration for this is done in src/data/dice.ts

Symbols to use for now till we can some svgs:
Boot: 🥾 - adds +10 miles to score
Cross Bones: ☠ - adds +4 mult to score
Clover: 🍀 - 50% chance at +10 mult AND %25 chance at +$10
Lightning Bolt: 🗲 - x2 mult (multiplies the mult on score, doesn't affect base miles)


### Standard Dice - white color

1. Blank
2. Blank
3. Blank
4. Blank
5. Boot
6. Cross Bones

### Gold Dice - gold color

1. Blank + $3 at round end
2. Blank + $3 at round end
3. Blank + $3 at round end
4. Boot
5. Boot
6. Cross Bones

### Bone Dice - tan color

1. Blank
2. Blank
3. Cross Bones
4. Cross Bones
5. Cross Bones
6. Cross Bones

### Diamond - light blue color

Broken dice are permanently removed from the player's collection at the end of scoring.

1. Blank
2. Blank
3. Cross Bones
4. Boot
5. Lightning Bolt - 25% chance to break
6. Lightning Bolt - 25% chance to break

### Wooden - brown color

1. Blank
2. Blank
3. Boot
4. Boot
5. Boot
6. Boot

### Stone - light gray color

Stone die are unique in that they have no symbols at all. They are just a free +50 miles to your score. The game needs to score stone die blanks as if they are hits and will always be moved to the active zone after roll.

1. Blank +50
2. Blank +50
3. Blank +50
4. Blank +50
5. Blank +50
6. Blank +50

### Steel - dark gray color

Steel dice are unique in that they contribute to your score even if they have blanks and are still in your draw zone. They multiple your mult in order from left to right. 

1. Blank - x1.5 mult
2. Blank - x1.5 mult
3. Blank - x1.5 mult
4. Boot
5. Cross Bones
6. Cross Bones

### Lucky - green color

1. Blank
2. Blank
3. Boot
4. Clover
5. Clover
6. Clover

### Loaded Die - red color

1. Blank
2. Blank
3. Blank
4. Boot
5. Cross Bones
6. Cross Bones


## Super Simple Flow of MVP

Select dice
Roll dice
Move dice between zones
Hit / Bust
Score dice
Advance days
Win / Lose