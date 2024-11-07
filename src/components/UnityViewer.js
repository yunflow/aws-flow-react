import React from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

const UnityViewer = () => {
    const { unityProvider, loadingProgression, isLoaded } = useUnityContext({
        loaderUrl: "webgl/Build/crowdrunner.loader.js",
        dataUrl: "webgl/Build/crowdrunner.data",
        frameworkUrl: "webgl/Build/crowdrunner.framework.js",
        codeUrl: "webgl/Build/crowdrunner.wasm",
    });

    return (
        <div id="unity-container">
            {!isLoaded && <p>Loading... {loadingProgression * 100}%</p>}
            <Unity
                unityProvider={unityProvider}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default UnityViewer;