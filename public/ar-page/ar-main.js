import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loadGLTF = (path) => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            resolve(gltf);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const start = async () => {
        // initialize MindAR 
        const mindarThree = new MindARThree({
            container: document.body,
            imageTargetSrc: './targets.mind',
        });
        const { renderer, scene, camera } = mindarThree;

        // set light
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // 3d objects:
        const bear = await loadGLTF("../assets/BearRigging.glb");
        bear.scene.position.set(0, -0.4, 0.2)

        // create target anchor
        const anchor = mindarThree.addAnchor(0);
        anchor.group.add(bear.scene)

        // animations
        const mixer = new THREE.AnimationMixer(bear.scene);
        const action = mixer.clipAction(bear.animations[0]);
        action.play();

        const clock = new THREE.Clock();

        // start AR
        await mindarThree.start(); // await must use in async func
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            bear.scene.rotation.set(0, bear.scene.rotation.y + delta, 0);

            mixer.update(delta);
            renderer.render(scene, camera);
        });
    }

    // have to wrap to a func and call because await
    start();
});
