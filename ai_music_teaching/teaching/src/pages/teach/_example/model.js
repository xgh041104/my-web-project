import { message } from 'antd'
import api from 'api'

const { queryResourceCategoryTree, queryResourceByResourceCategoryId } = api;


export default {

    namespace: 'example',
    state: {
        resourceClassify: [],//资源分类
        resourceList: [],//资源列表
        resourcesFetched: false,//是否已经获取过资源
    },

    subscriptions: {
        setupHistory({ dispatch, history }) {
            return history.listen(({ pathname, state }) => {
                if (pathname === '/teach/example') {
                    dispatch({ type: 'checkAndFetchResources' });
                }
            })
        },
    },

    effects: {
        *checkAndFetchResources(_, { select, put }) {
            const alreadyFetched = yield select(state => state.instruTeach.resourcesFetched);
            if (!alreadyFetched) {
                yield put({ type: 'fetchResourceClassify' });
            }
        },
        // 获取资源列表
        *fetchResourceList({ payload }, { call, put, select }) {
            const userInfo = yield select(_ => _.user.userInfo);
            const result = yield call(queryResourceByResourceCategoryId, {
                resourceCategoryId: payload.resourceCategoryId,
                schoolId: userInfo.schoolId || 0,
                // 超管和管理员不需要创建人
                lecturerCommonUserId: userInfo.userType === 2 ? userInfo.userId : 0
            });
            if (result.code === 0) {
                yield put({
                    type: 'updateState', payload: {
                        resourceList: result.data,
                    }
                });
            }
            else {
                message.error(result.message, 3);
            }
        },
        // 获取资源分类
        *fetchResourceClassify({ }, { call, put, select }) {
            const { schoolId } = yield select(_ => _.user.userInfo);
            const result = yield call(queryResourceCategoryTree, { schoolId: schoolId || 0 });
            if (result.code === 0) {
                yield put({ type: 'updateState', payload: { resourceClassify: result.data, resourcesFetched: true } });
            }
            else {
                message.error(result.message, 3);
            }
        },
    },

    reducers: {
        updateState(state, action) {
            return { ...state, ...action.payload };
        },
    },
};