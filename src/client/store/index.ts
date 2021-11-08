import { ObjectStore } from '../../framework/client-side/object-store';
import { LandObject } from '../module/land-module/land-object';
import { injectable } from 'inversify';

import { ActorObject } from '../module/actor-module/actor-object';

@injectable()
export class ActorStore extends ObjectStore<ActorObject> {
	hash(item: ActorObject) {
		return [item.getServerId()];
	}
}

@injectable()
export class LandStore extends ObjectStore<LandObject> {
	hash(item: LandObject) {
		return [[item.getServerId()], [item.x, item.y]];
	}
}
