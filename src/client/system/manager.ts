import { HashedStore, HashItem } from '../../shared/store';
import { doTickable } from '../../shared/update';
import { GameEventEmitter, InternalEvent, ClassOf } from '../../event/spec';
import { IGameObject } from '../system/game-object';

export interface IGameManager extends doTickable, GameEventEmitter {}

export abstract class GameManager extends GameEventEmitter implements IGameManager {
	static canInjectCollection = true;

	async doTick(tick: number): Promise<void> {}
}

export interface GameObjectManagerOption {
	emitObjectEvents: ClassOf<InternalEvent>[];
}

/**
 * 用于管理某种游戏对象的管理器
 */
export class GameObjectManager<T extends IGameObject> extends GameManager {
	constructor(
		private objectStore: HashedStore<T>,
		private option: GameObjectManagerOption = {
			emitObjectEvents: [],
		},
	) {
		super();
	}

	addGameObject(gameObject: T) {
		this.objectStore.add(gameObject);

		for (const eventClazz of this.option.emitObjectEvents) {
			gameObject.onEvent(eventClazz, (event: InternalEvent) => {
				this.emitEvent(eventClazz, event);
			});
		}
	}

	removeGameObject(gameObject: T) {
		this.objectStore.remove(gameObject);
	}

	getObjectById(objectId: number): T {
		return this.getObjectByHash(objectId);
	}

	getObjectByHash(...hashItems: HashItem[]): T {
		return this.objectStore.get(...hashItems);
	}

	getAllObjects() {
		return this.objectStore.getAll();
	}

	async doTick(tick: number) {
		const objects = this.objectStore.getAll();
		for (const object of objects) {
			await object.doTick(tick);
		}
	}
}