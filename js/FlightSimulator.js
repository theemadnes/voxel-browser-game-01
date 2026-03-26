import * as THREE from 'three';

export class FlightSimulator {
    constructor(scene, camera, terrainGen) {
        this.scene = scene;
        this.camera = camera;
        this.terrainGen = terrainGen;
        
        this.position = new THREE.Vector3(0, 60, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.quaternion = new THREE.Quaternion();
        
        this.throttle = 0; 
        this.speed = 0;
        this.maxSpeed = 80;
        
        this.airplane = new THREE.Group();
        this.buildModel();
        this.scene.add(this.airplane);
        
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            w: false,
            s: false,
            W: false,
            S: false
        };
        
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = true;
        });
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = false;
        });

        this.airplane.position.copy(this.position);
    }

    buildModel() {
        const mat = new THREE.MeshLambertMaterial({ color: 0xe63946 });
        const matDark = new THREE.MeshLambertMaterial({ color: 0x1d3557 });
        const matWhite = new THREE.MeshLambertMaterial({ color: 0xf1faee });
        
        const fuselageGeo = new THREE.BoxGeometry(1, 1, 4);
        const fuselage = new THREE.Mesh(fuselageGeo, mat);
        fuselage.castShadow = true;
        this.airplane.add(fuselage);
        
        const wingsGeo = new THREE.BoxGeometry(7, 0.15, 1.2);
        const wings = new THREE.Mesh(wingsGeo, matWhite);
        wings.position.set(0, 0, 0.5);
        wings.castShadow = true;
        this.airplane.add(wings);
        
        const tailGeo = new THREE.BoxGeometry(2.5, 0.15, 0.8);
        const tail = new THREE.Mesh(tailGeo, matWhite);
        tail.position.set(0, 0, -1.5);
        this.airplane.add(tail);
        
        const rudderGeo = new THREE.BoxGeometry(0.15, 1.2, 0.8);
        const rudder = new THREE.Mesh(rudderGeo, matDark);
        rudder.position.set(0, 0.6, -1.5);
        this.airplane.add(rudder);
        
        const cockpitGeo = new THREE.BoxGeometry(0.8, 0.5, 1);
        const cockpit = new THREE.Mesh(cockpitGeo, new THREE.MeshLambertMaterial({ color: 0x457b9d }));
        cockpit.position.set(0, 0.75, 0.8);
        this.airplane.add(cockpit);
    }

    update(dt) {
        if (this.keys.w || this.keys.W) {
            this.throttle += 0.5 * dt;
        } else if (this.keys.s || this.keys.S) {
            this.throttle -= 0.5 * dt;
        }
        this.throttle = Math.max(0, Math.min(1, this.throttle));

        const targetSpeed = this.throttle * this.maxSpeed;
        this.speed += (targetSpeed - this.speed) * 1.5 * dt; 
        
        const pitchSpeed = 1.8;
        const rollSpeed = 2.5;
        
        let pitchDelta = 0;
        let rollDelta = 0;
        
        if (this.keys.ArrowUp) pitchDelta -= pitchSpeed * dt;
        if (this.keys.ArrowDown) pitchDelta += pitchSpeed * dt;
        if (this.keys.ArrowLeft) rollDelta -= rollSpeed * dt;
        if (this.keys.ArrowRight) rollDelta += rollSpeed * dt;

        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchDelta);
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -rollDelta);
        
        this.quaternion.multiply(pitchQuat);
        this.quaternion.multiply(rollQuat);
        this.quaternion.normalize();
        
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.quaternion);
        
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);
        const bankFactor = right.y; 
        
        const yawSpeed = 1.2;
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bankFactor * yawSpeed * dt);
        this.quaternion.premultiply(yawQuat); 
        this.quaternion.normalize();
        
        const liftFactor = Math.min(this.speed / (this.maxSpeed * 0.4), 1.0); 
        const gravity = new THREE.Vector3(0, -9.8, 0);
        const lift = new THREE.Vector3(0, 9.8 * liftFactor, 0); 
        
        const forwardVelocity = forward.clone().multiplyScalar(this.speed);
        
        this.velocity.copy(forwardVelocity).add(gravity).add(lift).multiplyScalar(dt);
        this.position.add(this.velocity);
        
        const terrainH = this.terrainGen.getHeight(this.position.x, this.position.z);
        if (this.position.y < terrainH + 1) {
            this.position.y = terrainH + 1;
            this.speed *= 0.95; 
            
            // Reorient pitch to flat when crashed
            const flatQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(forward.x, forward.z));
            this.quaternion.slerp(flatQuat, 0.1);
        }

        this.airplane.position.copy(this.position);
        this.airplane.quaternion.copy(this.quaternion);
        
        this.updateCamera();

        document.getElementById('speed-display').innerText = Math.floor(this.speed * 10);
        document.getElementById('alt-display').innerText = Math.floor(this.position.y);
    }
    
    updateCamera() {
        const offset = new THREE.Vector3(0, 6, -18);
        offset.applyQuaternion(this.quaternion);
        const targetPos = this.position.clone().add(offset);
        
        this.camera.position.lerp(targetPos, 0.15);
        
        const lookAhead = new THREE.Vector3(0, 0, 10).applyQuaternion(this.quaternion);
        const lookAtPos = this.position.clone().add(lookAhead);
        
        const currentQuat = this.camera.quaternion.clone();
        this.camera.lookAt(lookAtPos);
        const targetQuat = this.camera.quaternion.clone();
        
        this.camera.quaternion.copy(currentQuat).slerp(targetQuat, 0.15);
    }
}