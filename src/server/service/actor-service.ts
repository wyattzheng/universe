import { ActorNewPosEvent, ActorRemoveAttachment, ActorSetAttachment, ActorSetWalkEvent, ActorToggleUsing } from '../../event/server-side';
import { EventBus } from '../../event/bus-server';
import { ActorManager } from '../manager/actor-manager';
import { PlayerManager } from '../manager/player-manager';
import { Service } from '../shared/service';
import { LandManager } from '../manager/land-manager';
import { inject, injectable } from 'inversify';
import { GameEvent } from '../event';
import { ActorToggleUsingEvent } from '../../event/client-side';

@injectable()
export class ActorService implements Service {
	constructor(
		@inject(EventBus) private eventBus: EventBus,

		@inject(ActorManager) private actorManager: ActorManager,
		@inject(PlayerManager) private playerManager: PlayerManager,
		@inject(LandManager) private landManager: LandManager,
	) {
		this.eventBus.on(ActorToggleUsingEvent.name, this.handleActorToggleUsingEvent.bind(this));

		this.actorManager.on(GameEvent.NewPosEvent, this.onNewPosEvent.bind(this));
		this.actorManager.on(GameEvent.AddEntityEvent, this.onActorAdded.bind(this));
		this.actorManager.on(GameEvent.RemoveEntityEvent, this.onActorRemoved.bind(this));
		this.actorManager.on(GameEvent.NewWalkStateEvent, this.onWalkStateSet.bind(this));

		this.actorManager.on(GameEvent.ActorSetAttachment, this.onActorSetAttachment.bind(this));
		this.actorManager.on(GameEvent.ActorRemoveAttachment, this.onActorRemoveAttachment.bind(this));

		this.actorManager.on(GameEvent.ActorToggleUsingEvent, this.onActorToggleUsing.bind(this));
	}

	private onActorToggleUsing(actorId: number, startOrEnd: boolean) {
		const event = new ActorToggleUsing(actorId, startOrEnd);
		this.emitToActorSpawned(actorId, event);
	}

	private handleActorToggleUsingEvent(connId: string, event: ActorToggleUsingEvent) {
		if (event.startOrEnd) {
			this.actorManager.startUsing(event.actorId);
		} else {
			this.actorManager.endUsing(event.actorId);
		}
	}

	private onActorSetAttachment(targetActorId: number, key: string, actorId: number) {
		this.emitToActorSpawned(targetActorId, new ActorSetAttachment(targetActorId, key, actorId));
	}

	private onActorRemoveAttachment(targetActorId: number, key: string) {
		this.emitToActorSpawned(targetActorId, new ActorRemoveAttachment(targetActorId, key));
	}

	private onActorAdded(actorId: number) {
		for (const player of this.playerManager.getAllEntities()) {
			this.playerManager.spawnActor(player, actorId);
		}
	}
	private onActorRemoved(actorId: number) {
		for (const player of this.playerManager.getAllEntities()) {
			this.playerManager.despawnActor(player, actorId);
		}
	}
	private onWalkStateSet(actorId: number) {
		const actor = this.actorManager.getEntityById(actorId);

		const event = new ActorSetWalkEvent(actorId, actor.direction, actor.running);
		this.emitToActorSpawned(actorId, event);
	}
	private onNewPosEvent(actorId: number) {
		const actor = this.actorManager.getEntityById(actorId);

		const event = new ActorNewPosEvent(actorId, actor.posX, actor.posY);

		this.emitToActorSpawned(actorId, event);
	}
	private emitToActorSpawned(actorId: number, event: any) {
		const sids = this.playerManager
			.getAllEntities()
			.filter((player) => this.playerManager.hasAtRecord(player, 'spawnedActors', actorId))
			.map((player) => player.connId);

		this.eventBus.emitTo(sids, event);
	}
	doTick(tick: number) {}
}
