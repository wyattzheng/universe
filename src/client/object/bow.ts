import { Vector2 } from '../../server/shared/math';
import { ActorType } from '../../shared/actor';
import { ActorCtorOption, ActorObject } from '../shared/actor';
import { TextureProvider } from '../texture';

export class Bow extends ActorObject {
	private dragging = false;

	constructor(serverId: number, option: ActorCtorOption, texture: TextureProvider) {
		super(serverId, option, new Vector2(0.5, 0.5), ActorType.BOW, texture, 3);

		this.setTextures(this.usedTextures);
		this.setAnimateSpeed(0.02);

		this.startDrag();
	}

	startDrag() {
		this.dragging = true;
		this.playAnim();
	}
}