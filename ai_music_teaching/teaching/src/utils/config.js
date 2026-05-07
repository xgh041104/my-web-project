export const apiPrefix = "http://47.113.223.219/subjectcourse"; //远程接口地址1
export const testPrefix = "http://10.51.172.0:7566"; //考试系统接口地址
export const siteName = "乐智课堂——基于AI的音乐教学平台";

// export const teachPrefix = 'http://192.168.1.14:8080'; // 视频服务后端地址
export const teachPrefix = "http://localhost:8080"; // 视频服务后端地址

export const baseUrl = "";

const filePrefix = apiPrefix + "/";

export function getFilePrefix() {
  return filePrefix;
}
export function setFilePrefix(filePath) {
  filePrefix = filePath;
}
