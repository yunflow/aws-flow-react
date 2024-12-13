import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// GLOBAL 手势
let isCubeAdded = false;

const gestureStrings = {
    'thumbs_up': '👍',
    'victory': '✌🏻',
    'middle_up': '🖕',
}


// Function to create gesture detector
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


// Function to load a 3D model and return a Promise
const loadGLTF = (path) => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            resolve(gltf);
        });
    });
}
const loadAudio = (path) => {
    return new Promise((resolve, reject) => {
        const loader = new THREE.AudioLoader();
        loader.load(path, (buffer) => {
            resolve(buffer);
        });
    });
}


// Function to load a picture plane, default invisible
function loadPicturePlane(path) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const texture = new THREE.TextureLoader().load(path);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

    const plane = new THREE.Mesh(geometry, material);
    plane.visible = false;
    return plane;
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


// HTML Page Test
const leftDiv = document.createElement('div');
const rightDiv = document.createElement('div');
leftDiv.id = 'pose-result-left';
rightDiv.id = 'pose-result-right';
leftDiv.style = `
        position: absolute;
        top: 0;
        left: 0;
        font-size: 150px;
        text-align: left;
        `;
rightDiv.style = `
        position: absolute;
        top: 0;
        right: 0;
        font-size: 150px;
        text-align: right;
        `;
document.body.appendChild(leftDiv);
document.body.appendChild(rightDiv);


