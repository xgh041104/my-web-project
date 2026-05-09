import { message } from 'antd';
import request from 'utils/request';
import { teachPrefix } from 'config';
import axios from 'axios';

// 修改类请求
const modifyAxios = axios.create({
  baseURL: teachPrefix,
  timeout: 3000000, // 请求超时时间
  header: {
    'Content-Type': 'multipart/form-data',
  }
});

const urlAxios = axios.create({
  baseURL: teachPrefix,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  namespace: 'recorder',

  state: {
    bookList: [],
  },

  effects: {
    *uploadToServer({ payload, callback }, { call }) {
      console.log('payload', payload);
      const { type, bookId, title, audio, video } = payload;
      const formData = new FormData();
      if (type === 1) {
        formData.append('bookId', bookId);
        formData.append('video', video);
      }
      formData.append('type', type);
      formData.append('title', title);
      formData.append('audio', audio);
      try {
        const request = yield modifyAxios.post("musicTeaching/course", formData)
        const result = request.data;
        // console.log('视频上传成功:', result);
        if (result.code === 200) {
          console.log('视频上传成功:', result);
          callback?.(null, '视频上传成功', result.data);
        } else {
          callback?.(new Error(res.message || '视频上传失败'));
        }
      } catch (err) {
        console.error('[错误] 视频上传失败:', err);
        callback?.(new Error('网络错误，视频上传失败'));
      }
    },

    *fetchBookList({ payload, callback }, { call, put }) {
      const request = yield urlAxios.get('musicTeaching/books');
      const result = request.data;
      console.log(123132123123,result);
      if (result.code === 200) {
        callback?.(null, '获取书籍列表成功', result.data.records);
        yield put({ type: 'updateVideoList', payload: { bookList: result.data.records, } });
      } else {
        message.error("请求失败");
        callback?.(new Error(result.message || '获取书籍列表失败'));
      }
    },
  },

  reducers: {
    updateVideoList(state, { payload }) {
      return { ...state, ...payload };
    },
  },
};
