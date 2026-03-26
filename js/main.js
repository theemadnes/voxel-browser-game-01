import * as THREE from 'three';
import { VoxelWorld } from './VoxelWorld.js';
import { FlightSimulator } from './FlightSimulator.js';

let scene, camera, renderer;
let voxelWorld, flightSimulator;
let lastTime = performance.now();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.007); 

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 50);
    dirLight.castShadow = true;
    
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    
    const d = 120;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    
    scene.add(dirLight);

    voxelWorld = new VoxelWorld(scene, 32, 3); 
    flightSimulator = new FlightSimulator(scene, camera, voxelWorld.terrainGen);

    dirLight.target = flightSimulator.airplane;

    window.addEventListener('resize', onWindowResize);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const dt = Math.min((time - lastTime) / 1000, 0.1); 
    lastTime = time;

    flightSimulator.update(dt);
    voxelWorld.update(flightSimulator.position.x, flightSimulator.position.z);

    const lightOffset = new THREE.Vector3(100, 200, 50);
    scene.children.forEach(child => {
        if (child instanceof THREE.DirectionalLight) {
            child.position.copy(flightSimulator.position).add(lightOffset);
        }
    });

    renderer.render(scene, camera);
}

init();