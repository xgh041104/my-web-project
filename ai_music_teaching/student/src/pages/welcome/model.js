import { history } from 'umi'


export default {
  namespace: 'welcome',
  state: {
    firstEnter: true
  },
  subscriptions: {
    setupHistory({ dispatch, history }) {  // eslint-disable-line

      const check = ({ pathname, state }) => {
        if (pathname === "/welcome") {
          dispatch({ type: 'queryState' });
        }
      }
      check(history.location);
      return history.listen((location) => {
        check(location);
      })
    },
  },

  effects: {
    *queryState(_, { select }) {
      const firstEnter = yield select(_ => _.welcome.firstEnter);
      if (!firstEnter) {
        history.push({ pathname: "/homePage" });
        return
      }
    },
    *stopPlaying(_, { put }) {
      yield put({ type: "updateState", payload: { firstEnter: false } });
      history.push({ pathname: "/homePage" })
    }
  },

  reducers: {
    updateState(state, action) {
      return { ...state, ...action.payload };
    },
  },
}
