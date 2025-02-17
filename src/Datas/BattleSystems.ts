/*
    RPG Paper Maker Copyright (C) 2017-2023 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { IO, Paths, Utils, Enum } from "../Common";
import { System, Datas } from "../index";
import SongKind = Enum.SongKind;

/** @class
 *  All the battle System datas.
 *  @static
 */
class BattleSystems {

    private static elements: System.Element[];
    private static elementsOrder: number[];
    private static statistics: System.Statistic[];
    public static statisticsOrder: number[];
    public static statisticsElements: number[];
    public static statisticsElementsPercent: number[];
    public static maxStatisticID: number;
    private static equipments: System.Translatable[];
    public static equipmentsOrder: number[];
    public static maxEquipmentID: number;
    private static weaponsKind: System.WeaponArmorKind[];
    private static armorsKind: System.WeaponArmorKind[];
    private static battleCommands: number[];
    public static battleCommandsOrder: number[];
    private static battleMaps: System.BattleMap[];
    public static idLevelStatistic: number;
    public static idExpStatistic: number;
    public static formulaIsDead: System.DynamicValue;
    public static formulaCrit: System.DynamicValue;
    public static heroesBattlersCenterOffset: System.DynamicValue;
    public static heroesBattlersOffset: System.DynamicValue;
    public static troopsBattlersCenterOffset: System.DynamicValue;
    public static troopsBattlersOffset: System.DynamicValue;
    public static battleMusic: System.PlaySong;
    public static battleLevelUp: System.PlaySong;
    public static battleVictory: System.PlaySong;
    public static cameraMoveInBattle: boolean;
        
    constructor() {
        throw new Error("This is a static class!");
    }

    /** 
     *  Read the JSON file associated to battle System.
     */
    static async read() {
        let json = await IO.parseFileJSON(Paths.FILE_BATTLE_SYSTEM);

        // Elements
        this.elements = [];
        this.elementsOrder = [];
        Utils.readJSONSystemList({ list: Utils.defaultValue(json.elements, []), 
            listIDs: this.elements, listIndexes: this.elementsOrder, indexesIDs: 
            true, cons: System.Element });

        // Statistics
        this.statistics = [];
        this.statisticsOrder = [];
        this.maxStatisticID = Utils.readJSONSystemList({ list: Utils.defaultValue(
            json.statistics, []), listIDs: this.statistics, listIndexes: this
            .statisticsOrder, indexesIDs: true, cons: System.Statistic });

        // Add elements res to statistics
        this.statisticsElements = [];
        this.statisticsElementsPercent = [];
        let index = this.statisticsOrder.length;
        let id: number, name: string, i: number, l: number;
        for (i = 0, l = this.elementsOrder.length; i < l; i++) {
            id = this.elementsOrder[i];
            name = this.elements[id].name();
            this.statistics[this.maxStatisticID + (i * 2) + 1] = System.Statistic
                .createElementRes(id, name);
            this.statistics[this.maxStatisticID + (i * 2) + 2] = System.Statistic
                .createElementResPercent(id, name);
            this.statisticsOrder[index + (i * 2)] = this.maxStatisticID + (i * 2) + 1;
            this.statisticsOrder[index + (i * 2) + 1] = this.maxStatisticID + (i * 2) + 2;
            this.statisticsElements[id] = this.maxStatisticID + (i * 2) + 1;
            this.statisticsElementsPercent[id] = this.maxStatisticID + (i * 2) + 2;
        }
        this.maxStatisticID += l * 2;

        // Equipments
        this.equipments = [];
        this.equipmentsOrder = [];
        this.maxEquipmentID = Utils.readJSONSystemList({ list: Utils
            .defaultValue(json.equipments, []), listIDs: this.equipments, 
            listIndexes: this.equipmentsOrder, indexesIDs: true, cons: System
            .Translatable });
        this.weaponsKind = [];
        Utils.readJSONSystemList({ list: Utils.defaultValue(json.weaponsKind, []
            ), listIDs: this.weaponsKind, cons: System.WeaponArmorKind });

        // Armors kind
        this.armorsKind = [];
        Utils.readJSONSystemList({ list: Utils.defaultValue(json.armorsKind, [])
            , listIDs: this.armorsKind, cons: System.WeaponArmorKind });

        // Battle commands
        this.battleCommands = [];
        this.battleCommandsOrder = [];
        Utils.readJSONSystemList({ list: Utils.defaultValue(json.battleCommands, 
            []), listIDs: this.battleCommands, listIndexes: this
            .battleCommandsOrder, indexesIDs: true, func: (jsonBattleCommand: 
            Record<string, any>) =>
            {
                return jsonBattleCommand.s;
            }
        });

        // Battle maps
        this.battleMaps = [];
        Utils.readJSONSystemList({ list: Utils.defaultValue(json.battleMaps, []), 
            listIDs: this.battleMaps, cons: System.BattleMap });

        // Ids of specific statistics
        this.idLevelStatistic = json.lv;
        this.idExpStatistic = json.xp;

        // Formulas
        this.formulaIsDead = new System.DynamicValue(json.fisdead);
        this.formulaCrit = System.DynamicValue.readOrDefaultMessage(json.fc);
        this.heroesBattlersCenterOffset = System.DynamicValue.readOrDefaultMessage(json.heroesBattlersCenterOffset, "new Core.Vector3(2 * Datas.Systems.SQUARE_SIZE, 0, -Datas.Systems.SQUARE_SIZE)");
        this.heroesBattlersOffset = System.DynamicValue.readOrDefaultMessage(json.heroesBattlersOffset, "new Core.Vector3(i * Datas.Systems.SQUARE_SIZE / 2, 0, i * Datas.Systems.SQUARE_SIZE)");
        this.troopsBattlersCenterOffset = System.DynamicValue.readOrDefaultMessage(json.troopsBattlersCenterOffset, "new Core.Vector3(-2 * Datas.Systems.SQUARE_SIZE, 0, -Datas.Systems.SQUARE_SIZE)");
        this.troopsBattlersOffset = System.DynamicValue.readOrDefaultMessage(json.troopsBattlersOffset, "new Core.Vector3(-i * Datas.Systems.SQUARE_SIZE * 3 / 4, 0, i * Datas.Systems.SQUARE_SIZE)");

        // Musics
        this.battleMusic = new System.PlaySong(SongKind.Music, json.bmusic);
        this.battleLevelUp = new System.PlaySong(SongKind.Sound, json.blevelup);
        this.battleVictory = new System.PlaySong(SongKind.Music, json.bvictory);

        // Options
        this.cameraMoveInBattle = Utils.defaultValue(json.cmib, true);
    }

