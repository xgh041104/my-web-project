import { notification } from 'antd';
import axios from 'axios';

const postAxiosJson = axios.create({
  baseURL: '/docmee',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Api-Key': 'ak_r4zutH356s5spvlh2b',
  },
});

const postAxios = axios.create({
  baseURL: '/docmee',
  timeout: 30000,
  headers: {
    'Content-Type': 'multipart/form-data',
    'Api-Key': 'ak_r4zutH356s5spvlh2b',
  },
});

const postTaskId = axios.create({
  baseURL: '/docmee',
  timeout: 30000,
  headers: {
    'Authorization': ``
  },
});

const postContent = axios.create({
  baseURL: '/docmee',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': ``
  },
});

export default {
  namespace: 'generation',

  state: {
    apiKey: 'ak_r4zutH356s5spvlh2b',
    apiToken: ' ',
    taskId: ' ',
    editingOutline: '',
    totalTitle: '',
  },

  effects: {
    *createApiToken({ payload }, { call, put }) {
      yield put({ type: 'updateState', payload: { loading: true } });
      const response = yield postAxiosJson.post('user/createApiToken', payload);
      const data = response.data
      postTaskId.defaults.headers['Authorization'] = `Bearer ${data.data.token}`;
      postContent.defaults.headers['Authorization'] = `Bearer ${data.data.token}`;
      yield put({
        type: 'updateState',
        payload: {
          apiToken: data.data.token,
          loading: false
        }
      });
      return data.data.token;
    },

    *createTask1({ payload }, { call, put }) {
      yield put({ type: 'updateState', payload: { loading: true } });
      const form = new FormData();
      form.append('type', '1');
      form.append('content', payload.theme);
      const response = yield postTaskId.post('/ppt/v2/createTask', form)
      const data = response.data
      yield put({
        type: 'updateState',
        payload: {
          taskId: data.data.id,
          loading: false
        }
      });
      console.log(data.data.id)
      return data.data.id;
    },
    *createTask2({ payload }, { call, put }) {
      yield put({ type: 'updateState', payload: { loading: true } });
      const form = new FormData();
      form.append('type', '2');
      form.append('file', payload.file);
      const response = yield postTaskId.post('/ppt/v2/createTask', form)
      const data = response.data
      yield put({
        type: 'updateState',
        payload: {
          taskId: data.data.id,
          loading: false
        }
      });
      console.log(data.data.id)
      return data.data.id;
    },

    *generateContent({ payload }, { call, put, select }) {
      yield put({ type: 'updateState', payload: { loading: true } });
      const { formData } = payload;
      const taskId = yield select(state => state.generation.taskId);

      const params = {
        id: taskId,
        stream: false,
        length: formData.length,
        scene: formData.scene,
        audience: formData.audience,
        lang: formData.lang,
        prompt: ''
      };

      const response = yield call(postContent.post, '/ppt/v2/generateContent', params);
      yield put({ type: 'updateState', payload: { loading: false } });
      return response;
    },
    //查询模板ppt
    *fetchTemplates({ payload }, { put }) {
      const response = yield postTaskId.post('ppt/templates', payload);
      return response;
    },
    //生成ppt
    *generatePPT({ payload }, { put }) {
      const response = yield postTaskId.post('ppt/v2/generatePptx', payload);
      return response;
    },

    // 新增：大纲修改API
    *updateContent({ payload }, { call, put, select }) {
      const { question, markdown } = payload;
      const { taskId, apiToken } = yield select(state => state.generation);
      if (!question.trim()) {
        throw new Error('请输入有效的修改要求');
      }
      const params = {
        id: taskId,
        stream: false,
        question,
        markdown
      };
      const response = yield call(
        postContent.post,
        '/ppt/v2/updateContent',
        params
      );
      const responseData = response.data;
      let newContent = '';

      if (responseData?.data?.text) {
        newContent = responseData.data.text;
      } else if (responseData?.text) {
        newContent = responseData.text;
      } else {
        newContent = JSON.stringify(responseData);
      }
      yield put({
        type: 'updateEditingOutline',
        payload: newContent
      });

      return newContent;
    },
    *fetchTemplateContent({ payload }, { call, put, select }) {
      const { totalTitle } = yield select(state => state.generation);
      return totalTitle;
    },
  },

  reducers: {
    updateState(state, { payload }) {
      return { ...state, ...payload };
    },
    updateEditingOutline(state, { payload }) {
      return { ...state, editingOutline: payload };
    },
    updateTotalTitle(state, { payload }) {
      return { ...state, totalTitle: payload };
    },
  },
};