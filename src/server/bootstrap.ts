import 'reflect-metadata';
import 'threads/register';

import { ConnectionController } from './controller/connection-controller';
import { ActorFactory } from './module/actor-module/spec';
import { ActorMapper } from './module/actor-module/mapper';
import { ServerApp } from '../framework/server-app';
import { createPersistDatabase, PersistDatabaseSymbol } from './database';

import { ServerSideModule } from '../framework/module';
import { LandModule } from './module/land-module';
import { ActorModule } from './module/actor-module';
import { PlayerModule } from './module/player-module';
import { BowModule } from './module/bow-module';
import { InventoryModule } from './module/inventory-module';
import { PickDropModule } from './module/pick-drop-module';

import DotEnv from 'dotenv';

DotEnv.config();

if (process.env.DEBUG) {
	console.warn('调试模式已启动');
}

process.on('uncaughtException', (err) => {
	console.error('uncaughtException', err);
});
process.on('unhandledRejection', (err) => {
	console.error('unhandledRejection', err);
});

function bootstrap() {
	const dbLocation = process.env.DB_LOCATION;
	if (Boolean(dbLocation) === false) throw new Error(`please provide env: DB_LOCATION`);

	const pdb = createPersistDatabase(dbLocation);

	const actorFactory = new ActorFactory();
	actorFactory.addImpls(ActorMapper);

	const appModule: ServerSideModule = {
		imports: [LandModule, ActorModule, PlayerModule, BowModule, InventoryModule, PickDropModule],
		entities: [],
		managers: [],
		controllers: [ConnectionController],
		providers: [
			{ key: ActorFactory, value: actorFactory },
			{ key: PersistDatabaseSymbol, value: pdb },
		],
	};

	const app = new ServerApp({
		port: 6100,
		module: appModule,
	});

	app.start();
}

bootstrap();
