import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// HTML Page
document.addEventListener('DOMContentLoaded', () => {


    // Function to load 3D Model and return Promise
    const loadGLTF = (path) => {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(path, (gltf) => {
                resolve(gltf);
            });
        });
    }


    // Function to Start AR
    const startAR = async () => {
        // 请求2K分辨率的视频流
        const constraints = {
            video: {
                width: { ideal: 2160 },
                height: { ideal: 1440 },
            },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // 初始化 MindAR 场景
        const mindarThree = new MindARThree({
            container: document.body,
            videoStream: stream,
            imageTargetSrc: './targets.mind',
        });
        const { renderer, scene, camera } = mindarThree;

        // 添加场景环境光
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // 加载场景3D模型
        const bear = await loadGLTF("../assets/BearRigging.glb");
        bear.scene.position.set(0, -0.4, 0.2)

        // 创建 Target Anchor
        const anchor = mindarThree.addAnchor(0);
        anchor.group.add(bear.scene)

        // 添加模型动画
        const mixer = new THREE.AnimationMixer(bear.scene);
        const action = mixer.clipAction(bear.animations[0]);
        action.play();

        // 启动 MindAR 场景
        await mindarThree.start();

        // 渲染循环 Update
        const clock = new THREE.Clock();
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            // 旋转小能 + 走路小能
            bear.scene.rotation.set(0, bear.scene.rotation.y + delta, 0);
            mixer.update(delta);

            // 渲染 AR 模型
            renderer.render(scene, camera);
        });


        // Function to Take a Photo
        const takePhoto = () => {
            const rendererCanvas = renderer.domElement; // 获取 Three.js 的 Canvas
            const video = mindarThree.video; // 获取视频流
            renderer.render(scene, camera); // 手动渲染一帧

            // 创建离屏 Canvas 用于合并video和AR
            const offscreenCanvas = document.createElement('canvas');
            const offscreenContext = offscreenCanvas.getContext('2d');

            // 获取设备和视频的宽高比
            const deviceAspectRatio = window.innerWidth / window.innerHeight;
            const videoAspectRatio = video.videoWidth / video.videoHeight;

            // 初始化裁剪区域
            let sourceX = 0, sourceY = 0,
                sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;

            // 如果视频比设备宽，则裁剪视频的左右两侧
            if (videoAspectRatio > deviceAspectRatio) {
                sourceWidth = video.videoHeight * deviceAspectRatio;
                sourceX = (video.videoWidth - sourceWidth) / 2;
            } else { // 如果视频比设备高，则裁剪视频的上下两侧
                sourceHeight = video.videoWidth / deviceAspectRatio;
                sourceY = (video.videoHeight - sourceHeight) / 2;
            }

            // 设置离屏 Canvas 尺寸为设备分辨率
            offscreenCanvas.width = window.innerWidth * window.devicePixelRatio;
            offscreenCanvas.height = window.innerHeight * window.devicePixelRatio;

            // 绘制裁剪后的视频到离屏 Canvas
            offscreenContext.drawImage(video,
                sourceX, sourceY, sourceWidth, sourceHeight, // 视频裁剪区域
                0, 0, offscreenCanvas.width, offscreenCanvas.height // Canvas 绘制区域
            );

            // 绘制 AR 模型到离屏 Canvas
            offscreenContext.drawImage(rendererCanvas,
                0, 0, offscreenCanvas.width, offscreenCanvas.height
            );

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
            document.body.appendChild(imgElement);

            // 创建遮罩层并添加事件
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
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => {
                overlay.remove();
                imgElement.remove();
            });
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


    // 最终启动 AR
    startAR();
});
