const base64ToBlob = (base64Data) => {
    const dataArr = base64Data.split(','); // 根据,来分隔

    const imageType = dataArr[0].match(/:(.*?);/)[1]; // 获取文件类型。使用正则捕获 image/jpeg

    const textData = window.atob(dataArr[1]); // 使用atob() 将base64 转为文本文件
    const arrayBuffer = new ArrayBuffer(textData.length); // 创建一个二进制数据缓冲区，可以理解为一个数组
    const uint8Array = new Uint8Array(arrayBuffer); // 创建一个类型化数组对象，可以理解为上面的数组的成员，给这个对象赋值就会放到上面的数组中。
    for (let i = 0; i < textData.length; i++) {
        uint8Array[i] = textData.charCodeAt(i); // 将文本文件转为UTF-16的ASCII, 放到类型化数组对象中
    }
    let imageBlob1 = new Blob([arrayBuffer], { type: imageType });
    imageBlob1.name = String(Date.now()) + "." + imageType.slice(6);
    return [imageBlob1, imageType.slice(6)]; // 返回两个值，一个Blob对象，一个图片格式（如jpeg）
}

export default base64ToBlob;