// HTML Page add AR
document.addEventListener('DOMContentLoaded', () => {
    const startAR = async () => {
        // 请求 2K 分辨率的视频流
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
            imageTargetSrc: '../assets/targets.mind',
        });
        const { renderer, scene, camera } = mindarThree;

        // 添加场景环境光
        const direLight = new THREE.DirectionalLight(0xffffff, 2);
        direLight.position.set(5, 5, 5);
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);
        scene.add(direLight);

        // 添加 Listener 和 Audio
        const listener = new THREE.AudioListener();
        camera.add(listener);
        const sound = new THREE.Audio(listener);
        const audio = await loadAudio('../assets/littleTown.mp3'); // 苹果不支持ogg
        sound.setBuffer(audio);

        // 加载场景模型
        const bear = await loadGLTF("../assets/BearRigging2.glb");
        bear.scene.position.set(0, -0.4, 0.2);

        const chris = await loadGLTF("../assets/ChristmasAR.glb");
        bear.scene.position.set(0, -0.4, 0.2);

        const imagePlane = loadPicturePlane('../assets/ninjixiang.png');
        imagePlane.scale.set(4, 4, 4);
        imagePlane.position.set(0, 0, -18);
        imagePlane.rotation.x = 0.3;
        scene.add(imagePlane);

        // 旋转方块
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const texture = new THREE.TextureLoader().load('../assets/ninjixiang.png');
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const cube = new THREE.Mesh(geometry, material);
        const other3D = await loadGLTF("../assets/gift.glb");

        // 添加模型动画
        const bearMixer = new THREE.AnimationMixer(bear.scene);
        const bearJump = bearMixer.clipAction(bear.animations[0]);
        const bearWalk = bearMixer.clipAction(bear.animations[1]);
        bearJump.loop = THREE.LoopOnce;

        // 创建 Target Anchor
        const arAnchor = mindarThree.addAnchor(0); // MindAR里面的第一张图
        // arAnchor.group.add(bear.scene);
        // arAnchor.group.add(imagePlane);

        // Anchor Callbacks
        arAnchor.onTargetFound = () => {
            console.log("发现Target");

            if (isCubeAdded) return;
            isCubeAdded = true;

            scene.add(other3D.scene);
            other3D.scene.scale.set(1, 1, 1);
            other3D.scene.position.set(0, -2, -20);
            other3D.scene.rotation.x = 0.3;
            other3D.scene.userData.clickable = true

            // scene.add(cube);
            // cube.scale.set(4, 4, 4);
            // cube.position.set(0, 0, -20);
            // cube.rotation.x = 0.3;
            // cube.userData.clickable = true

            const asisn = document.getElementsByClassName('mindar-ui-overlay mindar-ui-scanning');
            document.body.removeChild(asisn[0]);
        }
        arAnchor.onTargetLost = () => {
            console.log("失去Target");
        }

        document.body.addEventListener('click', (e) => {
            // normalize to -1 to 1
            const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            const mouse = new THREE.Vector2(mouseX, mouseY);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                let o = intersects[0].object;
                while (o.parent && !o.userData.clickable) {
                    o = o.parent;
                }
                if (o.userData.clickable) {
                    console.log(o);
                    if (o === other3D.scene) {
                        sound.play();
                        scene.remove(other3D.scene);
                        // scene.add(bear.scene);
                        // bear.scene.scale.set(5, 5, 5);
                        // bear.scene.position.set(0, -2, -20);
                        // bear.scene.rotation.x = 0.5;
                        // bear.scene.rotation.y = -0.2;
                        // bear.scene.userData.clickable = true;

                        scene.add(chris.scene);
                        chris.scene.scale.set(1.2, 1.2, 1.2);
                        chris.scene.position.set(2, -2, -20);
                        chris.scene.userData.clickable = true;
                    }
                }
            }
        });

        // 加载 GE 配置手势形状
        const middleUpGesture = new fp.GestureDescription('middle_up');
        middleUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
        middleUpGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
        middleUpGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpLeft, 1.0);
        middleUpGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpRight, 1.0);
        middleUpGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.HorizontalLeft, 1.0);
        middleUpGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.HorizontalRight, 1.0);
        for (let finger of [fp.Finger.Index, fp.Finger.Ring, fp.Finger.Pinky]) {
            middleUpGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
            middleUpGesture.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
        }

        const GE = new fp.GestureEstimator([
            fp.Gestures.VictoryGesture, // ✌🏻
            fp.Gestures.ThumbsUpGesture, // 👍
            middleUpGesture, // 🖕
        ]);
        const detector = await createDetector();

        // 启动 MindAR 场景 并且 渲染循环 Update
        const clock = new THREE.Clock();
        await mindarThree.start();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            other3D.scene.rotation.y = other3D.scene.rotation.y + delta;
            bear.scene.rotation.y = bear.scene.rotation.y + delta;

            bearMixer.update(delta); // 动画更新
            renderer.render(scene, camera); // 渲染 AR 当前帧
        });

        // 小能动画控制
        let activeAction = bearWalk;
        activeAction.play();
        const fadeToAction = (action, duration) => {
            if (activeAction === action) return;
            activeAction = action;
            activeAction.reset().fadeIn(duration).play();
        }
        bearMixer.addEventListener('finished', () => {
            fadeToAction(bearWalk, 0.1);
        });

        // 手势检测循环
        const video = mindarThree.video;
        const testLayer = {
            left: document.querySelector("#pose-result-left"),
            right: document.querySelector("#pose-result-right"),
        }
        const estimateHands = async () => {
            // 每次清空测试层
            testLayer.left.innerText = '';
            testLayer.right.innerText = '';

            // 从 video 中得到检测的手
            const hands = await detector.estimateHands(video, {
                flipHorizontal: true
            });
            for (const hand of hands) {
                // console.log(hand)
                const est = GE.estimate(hand.keypoints3D, 8.5);
                if (est.gestures.length > 0) {
                    // find gesture with highest match score
                    let result = est.gestures.reduce((p, c) => {
                        return (p.score > c.score) ? p : c
                    });

                    console.log(result.name);

                    if (result.name === 'thumbs_up') {
                        fadeToAction(bearWalk, 0.1);
                        imagePlane.visible = false;
                    } else if (result.name === 'victory') {
                        fadeToAction(bearJump, 0.1);
                        imagePlane.visible = false;;
                    } else if (result.name === 'middle_up') {
                        imagePlane.visible = true;
                    }

                    const chosenHand = hand.handedness.toLowerCase();
                    // testLayer[chosenHand].innerText = gestureStrings[result.name];
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
