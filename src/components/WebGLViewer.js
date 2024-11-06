import React from 'react';

const WebGLViewer = () => {
    return (
        <div className="webgl-container">
            <iframe
                src="/webgl/index.html"
                style={{ width: '800px', height: '600px' }}
                title="Unity WebGL Game Interface"
            ></iframe>
        </div>
    );
};

export default WebGLViewer;