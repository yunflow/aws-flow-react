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

        // 调整相机的视锥范围
        camera.near = 0.1;
        camera.far = 50;
        camera.updateProjectionMatrix();

        // 添加场景环境光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // 添加 Listener 和 Audio
        const listener = new THREE.AudioListener();
        camera.add(listener);

        const audioPlayer1 = new THREE.Audio(listener);
        const musicAudio = await loadAudio('../assets/littleTown.mp3'); // 苹果不支持ogg
        const clickAudio = await loadAudio('../assets/switch38.mp3'); // 苹果不支持ogg

        // 加载场景模型
        const bear = await loadGLTF("../assets/BearRigging2.glb");
        const chris = await loadGLTF("../assets/ChristmasAR.glb");
        const giftBox = await loadGLTF("../assets/gift.glb");

        // 添加模型动画
        const bearMixer = new THREE.AnimationMixer(bear.scene);
        const bearJump = bearMixer.clipAction(bear.animations[0]);
        const bearWalk = bearMixer.clipAction(bear.animations[1]);
        bearJump.loop = THREE.LoopOnce;

        // 创建粒子系统（雪花）
        const particleCount = 1000;
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesMaterial = new THREE.PointsMaterial({
            map: new THREE.TextureLoader().load('../assets/snow.png'), // 加载雪花纹理
            size: 0.5, // 雪花大小
            transparent: true,
            depthWrite: false,
            opacity: 0.8,
        });

        // 初始化粒子位置
        const positions = [];
        for (let i = 0; i < particleCount; i++) {
            positions.push(
                Math.random() * 10 - 5, // X 轴范围 [-5, 5]
                Math.random() * 10,     // Y 轴范围 [0, 10]
                Math.random() * 10 - 15  // Z 轴范围 [-5, 5]
            );
        }
        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);

        // 创建金光效果
        const ringGeometry = new THREE.RingGeometry(0.5, 1, 32); // 金光的环
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700, // 金黄色
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(0, -1, -5); // 与礼物盒子位置一致
        ring.scale.set(0, 0, 0); // 初始缩放为 0
        scene.add(ring);

        // 创建 Target Anchor
        const arAnchor = mindarThree.addAnchor(0); // MindAR里面的第一张图

        // Anchor Callbacks
        arAnchor.onTargetFound = () => {
            console.log("发现Target");

            if (isCubeAdded) return;
            isCubeAdded = true;

            scene.add(giftBox.scene);
            giftBox.scene.scale.set(1, 1, 1);
            giftBox.scene.position.set(0, -2, -20);
            giftBox.scene.rotation.x = 0.3;
            giftBox.scene.userData.clickable = true

            const asisn = document.getElementsByClassName('mindar-ui-overlay mindar-ui-scanning');
            document.body.removeChild(asisn[0]);
        }

        let rotationStartTime = null;
        // 鼠标点击盒子事件
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
                    if (o === giftBox.scene) {
                        // 点击音效
                        audioPlayer1.setBuffer(clickAudio);
                        audioPlayer1.play();

                        // 启动金光动画
                        animateRing(ring, () => {
                            audioPlayer1.setBuffer(musicAudio);
                            audioPlayer1.play();

                            // 动画完成后切换模型
                            scene.remove(giftBox.scene);
                            scene.add(chris.scene);
                            chris.scene.scale.set(1.2, 1.2, 1.2);
                            chris.scene.position.set(2, -3, -20);
                            // chris.scene.rotation.set(0, -0.5, 0);
                            chris.scene.userData.clickable = true;

                            // 开始旋转动画
                            rotationStartTime = performance.now();

                            // 展示雪花
                            scene.add(particles);
                        });
                    }
                }
            }
        });

        // 金光动画
        function animateRing(ring, onComplete) {
            const duration = 0.5; // 动画时长（秒）
            const startTime = performance.now();

            function animate() {
                const elapsedTime = (performance.now() - startTime) / 1000;
                if (elapsedTime < duration) {
                    const scale = elapsedTime / duration * 5; // 环扩大
                    ring.scale.set(scale, scale, scale);
                    ring.position.set(0, 0, -15);

                    const opacity = 1 - elapsedTime / duration; // 环逐渐透明
                    ring.material.opacity = opacity;

                    renderer.render(scene, camera);
                    requestAnimationFrame(animate);
                } else {
                    // 动画完成，移除金光
                    ring.scale.set(0, 0, 0);
                    ring.position.set(0, 0, -15);
                    ring.material.opacity = 0;
                    if (onComplete) onComplete();
                }
            }

            animate();
        }

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

        // 粒子下落动画
        function animateParticles(delta) {
            const positions = particlesGeometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= delta * 0.2; // Y 轴下落
                if (positions[i] < -1) {
                    positions[i] = 2; // 重置粒子位置到顶部
                }
            }
            particlesGeometry.attributes.position.needsUpdate = true;
        }

        // 启动 MindAR 场景 并且 渲染循环 Update
        const clock = new THREE.Clock();
        await mindarThree.start();
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            const elapsedTime = performance.now();
            const deltaTime = rotationStartTime ? (elapsedTime - rotationStartTime) / 1000 : 0;

            animateParticles(delta);
            giftBox.scene.rotation.y = giftBox.scene.rotation.y + delta;
            const rotationAngle = (Math.sin(deltaTime * 0.9) * (Math.PI / 6)) - 0.9; // -30° 到 30° 范围
            chris.scene.rotation.y = rotationAngle;

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
                    } else if (result.name === 'victory') {
                        fadeToAction(bearJump, 0.1);
                    } else if (result.name === 'middle_up') {
                    }

                    const chosenHand = hand.handedness.toLowerCase();
                    //testLayer[chosenHand].innerText = gestureStrings[result.name];
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
