import React, { forwardRef, useImperativeHandle  } from 'react'
import { useScreenshot } from "use-react-screenshot"

//防止函数组队的刷新对曲谱造成影响
const ScreenShot =  forwardRef((props, ref) => {
    
    const [image, takeScreenShot] = useScreenshot();
    const getImage = (screenShotRef) => {
        return takeScreenShot(screenShotRef.current);
        // return image;
    }
    useImperativeHandle(
        ref,
        () => ({
            getImage
        }),
        //   [third],
    )
    return null;
})

export default ScreenShot;