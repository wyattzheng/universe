import { Actor } from './actor-entity';
import { RecordSet } from '../utils/tools';
import { Entity, Private, Property, Index } from '@uni.js/database';
import { ActorType, AttachMapping } from '../types/actor';

@Entity()
export class Player extends Actor {
	@Private()
	@Property()
	type = ActorType.PLAYER;

	@Index()
	@Private()
	@Property()
	connId: string;

	@Property()
	sizeX = 1;

	@Property()
	sizeY = 1.5;

	@Property()
	boundings = [-0.5, -1.5, 0.5, 0];

	@Property()
	obstacle = true;

	@Property()
	anchorX = 0.5;

	@Property()
	anchorY = 1;

	@Property()
	playerName = 'Player';

	@Property()
	rightHandMapping: AttachMapping = [
		[-0.4, -0.5],
		[0.4, -0.5],
		[0, -0.5],
		[0, -0.4],
	];

	@Property()
	motionDecreaseRate = 0.75;

	@Property()
	canDamage = true;

	@Property()
	isPlayer = true;

	@Index()
	@Property()
	isUsing = false;

	@Property()
	useTick = 0;

	@Private()
	@Property()
	usedLands: RecordSet<string> = new RecordSet();

	@Private()
	@Property()
	spawnedActors: RecordSet<number> = new RecordSet();
}