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


// Function to capture photo
const takePhoto = () => {
    const canvas = document.querySelector('canvas');
    const image = canvas.toDataURL('image/jpg');

    const link = document.createElement('a');
    link.href = image;
    link.download = 'ar_photo.png';
    link.click();
    console.log("获取了截图");
};


// Function to capture video
function startRecording() {

}


// HTML Page
document.addEventListener('DOMContentLoaded', () => {

    // 动态创建拍照按钮
    const photoButton = document.createElement('button');
    photoButton.innerText = '拍照';
    photoButton.style.position = 'absolute';
    photoButton.style.bottom = '20px';
    photoButton.style.left = '20px';
    photoButton.style.padding = '10px 20px';
    photoButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    photoButton.style.color = 'white';
    photoButton.style.border = 'none';
    photoButton.style.borderRadius = '5px';
    photoButton.style.cursor = 'pointer';
    photoButton.style.zIndex = '10';
    photoButton.style.pointerEvents = 'auto';
    document.body.appendChild(photoButton);

    // 动态创建录像按钮
    const recordButton = document.createElement('button');
    recordButton.innerText = '录像';
    recordButton.style.position = 'absolute';
    recordButton.style.bottom = '20px';
    recordButton.style.right = '20px';
    recordButton.style.padding = '10px 20px';
    recordButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    recordButton.style.color = 'white';
    recordButton.style.border = 'none';
    recordButton.style.borderRadius = '5px';
    recordButton.style.cursor = 'pointer';
    recordButton.style.zIndex = '10';
    recordButton.style.pointerEvents = 'auto';
    document.body.appendChild(recordButton);

    // 绑定事件监听
    photoButton.addEventListener('click', takePhoto);
    recordButton.addEventListener('click', startRecording);


    // 启动 AR 功能
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

    // 调用 AR
    startAR();
});
