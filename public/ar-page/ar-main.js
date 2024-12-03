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
    // Function to 启动 AR 功能
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

        // 启动 mindAR target
        await mindarThree.start();

        // 渲染循环
        const clock = new THREE.Clock();
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            // 旋转小能
            bear.scene.rotation.set(0, bear.scene.rotation.y + delta, 0);
            // 走路小能
            mixer.update(delta);

            // 渲染 AR 模型
            renderer.render(scene, camera);
        });

        // 拍照功能
        const takePhoto = () => {
            const rendererCanvas = renderer.domElement; // 获取 Three.js 的 Canvas
            renderer.render(scene, camera); // 手动渲染一帧

            const video = mindarThree.video; // 获取视频流

            // 创建离屏 Canvas
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = rendererCanvas.width;
            offscreenCanvas.height = rendererCanvas.height;
            const offscreenContext = offscreenCanvas.getContext('2d');

            // 绘制视频背景
            offscreenContext.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

            // 绘制 AR 模型
            offscreenContext.drawImage(rendererCanvas, 0, 0);

            // 导出图片
            // const image = offscreenCanvas.toDataURL('image/png');
            // const link = document.createElement('a');
            // link.href = image;
            // link.download = 'ar_photo.png';
            // link.click();

            // 将图片显示在页面上
            const imageDataUrl = offscreenCanvas.toDataURL('image/png');
            const imgElement = document.createElement('img');
            imgElement.src = imageDataUrl;
            imgElement.style = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                max-width: 80%;
                max-height: 80%;
                object-fit: contain; /* 保持图片宽高比 */
                border: 2px solid white;
                z-index: 20;
            `;

            // 创建遮罩层
            const overlay = document.createElement('div');
            overlay.style = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                z-index: 15;
            `;

            // 点击遮罩关闭图片
            overlay.addEventListener('click', () => {
                overlay.remove();
                imgElement.remove();
            });

            document.body.appendChild(overlay);
            document.body.appendChild(imgElement);
        };

        // 创建拍照按钮并绑定事件
        const photoButton = document.createElement('button');
        photoButton.innerText = '拍照';
        photoButton.style = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            padding: 10px 20px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10;
            `;
        document.body.appendChild(photoButton);
        photoButton.addEventListener('click', takePhoto);
    }

    // 启动 AR
    startAR();
});
