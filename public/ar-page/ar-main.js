import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// Function to load 3D model and return Promise
const loadGLTF = (path) => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            resolve(gltf);
        });
    });
}


// HTML Page
document.addEventListener('DOMContentLoaded', () => {
    const startAR = async () => {
        // 初始化 MindAR 
        const mindarThree = new MindARThree({
            container: document.body,
            imageTargetSrc: './targets.mind',
        });
        const { renderer, scene, camera } = mindarThree;

        // 添加环境光
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // 加载3D模型
        const bear = await loadGLTF("../assets/BearRigging.glb");
        bear.scene.position.set(0, -0.4, 0.2)

        // 创建 target anchor
        const anchor = mindarThree.addAnchor(0);
        anchor.group.add(bear.scene)

        // 添加动画
        const mixer = new THREE.AnimationMixer(bear.scene);
        const action = mixer.clipAction(bear.animations[0]);
        action.play();

        const clock = new THREE.Clock();

        // start AR
        await mindarThree.start();
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            // 旋转小能
            bear.scene.rotation.set(0, bear.scene.rotation.y + delta, 0);

            // 走路小能
            mixer.update(delta);

            // 渲染一帧
            renderer.render(scene, camera);
        });
    }

    // Call AR
    startAR();
});
