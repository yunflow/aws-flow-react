import React from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

function UnityViewer({ folder, project }) {
    const { unityProvider, loadingProgression, isLoaded } = useUnityContext({
        loaderUrl: folder + "/Build/" + project + ".loader.js",
        dataUrl: folder + "/Build/" + project + ".data",
        frameworkUrl: folder + "/Build/" + project + ".framework.js",
        codeUrl: folder + "/Build/" + project + ".wasm",
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