    /** 
     *  Get the statistic corresponding to the level.
     *  @static
     *  @returns {System.Statistic}
     */
    static getLevelStatistic(): System.Statistic {
        return this.statistics[this.idLevelStatistic];
    }

    /** 
     *  Get the statistic corresponding to the experience.
     *  @static
     *  @returns {System.Statistic}
     */
    static getExpStatistic(): System.Statistic {
        let stat = this.statistics[this.idExpStatistic];
        return (Utils.isUndefined(stat) || stat.isRes) ? null : stat;
    }

    /** 
     *  Get the element by ID.
     *  @param {number} id
     *  @returns {System.Element}
     */
    static getElement(id: number): System.Element {
        return Datas.Base.get(id, this.elements, "element");
    }

    /** 
     *  Get the statistic by ID.
     *  @param {number} id
     *  @returns {System.Statistic}
     */
    static getStatistic(id: number): System.Statistic {
        return Datas.Base.get(id, this.statistics, "statistic");
    }

    /** 
     *  Get the equipment by ID.
     *  @param {number} id
     *  @returns {System.Translatable}
     */
    static getEquipment(id: number): System.Translatable {
        return Datas.Base.get(id, this.equipments, "equipment");
    }

    /** 
     *  Get the weapon kind by ID.
     *  @param {number} id
     *  @returns {System.WeaponArmorKind}
     */
    static getWeaponKind(id: number): System.WeaponArmorKind {
        return Datas.Base.get(id, this.weaponsKind, "weapon kind");
    }

    /** 
     *  Get the armor kind by ID.
     *  @param {number} id
     *  @returns {System.WeaponArmorKind}
     */
    static getArmorKind(id: number): System.WeaponArmorKind {
        return Datas.Base.get(id, this.armorsKind, "armor kind");
    }

    /** 
     *  Get the battle command by ID.
     *  @param {number} id
     *  @returns {number}
     */
    static getBattleCommand(id: number): number {
        return Datas.Base.get(id, this.battleCommands, "battle command");
    }

    /** 
     *  Get the battle map by ID.
     *  @param {number} id
     *  @returns {System.BattleMap}
     */
    static getBattleMap(id: number): System.BattleMap {
        return Datas.Base.get(id, this.battleMaps, "battle map");
    }
}

export { BattleSystems }