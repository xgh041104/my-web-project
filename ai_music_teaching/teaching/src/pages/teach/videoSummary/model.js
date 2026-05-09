import { history } from 'umi';
import { message } from 'antd';
import { pathToRegexp } from 'path-to-regexp';
import request from 'utils/request';
import { teachPrefix } from 'config';
import axios from 'axios';

// url传参类请求
const urlAxios = axios.create({
  baseURL: teachPrefix,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  namespace: 'videoSummary',
  state: {
    bookList: [],
    filteredBookList: [], // 新增状态用于存储筛选后的数据
    videoDisplayData: [], // 存储单个课程的视频详情数据
    total: -1,
  },

  subscriptions: {
    setupHistory({ dispatch, history }) {  //监听history变化
      return history.listen(({ pathname, state }) => {
        if (pathname === '/teach/videoSummary') {
          dispatch({ type: 'fetchBookList' });
        }
        if (pathname === '/teach/videoSummary/detail') {
          console.log("pathname", pathname);
          const bookId = state.bookId;
          if (bookId === undefined || bookId == null) {
            message.error("未找到该书");
            return;
          }
          // 请求视频信息
          dispatch({
            type: 'fetchVideoDisplay',
            payload: { bookId },
          });
        }
      })
    },
  },

  effects: {
    *fetchBookList(_, { call, put }) {
      // const res = yield call(request, { url: `${teachPrefix}/musicTeaching/books`, method: 'GET' });
      // 调用请求
      const request = yield urlAxios.get('musicTeaching/books');
      const result = request.data;
      // console.log(result);
      if (result.code === 200) {
        // 对数据按照最新更新时间进行降序排序
        // const sortedData = (result.data.records || []).sort((a, b) => {
        //   return new Date(b.updateAt) - new Date(a.updateAt);
        // });
        // message.success("获取书籍列表成功");

        yield put({ type: 'updateStatusList', payload: { bookList: result.data.records, } });

      } else {
        message.error("请求失败");
      }
    },
    *fetchVideoDisplay({ payload }, { call, put }) {
      const { bookId } = payload;
      // 调用请求
      const request = yield urlAxios.get(`musicTeaching/book/${bookId}`);
      const result = request.data;
      // console.log(result);
      if (result.code === 200) {
        // message.success("获取视频列表成功")
        yield put({
          type: 'updateStatusList',
          payload: {
            videoDisplayData: result.data.records,
            total: result.data.total
          }
        });
      } else {
        message.error("获取课程视频详情失败");
      }
    },
    *deleteVideo({ payload }, { call, put, select }) {
      const { videoId } = payload;
      if (!videoId) {
        message.error("视频ID不能为空");
        return;
      }

      try {
        const request = yield urlAxios.delete(`musicTeaching/course/${videoId}`);
        const result = request.data;

        console.log('删除视频响应:', result);

        if (result.code === 200) {
          message.success("视频删除成功");

          // 获取当前的视频列表数据
          const currentState = yield select(state => state.videoSummary);
          const { videoDisplayData, total } = currentState;

          // console.log('当前视频数据:', videoDisplayData);
          // console.log('要删除的视频ID:', videoId);

          if (videoDisplayData && Array.isArray(videoDisplayData)) {
            // 从列表中移除被删除的视频，支持多种ID字段
            const updatedVideoData = videoDisplayData.filter(video => {
              const currentVideoId = video.courseId;
              console.log('比较视频ID:', currentVideoId, 'vs', videoId);
              return currentVideoId != videoId; // 使用宽松比较，避免类型问题
            });
            const updatedTotal = Math.max(0, total - 1);

            console.log('更新后的视频数据:', updatedVideoData);

            yield put({
              type: 'updateVideoDisplay',
              payload: {
                videoDisplayData: updatedVideoData,
                total: updatedTotal
              }
            });
          } else {
            // 如果没有当前数据，重新获取视频列表
            console.log('重新获取视频列表');
            if (bookId) {
              yield put({ type: 'fetchVideoDisplay', payload: { bookId } });
            }
          }
        } else {
          console.error('删除失败，响应:', res);
          message.error(res.message || res.msg || "删除视频失败");
        }
      } catch (error) {
        console.error('删除视频出错:', error);
        message.error("删除视频时发生错误: " + (error.message || error));
      }
    },

  },

  reducers: {
    updateStatusList(state, { payload }) {
      return { ...state, ...payload };
    },
    updateVideoDisplay(state, { payload }) {
      console.log('更新视频显示数据:', payload);
      return { ...state, ...payload };
    },
  },
};