import { message } from 'antd';
import api from 'api';

const { getImageDataAPI } = api

export default {
    namespace: 'staticData',
    state: {
        image: {
            data: "",
            index: -1
        }
    },
    effects: {
        *getImageData({ payload }, { put, call }) {
            const result = yield call(getImageDataAPI, { path: payload.imagePath });
            if (result.code == 1) {
                console.log("查看图片:", result);
                yield put({ type: "updateState", payload: { image: { index: payload.index, data: result.data } } });
            } else {
                message.error("查看图片失败：" + result.msg, 3);
            }
        }
    },
    reducers: {
        updateState(_, { payload }) {
            return { ...payload }
        }
    }
}