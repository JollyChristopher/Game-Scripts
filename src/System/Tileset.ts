/*
    RPG Paper Maker Copyright (C) 2017-2023 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { ArrayUtils, Enum, Utils } from "../Common";
import PictureKind = Enum.PictureKind;
import { Base } from "./Base";
import { CollisionSquare, TextureBundle, Game } from "../Core";
import { System, Datas } from "../index";

/** @class
 *  A tileset of the game.
 *  @extends System.Base
 *  @param {Record<string, any>} - json Json object describing the tileset
 */
class Tileset extends Base {

    public collisions: CollisionSquare[];
    public id: number;
    public battleMap: System.DynamicValue;
    public picture: System.Picture;
    public autotiles: number[];
    public walls: number[];
    public mountains: number[];
    public objects: number[];

    constructor(json?: Record<string, any>) {
        super(json);
    }

    /** 
     *  Assign the default members.
     */
    public setup() {
        this.collisions = null;
    }

    /** 
     *  Read the JSON associated to the tileset.
     *  @param {Record<string, any>} - json Json object describing the tileset
     */
    read(json: Record<string, any>) {
        this.id = json.id;
        this.picture = Datas.Pictures.get(PictureKind.Tilesets, json.pic);
        this.battleMap = System.DynamicValue.readOrDefaultDatabase(json.bm, 1);

        // Special elements
        let jsonSpecials = json.auto;
        let l = jsonSpecials.length;
        this.autotiles = [];
        let i: number, j: number, id: number;
        for (i = 0; i < l; i++) {
            id = jsonSpecials[i].id
            for (j = 0; j < i; j++) {
                if (id <= this.autotiles[j]) {
                    break;
                }
            }
            ArrayUtils.insert(this.autotiles, j, id);
        }
        jsonSpecials = json.walls;
        l = jsonSpecials.length;
        this.walls = new Array(l);
        for (i = 0; i < l; i++) {
            this.walls[i] = jsonSpecials[i].id;
        }
        jsonSpecials = json.moun;
        l = jsonSpecials.length;
        this.mountains = [];
        for (i = 0; i < l; i++) {
            id = jsonSpecials[i].id
            for (j = 0; j < i; j++) {
                if (id <= this.mountains[j]) {
                    break;
                }
            }
            ArrayUtils.insert(this.mountains, j, id);
        }

        jsonSpecials = json.objs;
        l = jsonSpecials.length;
        this.objects = new Array(l);
        for (i = 0; i < l; i++) {
            this.objects[i] = jsonSpecials[i].id;
        }
    }

    /** 
     *  Get the path to the picture tileset.
     *  @returns {string}
     */
    getPath(): string {
        let newID = Game.current.textures.tilesets[this.id];
        let picture = Utils.isUndefined(newID) ? this.picture : Datas.Pictures
            .get(Enum.PictureKind.Tilesets, newID);
        return picture ? picture.getPath() : null;
    }

    /** 
     *  Get the textures for autotiles.
     *  @returns {Promise<TextureBundle[]>}
     */
    async getTexturesAutotiles(): Promise<TextureBundle[][]> {
        let list: TextureBundle[][] = new Array;
        for (let id of this.autotiles) {
            list[id] = await Datas.SpecialElements.loadAutotileTexture(id);
        }
        return list;
    }

    /** 
     *  Get the textures for walls.
     *  @returns {Promise<THREE.MeshPhongMaterial[]>}
     */
    async getTexturesWalls(): Promise<THREE.MeshPhongMaterial[]> {
        let list: THREE.MeshPhongMaterial[] = [];
        for (let id of this.walls) {
            list[id] = await Datas.SpecialElements.loadWallTexture(id);
        }
        return list;
    }

    /** 
     *  Get the textures for 3D objects.
     *  @returns {Promise<THREE.MeshPhongMaterial[]>}
     */
    async getTexturesObjects3D(): Promise<THREE.MeshPhongMaterial[]> {
        let list: THREE.MeshPhongMaterial[] = [];
        for (let id of this.objects) {
            list[Datas.SpecialElements.getObject3D(id).pictureID] = await Datas
                .SpecialElements.loadObject3DTexture(id);
        }
        return list;
    }

    /** 
     *  Get the textures for mountains.
     *  @returns {Promise<TextureBundle[]>}
     */
    async getTexturesMountains(): Promise<TextureBundle[]> {
        let list: TextureBundle[] = [];
        for (let id of this.mountains) {
            list.push(await Datas.SpecialElements.loadMountainTexture(id));
        }
        return list;
    }
}

export { Tileset }