import { BILLION_VALUE, Vector2 } from '../../../server/shared/math';
import { TextureProvider } from '@uni.js/texture';
import { ActorType, Direction, RunningState } from '../../../server/module/actor-module/spec';
import { ActorConstructOption, ActorObject } from '../actor-module/actor-object';
import { AckData, EntityState, Input, PredictedInputManager } from '@uni.js/prediction';
import * as Events from '../../event/internal';

export interface ControlMoved {
	moved: Vector2;
	startAt: Vector2;
}

export class Player extends ActorObject {
	public isTakeControl = false;

	/**
	 * @readonly
	 */
	public playerName: string;

	private controlMoved: Vector2 | false = false;
	private predictedInputManager: PredictedInputManager;

	constructor(serverId: number, option: ActorConstructOption, textureProvider: TextureProvider) {
		super(serverId, option, new Vector2(option.sizeX, option.sizeY), ActorType.PLAYER, textureProvider);

		this.canWalk = true;
		this.showHealth = true;
		this.hasShadow = true;

		this.playerName = option.playerName;

		this.tagname = this.playerName;
		this.anchor = new Vector2(0.5, 1);
		this.sprite.animationSpeed = 0.12;

		this.walkTextures = this.textureProvider.get('actor.player');

		this.controlRunning(RunningState.SILENT);
		this.predictedInputManager = new PredictedInputManager({ ...this.vPos, motionX: option.motionX, motionY: option.motionY });
	}

	controlMove(delta: Vector2 | false) {
		if (delta === false) {
			this.controlMoved = false;
			return;
		}

		this.controlMoved = delta;
	}

	ackInput(ackData: AckData) {
		this.predictedInputManager.ackInput(ackData);
	}

	private doControlMoveTick(tick: number) {
		if (this.controlMoved) {
			const moved = this.controlMoved;

			this.predictedInputManager.pendInput({
				moveX: moved.x,
				moveY: moved.y,
			});

			this.controlRunning(RunningState.WALKING);
		}

		if (!this.controlMoved && this.isTakeControl) {
			this.controlRunning(RunningState.SILENT);
		}
	}

	setTakeControl() {
		this.isTakeControl = true;

		this.predictedInputManager.on('applyState', (state: EntityState) => {
			this.vPos = new Vector2(state.x, state.y);
		});

		this.predictedInputManager.on('applyInput', (input: Input) => {
			this.emitEvent(Events.ControlMovedEvent, { input: input, direction: this.direction, running: this.running });
		});
	}

	private doOrderTick() {
		this.zIndex = 2 + (this.y / BILLION_VALUE + 1) / 2;
	}

	doFixedUpdateTick(tick: number) {
		super.doFixedUpdateTick.call(this, tick);

		if (this.isTakeControl) {
			this.predictedInputManager.doGameTick();
		}

		this.doControlMoveTick(tick);
		this.doOrderTick();
	}
}
