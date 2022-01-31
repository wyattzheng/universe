import { BrickType, LandData, LAND_WIDTH } from './spec';
import { Vector2 } from '../../shared/math';
import { BiomePicker, BiomeType } from './biome';
import { expose } from 'threads/worker';

expose({
	GenerateLandData(landX: number, landY: number, seed = 'seed'): LandData {
		const landLoc = new Vector2(landX, landY);
		const startAt = landLoc.mul(LAND_WIDTH);
		const picker = new BiomePicker(seed);

		const landData: LandData = {
			bricks: [],
		};
		for (let x = 0; x < LAND_WIDTH; x++)
			for (let y = 0; y < LAND_WIDTH; y++) {
				const biomeType = picker.getBiomeType(startAt.x + x, startAt.y + y);

				let brickType = BrickType.DIRT;

				if (biomeType == BiomeType.COLD) {
					brickType = BrickType.ICE;
				} else if (biomeType == BiomeType.DESERT) {
					brickType = BrickType.SAND;
				} else if (biomeType == BiomeType.DRY) {
					brickType = BrickType.DRY_DIRT;
				} else if (biomeType == BiomeType.FOREST) {
					brickType = BrickType.DIRT;
				} else if (biomeType == BiomeType.ICELAND) {
					brickType = BrickType.ICE;
				} else if (biomeType == BiomeType.LAKE) {
					brickType = BrickType.WATER;
				} else if (biomeType == BiomeType.MOUNTAIN) {
					brickType = BrickType.ROCK;
				} else if (biomeType == BiomeType.PLAIN) {
					brickType = BrickType.GRASS;
				} else if (biomeType == BiomeType.RAINFOREST) {
					brickType = BrickType.DIRT;
				}
				landData.bricks.push({
					offX: x,
					offY: y,
					type: brickType,
				});
			}

		return landData;
	},
});