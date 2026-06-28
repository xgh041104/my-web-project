import { history } from "umi";
import { message } from "antd";
import api from "api";
import { pathToRegexp } from "path-to-regexp";
import request from "utils/request";
import axios from "axios";

const InstanceAxios = axios.create({
  baseURL: "/chatbot",
  timeout: 60000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YyTNOgJAfqphdAwFOZaV:MlgWxAiwkbjOgVCmLiMv",
  },
});

const pushQuestion = async (payload) => {
  console.log("请求参数:", payload);
  const { signal, ...requestData } = payload;
  try {
    // 修正了post方法的调用方式
    const res = await InstanceAxios.post("/chat/completions", requestData, {
      signal,
    });
    console.log("响应数据:", res);
    // 假设接口返回格式为{code:0,message:"",data:{}}
    if (res.status === 200) return res;
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("请求已被用户取消");
    } else {
      console.error("请求发生错误:", error);
    }
    return null;
  }
};

import { apiPrefix } from "config";

export default {
  namespace: "knowledgeSolution",
  state: {
    tagList: [],
  },

  subscriptions: {
    setupHistory({ dispatch, history }) {
      //监听history变化
      return history.listen(({ pathname, state }) => {
        if (pathname === "/teach/knowledgeSolution") {
          dispatch({ type: "updateTagList" });
        }
      });
    },
  },

  effects: {
    *pushQuestion({ payload, callback }, { call, put }) {
      const res = yield call(pushQuestion, payload);
      if (res) {
        callback?.(null, "请求成功", res.data);
      } else {
        yield put({
          type: "updateTagList",
          payload: {
            tagList: "服务器异常，请稍后重试或换一个问题",
          },
        });
      }
    },
  },

  reducers: {
    updateTagList(state, { payload }) {
      return { ...state, ...payload };
    },
  },
};
