import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// GLOBAL
const landmarkColors = {
    thumb: 'red',
    index: 'blue',
    middle: 'yellow',
    ring: 'green',
    pinky: 'pink',
    wrist: 'white'
}
const gestureStrings = {
    'thumbs_up': '👍',
    'victory': '✌🏻'
}
async function createDetector() {
    return window.handPoseDetection.createDetector(
        window.handPoseDetection.SupportedModels.MediaPipeHands,
        {
            runtime: "mediapipe",
            modelType: "full",
            maxHands: 2,
            solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915`,
        }
    );
}

function drawPoint(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}


// Function to load a 3D model and return a Promise
const loadGLTF = (path) => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            resolve(gltf);
        });
    });
}


// Function to take a photo
const takePhoto = (mindarThree) => {
    const { video, renderer, scene, camera } = mindarThree;
    const rendererCanvas = renderer.domElement; // 获取 Three.js 的 Canvas

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
    renderer.preserveDrawingBuffer = true;
    renderer.render(scene, camera); // 手动渲染一帧
    offscreenContext.drawImage(rendererCanvas, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
    renderer.preserveDrawingBuffer = false;

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


// HTML Page
document.addEventListener('DOMContentLoaded', () => {
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
        bear.scene.position.set(0, -0.4, 0.2);

        // 创建 Target Anchor
        const bearAnchor = mindarThree.addAnchor(0); // MindAR里面的第一张图
        bearAnchor.group.add(bear.scene);

        // Target Callbacks
        bearAnchor.onTargetFound = () => {
            console.log("发现小能");
        }
        bearAnchor.onTargetLost = () => {
            console.log("失去小能");
        }

        // 添加模型动画
        const bearMixer = new THREE.AnimationMixer(bear.scene);
        const bearWalking = bearMixer.clipAction(bear.animations[0]);
        bearWalking.play();


        // Load handpose model
        // configure gesture estimator
        // add "✌🏻" and "👍" as sample gestures
        const knownGestures = [
            fp.Gestures.VictoryGesture,
            fp.Gestures.ThumbsUpGesture
        ]
        const GE = new fp.GestureEstimator(knownGestures)
        // load handpose model
        const detector = await createDetector();


        // 启动 MindAR 场景 and 渲染循环 Update
        const clock = new THREE.Clock();
        await mindarThree.start();
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            bear.scene.rotation.set(0, bear.scene.rotation.y + delta, 0);
            bearMixer.update(delta); // 动画更新

            renderer.render(scene, camera); // 渲染 AR 当前帧
        });

        // main estimation loop
        const video = mindarThree.video;
        const resultLayer = {
            left: document.querySelector("#pose-result-left"),
            right: document.querySelector("#pose-result-right"),
        }

        const estimateHands = async () => {
            resultLayer.left.innerText = '';
            resultLayer.right.innerText = '';

            // get hand landmarks from video
            const hands = await detector.estimateHands(video, {
                flipHorizontal: true
            })

            for (const hand of hands) {
                for (const keypoint of hand.keypoints) {
                    const name = keypoint.name.split('_')[0].toString().toLowerCase();
                    const color = landmarkColors[name];
                    // drawPoint(ctx, keypoint.x, keypoint.y, 3, color)
                }

                const est = GE.estimate(hand.keypoints3D, 9);
                if (est.gestures.length > 0) {
                    // find gesture with highest match score
                    let result = est.gestures.reduce((p, c) => {
                        return (p.score > c.score) ? p : c
                    });

                    if (result.name === 'thumbs_up') {
                        bearWalking.stop();
                    } else {
                        bearWalking.play();
                    }

                    const chosenHand = hand.handedness.toLowerCase();
                    resultLayer[chosenHand].innerText = gestureStrings[result.name];
                    console.log("左右？" + chosenHand + ", " + result.name);
                }
            }
            window.requestAnimationFrame(estimateHands);
        }
        window.requestAnimationFrame(estimateHands);


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
        photoButton.addEventListener('click', () => {
            takePhoto(mindarThree);
        });
    }

    // 最终启动 AR
    startAR();
});
