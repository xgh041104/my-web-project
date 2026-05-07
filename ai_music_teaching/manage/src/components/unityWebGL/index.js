import React from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl'; //9.x.x版本写法

function UnityWebGLCom(props) {
    //console.log("UnityWebGL18_19:", props.urlPrefix, props.urlName);
    const { unityProvider } = useUnityContext({
        loaderUrl: props.urlPrefix + "UnityLoader.js",
        dataUrl: props.urlPrefix + props.urlName + ".data.unityweb",
        frameworkUrl: props.urlPrefix + props.urlName + ".wasm.framework.unityweb",
        codeUrl: props.urlPrefix + props.urlName + ".wasm.code.unityweb",
    });
    return <Unity unityProvider={unityProvider} />;
}

export default UnityWebGLCom;