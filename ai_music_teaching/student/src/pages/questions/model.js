import { message } from 'antd';
import api, { GetFile } from 'api';

const { CompileCode } = api;

export default {
    namespace: 'questionsModel',
    state: {
        operateType: 0, //default: unity---- 0:unity
        paramas: '',  // unity是一段路径
    },
    subscriptions: {
        setupHistory({ dispatch, history }) {  // eslint-disable-line
          const check = ({ pathname, state }) => {
                if (pathname === "/questions/operate") {
                    if (state.type && state.paramas) {
                        dispatch({ type: 'updateOperateParamas', payload: { type: state.type, paramas: state.paramas } });
                    }
                }
            }
            check(history.location);
            return history.listen(({location}) => {
                check(location);
            })
        },
    },

    effects: {
        *updateOperateParamas({ payload }, { put }) {  //根据传入的参数类型，更新实操题的状态，以后可以适应不同的实操题
            if (payload.type == "unity") {
                yield put({ type: 'updateState', payload: { operateType: 0, paramas: payload.paramas } });
            }
        },
        *queryScoreFile({ payload: fileUrl }, { call, put }) {
            const result = yield call(GetFile, fileUrl);
            if (result.code == 1) {
                // yield put({ type: 'updateState', payload: {: result.data } })
                callback(result.data)
            }
            else {
                message.error(result.msg, 3)
            }
        },
        *runCode({ payload, callback }, { call, put }) {
            let result = null;
            try {
                result = yield call(CompileCode, payload);
            }
            catch (error) {
                result = { error: error.message }
            }
            callback(result);
        }
    },

    reducers: {
        updateState(state, action) {
            return { ...state, ...action.payload };
        },
    },
}
