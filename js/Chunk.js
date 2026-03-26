import * as THREE from 'three';

export class Chunk {
    constructor(scene, terrainGen, chunkX, chunkZ, size) {
        this.scene = scene;
        this.terrainGen = terrainGen;
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.size = size;
        this.height = 64; 

        this.data = new Uint32Array(this.size * this.height * this.size);
        this.mesh = null;
        
        this.generateData();
        this.buildMesh();
        
        if (this.mesh) {
            this.scene.add(this.mesh);
        }
    }

    getIndex(x, y, z) {
        return x + z * this.size + y * this.size * this.size;
    }

    generateData() {
        const worldOffsetX = this.chunkX * this.size;
        const worldOffsetZ = this.chunkZ * this.size;

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                const worldX = worldOffsetX + x;
                const worldZ = worldOffsetZ + z;
                const terrainHeight = this.terrainGen.getHeight(worldX, worldZ);
                
                for (let y = 0; y < this.height; y++) {
                    const block = this.terrainGen.getBlock(worldX, y, worldZ);
                    if (block.solid) {
                        this.data[this.getIndex(x, y, z)] = block.color + 1;
                    } else {
                        this.data[this.getIndex(x, y, z)] = 0;
                    }
                }
            }
        }
    }

    getBlock(x, y, z) {
        if (y < 0 || y >= this.height) return 0;
        
        if (x < 0 || x >= this.size || z < 0 || z >= this.size) {
            return 0; 
        }

        return this.data[this.getIndex(x, y, z)];
    }

    buildMesh() {
        const positions = [];
        const normals = [];
        const colors = [];
        const indices = [];
        
        const colorObj = new THREE.Color();
        let indexCount = 0;

        for (let y = 0; y < this.height; y++) {
            for (let z = 0; z < this.size; z++) {
                for (let x = 0; x < this.size; x++) {
                    const block = this.getBlock(x, y, z);
                    if (block === 0) continue; 

                    const colorHex = block - 1;
                    colorObj.setHex(colorHex);
                    
                    const worldX = this.chunkX * this.size + x;
                    const worldY = y;
                    const worldZ = this.chunkZ * this.size + z;

                    if (this.getBlock(x + 1, y, z) === 0) {
                        this.addFace(positions, normals, colors, indices, worldX, worldY, worldZ, colorObj, 0, indexCount);
                        indexCount += 4;
                    }
                    if (this.getBlock(x - 1, y, z) === 0) {
                        this.addFace(positions, normals, colors, indices, worldX, worldY, worldZ, colorObj, 1, indexCount);
                        indexCount += 4;
                    }
                    if (this.getBlock(x, y + 1, z) === 0) {
                        this.addFace(positions, normals, colors, indices, worldX, worldY, worldZ, colorObj, 2, indexCount);
                        indexCount += 4;
                    }
                    if (this.getBlock(x, y - 1, z) === 0) {
                        this.addFace(positions, normals, colors, indices, worldX, worldY, worldZ, colorObj, 3, indexCount);
                        indexCount += 4;
                    }
                    if (this.getBlock(x, y, z + 1) === 0) {
                        this.addFace(positions, normals, colors, indices, worldX, worldY, worldZ, colorObj, 4, indexCount);
                        indexCount += 4;
                    }
                    if (this.getBlock(x, y, z - 1) === 0) {
                        this.addFace(positions, normals, colors, indices, worldX, worldY, worldZ, colorObj, 5, indexCount);
                        indexCount += 4;
                    }
                }
            }
        }

        if (positions.length === 0) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);

        const material = new THREE.MeshLambertMaterial({ 
            vertexColors: true
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }

    addFace(positions, normals, colors, indices, x, y, z, colorObj, dir, indexStart) {
        const p = [
            [x, y, z], [x + 1, y, z], [x + 1, y + 1, z], [x, y + 1, z],
            [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]
        ];

        let facePositions = [];
        let normal = [];

        switch (dir) {
            case 0: facePositions = [p[1], p[5], p[6], p[2]]; normal = [1, 0, 0]; break;
            case 1: facePositions = [p[4], p[0], p[3], p[7]]; normal = [-1, 0, 0]; break;
            case 2: facePositions = [p[3], p[2], p[6], p[7]]; normal = [0, 1, 0]; break;
            case 3: facePositions = [p[4], p[5], p[1], p[0]]; normal = [0, -1, 0]; break;
            case 4: facePositions = [p[5], p[4], p[7], p[6]]; normal = [0, 0, 1]; break;
            case 5: facePositions = [p[0], p[1], p[2], p[3]]; normal = [0, 0, -1]; break;
        }

        for (let i = 0; i < 4; i++) {
            positions.push(facePositions[i][0], facePositions[i][1], facePositions[i][2]);
            normals.push(normal[0], normal[1], normal[2]);
            colors.push(colorObj.r, colorObj.g, colorObj.b);
        }

        indices.push(indexStart, indexStart + 1, indexStart + 2);
        indices.push(indexStart, indexStart + 2, indexStart + 3);
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}