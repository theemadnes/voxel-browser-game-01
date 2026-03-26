import { Chunk } from './Chunk.js';
import { TerrainGen } from './TerrainGen.js';

export class VoxelWorld {
    constructor(scene, chunkSize = 32, viewDistance = 4) {
        this.scene = scene;
        this.chunkSize = chunkSize;
        this.viewDistance = viewDistance;
        this.terrainGen = new TerrainGen();
        
        this.chunks = new Map();
    }

    getChunkId(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    update(playerX, playerZ) {
        const currentChunkX = Math.floor(playerX / this.chunkSize);
        const currentChunkZ = Math.floor(playerZ / this.chunkSize);

        const chunksInView = new Set();

        for (let x = -this.viewDistance; x <= this.viewDistance; x++) {
            for (let z = -this.viewDistance; z <= this.viewDistance; z++) {
                if (x*x + z*z > this.viewDistance * this.viewDistance) continue;

                const chunkX = currentChunkX + x;
                const chunkZ = currentChunkZ + z;
                const chunkId = this.getChunkId(chunkX, chunkZ);
                
                chunksInView.add(chunkId);

                if (!this.chunks.has(chunkId)) {
                    const chunk = new Chunk(this.scene, this.terrainGen, chunkX, chunkZ, this.chunkSize);
                    this.chunks.set(chunkId, chunk);
                }
            }
        }

        for (const [id, chunk] of this.chunks.entries()) {
            if (!chunksInView.has(id)) {
                chunk.dispose();
                this.chunks.delete(id);
            }
        }
    }
}