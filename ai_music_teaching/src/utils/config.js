
export const apiPrefix = "http://47.120.65.190/subjectcourse";  //远程接口地址1
//export const apiPrefix = "https://www.ebarotech.cn/subjectcourse"; //远程接口地址2
// export const apiPrefix = "http://192.168.0.125:7890";  //本地调试接口地址
// export const apiPrefix = "http://47.116.207.219/subjectcourse";//测试音乐大师二级账号地址

export const siteName = '乐智课堂——基于AI的音乐教学平台';

export const teachPrefix = 'http://192.168.1.14:8080'; // 视频服务后端地址

// export const baseUrl =  '/musicmaster';
// export const baseUrl =  '/onlinedetection';
// export const baseUrl =  '/musicmastermini';
// export const baseUrl =  '/musicmastertest';
export const baseUrl = '';


const filePrefix = apiPrefix + "/";

export function getFilePrefix() {
    return filePrefix;
}
export function setFilePrefix(filePath) {
    filePrefix = filePath;
}