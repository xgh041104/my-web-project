import { pathToRegexp } from 'path-to-regexp'

export default {

    namespace: 'tabs',

    state: {
        tabItems: [],
        activeKey: ""
    },

    subscriptions: {
        setupHistory({ dispatch, history }) {  // eslint-disable-line
            if (pathToRegexp("/:firstRoute/:secondRoute", [], { end: false }).exec(history.location.pathname)) {
                history.replace({ pathname: "/teach/bookTeach" });
            }
            // dispatch({ type: '/fetch' });
        },
    },

    effects: {
        * fetch({ payload }, { call, put }) {  // eslint-disable-line
            yield put({ type: 'save' });
        },
        * saveTabs({ payload }, { select, call, put }) {
            const { activeKey, pathname } = yield select(_ => _.tabs);
            if (payload.pathname === pathname && payload.activeKey === activeKey) {
                return;
            }
            yield put({ type: "save", payload })
        }
    },

    reducers: {
        save(state, action) {
            return { ...state, ...action.payload };
        },
    },
};