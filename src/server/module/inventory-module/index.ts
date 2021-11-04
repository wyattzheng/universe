import { createServerSideModule } from '../../../framework/module';
import { InventoryEntities } from './inventory';
import { InventoryController } from './inventory-controller';
import { InventoryManager } from './inventory-manager';
import { ItemDef } from './item';

export const InventoryModule = createServerSideModule({
	controllers: [InventoryController],
	managers: [InventoryManager],
	entities: [...InventoryEntities, ItemDef],
});