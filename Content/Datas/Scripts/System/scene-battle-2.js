/*
    RPG Paper Maker Copyright (C) 2017-2019 Marie Laporte

    This file is part of RPG Paper Maker.

    RPG Paper Maker is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    RPG Paper Maker is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
*/

// -------------------------------------------------------
//
//  CLASS SceneBattle
//
//  Step 2 :
//      SubStep 0 : Animation and/or moving user
//      SubStep 1 : Damages
//      SubStep 2 : Back to position
//
// -------------------------------------------------------

SceneBattle.prototype.initializeStep2 = function() {
    var equipments, gameItem, weapon, effects, informationText;
    var i, j, l, ll;

    switch (this.battleCommandKind) {
    case EffectSpecialActionKind.ApplyWeapons:
        informationText = this.attackSkill.name;
        break;
    case EffectSpecialActionKind.OpenSkills:
        informationText = this.windowChoicesSkills.getCurrentContent().skill
            .name;
        break;
    }
    this.windowTopInformations.content = new GraphicText(informationText);

    this.time = new Date().getTime();

    this.damages = [];
    this.effects = [];
    switch (this.battleCommandKind) {
    case EffectSpecialActionKind.ApplyWeapons:
        equipments = this.user.character.equip;
        for (i = 0, l = equipments.length; i < l; i++) {
            gameItem = equipments[i];
            if (gameItem && gameItem.k === ItemKind.Weapon) {
                weapon = gameItem.getItemInformations();
                for (j = 0, ll = weapon.effects.length; j < ll; j++) {
                    this.effects.push(weapon.effects[j]);
                }
            }
        }
        if (this.effects.length === 0) {
            effects = this.attackSkill.effects;
            for (i = 1, l = effects.length; i < l; i++) {
                this.effects.push(effects[i]);
            }
        }
        break;
    case EffectSpecialActionKind.OpenSkills:
        this.effects = this.windowChoicesSkills.getCurrentContent().skill
            .effects;
        break;
    }
    this.currentEffectIndex = 0;
    if (this.effects.length > 0) {
        this.effects[this.currentEffectIndex].executeInBattle();
    }

    this.user.setAttacking();
};

// -------------------------------------------------------

SceneBattle.prototype.updateStep2 = function() {
    var isAnotherEffect;
    var i, l;

    if (!this.user.isAttacking()) {
        for (i = 0, l = this.targets.length; i < l; i++) {
            this.targets[i].updateDead(true);
        }
    }

    if (new Date().getTime() - this.time >= 2000) {
        this.currentEffectIndex++;
        isAnotherEffect = this.currentEffectIndex < this.effects.length;
        if (isAnotherEffect) {
            this.time = new Date().getTime();
            this.effects[this.currentEffectIndex].executeInBattle();
            $requestPaintHUD = true;
        } else {
            this.user.setActive(false);
            this.user.selected = false;
        }

        // Target and user test death
        this.user.updateDead(false);
        for (i = 0, l = this.targets.length; i < l; i++) {
            this.targets[i].updateDead(false);
        }

        // Testing end of battle
        if (this.isWin()) {
            this.activeGroup();
            this.changeStep(4);
        } else if (this.isLose()) {
            this.gameOver();
        } else {
            if (isAnotherEffect) {
                return;
            }

            // Testing end of turn
            if (this.isEndTurn()) {
                this.activeGroup();
                if (this.attackingGroup === CharacterKind.Hero) {
                    this.changeStep(3); // Attack of ennemies
                } else {
                    this.changeStep(1); // Attack of heroes
                }
            } else {
                if (this.attackingGroup === CharacterKind.Hero) {
                    this.changeStep(1); // Attack of heroes
                } else {
                    this.changeStep(3); // Attack of ennemies
                }
            }
        }
    }
};

// -------------------------------------------------------

SceneBattle.prototype.onKeyPressedStep2 = function(key){

};

// -------------------------------------------------------

SceneBattle.prototype.onKeyReleasedStep2 = function(key){

};

// -------------------------------------------------------

SceneBattle.prototype.onKeyPressedRepeatStep2 = function(key){

};

// -------------------------------------------------------

SceneBattle.prototype.onKeyPressedAndRepeatStep2 = function(key){

};

// -------------------------------------------------------

SceneBattle.prototype.drawHUDStep2 = function(){
    this.windowTopInformations.draw();

    // Draw damages
    if (!this.user.isAttacking()) {
        var i, l = this.damages.length;
        var target, pos, damage;
        for (i = 0; i < l; i++){
            damage = this.damages[i];
            this.targets[i].drawDamages(damage[0], damage[1], damage[2]);
        }
    }
};
