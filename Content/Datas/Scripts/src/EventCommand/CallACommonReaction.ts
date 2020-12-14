import { Base } from "./Base";
import { System, Datas } from "..";
import { MapObject, ReactionInterpreter } from "../Core";
import { Enum } from "../Common";
import PrimitiveValueKind = Enum.PrimitiveValueKind;

/** @class
 *  An event command for calling a common reaction.
 *  @extends EventCommand.Base
 *  @property {number} commonReactionID The common reaction ID
 *  @property {SystemValue[]} parameters The reaction parameters according to ID
 *  @param {any[]} command Direct JSON command to parse
 */
class CallACommonReaction extends Base {

    public commonReactionID: number;
    public parameters: System.DynamicValue[];

    constructor(command: any[]) {
        super();

        let iterator = {
            i: 0
        };
        this.commonReactionID = command[iterator.i++];
        this.parameters = [];
        let l = command.length;
        let paramID: number;
        while (iterator.i < l) {
            paramID = command[iterator.i++];
            this.parameters[paramID] = System.DynamicValue.createValueCommand(
                command, iterator);
        }
    }

    /** 
     *  Initialize the current state.
     *  @returns {Record<string, any>}
     */
    initialize(): Record<string, any> {
        return {
            interpreter: null
        };
    }

    /** 
     *  Update and check if the event is finished.
     *  @param {Record<string, any>} currentState The current state of the event
     *  @param {MapObject} object The current object reacting
     *  @param {number} state The state ID
     *  @returns {number} The number of node to pass
     */
    update(currentState: Record<string, any>, object: MapObject, state: number): 
        number
    {
        if (!currentState.interpreter) {
            let reaction = Datas.CommonEvents.getCommonReaction(this
                .commonReactionID);

            // Correct parameters for default values
            let v: System.DynamicValue, parameter: System.DynamicValue, k: 
                PrimitiveValueKind;
            for (let id in reaction.parameters) {
                v = reaction.parameters[id].value;
                parameter = this.parameters[id];
                k = parameter ? parameter.kind : PrimitiveValueKind.None;
                if (k <= PrimitiveValueKind.Default) {
                    parameter = k === PrimitiveValueKind.Default ? v : System
                        .DynamicValue.create(k, null);
                }
                this.parameters[id] = parameter;
            }
            currentState.interpreter = new ReactionInterpreter(object, Datas
                .CommonEvents.getCommonReaction(this.commonReactionID), null, 
                null, this.parameters);
        }
        ReactionInterpreter.blockingHero = currentState.interpreter
            .currentReaction.blockingHero;
        currentState.interpreter.update();
        if (currentState.interpreter.isFinished()) {
            currentState.interpreter.updateFinish();
            return 1;
        }
        return 0;
    }

    /** 
     *  First key press handle for the current stack.
     *  @param {Record<string, any>} currentState The current state of the event
     *  @param {number} key The key ID pressed
     */
    onKeyPressed(currentState: Record<string, any>, key: number) {
        if (currentState.interpreter && currentState.interpreter.currentCommand) {
            currentState.interpreter.currentCommand.data.onKeyPressed(
                currentState.interpreter.currentCommandState, key);
        }
        super.onKeyPressed(currentState, key);
    }

    /** 
     *  First key release handle for the current stack.
     *  @param {Record<string, any>} currentState The current state of the event
     *  @param {number} key The key ID pressed
     */
    onKeyReleased(currentState: Record<string, any>, key: number) {
        if (currentState.interpreter && currentState.interpreter.currentCommand) {
            currentState.interpreter.currentCommand.data.onKeyReleased(
                currentState.interpreter.currentCommandState, key);
        }
        super.onKeyReleased(currentState, key);
    }

    /** 
     *  Key pressed repeat handle for the current stack.
     *  @param {Record<string, any>} currentState The current state of the event
     *  @param {number} key The key ID pressed
     *  @returns {boolean}
     */
    onKeyPressedRepeat(currentState: Record<string, any>, key: number): boolean {
        if (currentState.interpreter && currentState.interpreter.currentCommand) {
            return currentState.interpreter.currentCommand.data
                .onKeyPressedRepeat(currentState.interpreter.currentCommandState
                , key);
        }
        return super.onKeyPressedRepeat(currentState, key);
    }

    /** 
     *  Key pressed repeat handle for the current stack, but with
     *  a small wait after the first pressure (generally used for menus).
     *  @param {Record<string, any>} currentState The current state of the event
     *  @param {number} key The key ID pressed
     *  @returns {boolean}
     */
    onKeyPressedAndRepeat(currentState: Record<string, any>, key: number): 
        boolean
    {
        if (currentState.interpreter && currentState.interpreter.currentCommand) {
            currentState.interpreter.currentCommand.data.onKeyPressedAndRepeat(
                currentState.interpreter.currentCommandState, key);
        }
        return super.onKeyPressedAndRepeat(currentState, key);
    }

    /** 
     *  Draw the HUD.
     *  @param {Record<string, any>} currentState The current state of the event
     */
    drawHUD(currentState: Record<string, any>) {
        if (currentState.interpreter && currentState.interpreter.currentCommand) {
            currentState.interpreter.currentCommand.data.drawHUD(currentState
                .interpreter.currentCommandState);
        }
        super.drawHUD(currentState);
    }
}

export { CallACommonReaction }