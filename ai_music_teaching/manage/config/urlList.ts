export const siteName = '学习考试平台';
// export const hostAddr = "http://47.116.207.219/studyexamapi";
export const hostAddr = 'http://10.224.53.121:7566';
export const apiPrefix = hostAddr + '/Manage';
export const studentExam = hostAddr + '/Student';

// export const filePrefix = hostAddr + "/File" //请求远程的文件

// export const baseUrl = "/studyexammanage";
export const baseUrl = '';

let fileHostPrefix = hostAddr + '/'; //请求远程的文件
export function filePrefix() {
  return fileHostPrefix;
}

export function setFilePrefix(fileAddr: string) {
  fileHostPrefix = fileAddr;
}
