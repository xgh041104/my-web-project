export const siteName = '学习考试平台';

//地大服务器设置
// export const rootAddr = "http://47.116.207.219"
export const rootAddr = 'https://exam-backend-u6wy.onrender.com'; //http://10.224.53.121:7566
// export const hostAddr = rootAddr + '/studyexamapi';
export const hostAddr = rootAddr;

export const apiPrefix = hostAddr + '/Student';

export const patrolApiPrefix = hostAddr + '/Patrol';

// export const baseUrl = "/studentExam";
export const baseUrl = '';

let fileHostPrefix = hostAddr + '/'; //请求远程的文件
export function filePrefix() {
  return fileHostPrefix;
}

export function setFilePrefix(fileAddr: string) {
  fileHostPrefix = fileAddr;
}
