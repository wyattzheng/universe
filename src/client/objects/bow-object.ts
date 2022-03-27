import { Vector2 } from '../../server/utils/math';
import { ActorConstructOption, ActorObject } from './actor-object';
import { TextureProvider } from '@uni.js/texture';
import { ActorType } from '../../server/types/actor';

export class Arrow extends ActorObject {
	private shootingDirection: number;

	constructor(serverId: number, option: ActorConstructOption, texture: TextureProvider) {
		super(serverId, option, new Vector2(option.sizeX, option.sizeY), ActorType.ARROW, texture);

		this.shootingDirection = option.rotation;
		this.anchor = new Vector2(0, 0.5);

		this.updateRotation();
	}

	private updateRotation() {
		this.sprite.rotation = this.shootingDirection;
	}
}

export class Bow extends ActorObject {
	private dragging = false;

	constructor(serverId: number, option: ActorConstructOption, textureProvider: TextureProvider) {
		super(serverId, option, new Vector2(option.sizeX, option.sizeY), ActorType.BOW, textureProvider);

		this.canWalk = false;
		this.hasShadow = false;

		this.sprite.animationSpeed = 0.1;
		this.sprite.loop = false;

		this.textures = this.textureProvider.getGroup('actor.bow');
	}

	startBeUsing() {
		this.dragging = true;
		this.playAnimate();
	}

	endBeUsing() {
		this.stopAnimate();
	}

	doFixedUpdateTick(tick: number) {
		super.doFixedUpdateTick.call(this, tick);
	}
}