import { RecordMap, RecordSet } from './tools';
export const MOVEMENT_TICK_MIN_DISTANCE = 0.0001;
export const CTOR_OPTION_PROPERTY_SYMBOL = Symbol('ctor-option');

/**
 * mark a entity property as a constructor option
 * when server request client to construct the entity,
 * it will be provided these properties.
 */
export function ConstructOption() {
	return Reflect.metadata(CTOR_OPTION_PROPERTY_SYMBOL, true);
}

/**
 * get all properties mark as constructor option
 */
export function GetConstructOptions(target: any) {
	const options: any = {};
	for (const propertyName of Object.getOwnPropertyNames(target)) {
		const targetProperty = target[propertyName];
		if (true) {
			//stub here
			if (targetProperty instanceof RecordMap || targetProperty instanceof RecordSet) {
				options[propertyName] = targetProperty.getAll();
			} else {
				options[propertyName] = targetProperty;
			}
		}
	}
	return options;
}