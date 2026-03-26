import { createNoise2D } from 'simplex-noise';

export class TerrainGen {
    constructor() {
        this.elevationNoise = createNoise2D();
        this.moistureNoise = createNoise2D(); 
        
        this.scale = 0.015; 
        this.heightScale = 40; 
        this.waterLevel = 12;
    }

    getHeight(x, z) {
        let e = (this.elevationNoise(x * this.scale, z * this.scale) + 1) / 2; 
        e += 0.5 * (this.elevationNoise(x * this.scale * 2, z * this.scale * 2) + 1) / 2;
        e += 0.25 * (this.elevationNoise(x * this.scale * 4, z * this.scale * 4) + 1) / 2;
        e = e / 1.75; 

        e = Math.pow(e, 1.4);
        
        return Math.floor(e * this.heightScale);
    }

    getMoisture(x, z) {
        let m = (this.moistureNoise(x * this.scale * 0.5, z * this.scale * 0.5) + 1) / 2;
        return m;
    }

    getBlock(x, y, z) {
        const terrainHeight = this.getHeight(x, z);

        if (y > terrainHeight) {
            if (y <= this.waterLevel) {
                return { solid: true, color: 0x2288cc, type: 'water' };
            }
            return { solid: false };
        }

        const moisture = this.getMoisture(x, z);

        if (y === terrainHeight) {
            if (y <= this.waterLevel) {
                return { solid: true, color: 0xead5aa, type: 'sand' }; 
            } else if (y <= this.waterLevel + 2) {
                return { solid: true, color: 0xead5aa, type: 'sand' }; 
            } else if (y > this.heightScale * 0.7) {
                if (moisture > 0.5) return { solid: true, color: 0xffffff, type: 'snow' };
                else return { solid: true, color: 0x888888, type: 'stone' };
            } else {
                if (moisture < 0.3) {
                    return { solid: true, color: 0xd2b48c, type: 'desert' };
                } else if (moisture > 0.7) {
                    return { solid: true, color: 0x228b22, type: 'forest' };
                } else {
                    return { solid: true, color: 0x7cfc00, type: 'grass' };
                }
            }
        }

        if (terrainHeight - y < 3) {
            if (y <= this.waterLevel + 2) return { solid: true, color: 0xead5aa, type: 'sand' };
            if (moisture < 0.3) return { solid: true, color: 0xd2b48c, type: 'desert' };
            return { solid: true, color: 0x8b4513, type: 'dirt' }; 
        }

        return { solid: true, color: 0x555555, type: 'stone' }; 
    }
}