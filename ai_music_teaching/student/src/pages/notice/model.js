import { message } from 'antd';
import api from 'api';

const { GetNoticeAllAPI, GetNoticeByIDAPI } = api;

export default {
    namespace: 'noticeModel',
    state: {
        noticeList: [],
        noticeDetail: {},
    },
    subscriptions: {
        setupHistory({ dispatch, history }) {  // eslint-disable-line
          const check = ({ pathname, state }) => {if (pathname === "/notice/noticepage") {
                    dispatch({ type: 'queryNoticeList' });
                }
                else if (pathname == '/notice/noticedetail') {
                    if (!state.id) {
                        return;
                    }
                    dispatch({ type: 'queryDetail', payload: state.id })
                }
              }
            check(history.location);
            return history.listen(({location}) => {
                check(location);
            })
        },
    },

    effects: {
        //查询全部Notice
        *queryNoticeList(_, { call, put }) {
            const result = yield call(GetNoticeAllAPI);
            if (result.code == 1) {
                yield put({ type: 'updateState', payload: { noticeList: result.data } });
            } else {
                message.error(result.msg, 3);
            }
        },
        *queryDetail({ payload }, { call, put }) {
            const result = yield call(GetNoticeByIDAPI, { NoticeId: payload });
            if (result.code == 1) {
                yield put({ type: 'updateState', payload: { noticeDetail: result.data } });
            } else {
                message.error(result.msg, 3);
            }
        }
    },

    reducers: {
        updateState(state, action) {
            return { ...state, ...action.payload };
        },
    },
}
