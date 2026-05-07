import { message } from 'antd';
import api from 'api';

const { GetSystemTimeAPI,GetStudentInfoByID, GetCurrentStudyCourseAPI, GetQuestionWrongByStudentIdAPI, GetQuestionByQuestionIdAPI, DelQuestionWrongAPI,GetStudentExamInfoAPI } = api;

export default {
    namespace: 'myCenter',
    state: {
        studentInfo: {},
        myLesson: [],
        questionList: [],
        MyExam:[],
        offsetTime: 0,  //本地与后台的时间差ms， 本地慢则时间为+，本地快则时间为-。
    },
    subscriptions: {
        setupHistory({ dispatch, history }) {  // eslint-disable-line
            const check = ({ pathname, state }) => {
                if (pathname === "/mycenter") {
                    dispatch({ type: 'queryMyInfo' });
                }
            }
            check(history.location);
            return history.listen(({ location }) => {
                check(location)
            })
        },
    },

    effects: {
        *queryMyInfo({ _ }, { put, call, select }) {
            const userInfo = yield select(_ => _.user.userInfo);
            if (!userInfo.isLogin) {
                message.error("未登录，请先登录！", 3);
                return;
            }
            yield put({ type: 'querySelfInfo', payload: userInfo.userId });
            yield put({ type: 'queryMyLesson', payload: userInfo.userId });
            yield put({ type: 'queryMyErrorQuestion', payload: userInfo.userId });
            yield put({ type: 'queryExamList', payload: userInfo.userId });
        },
        *querySelfInfo({ payload }, { put, call }) { //查学生信息 , payload: userId
            const result = yield call(GetStudentInfoByID, { StudentId: payload });
            if (result.code == 1) {
                yield put({ type: "updateState", payload: { studentInfo: result.data } });
            } else {
                message.error(result.msg, 3);
            }
        },
        *queryMyLesson({ payload }, { put, call }) {//查学生课程信息 , payload: userId
            const result = yield call(GetCurrentStudyCourseAPI, { StudentId: payload });
            if (result.code == 1) {
                yield put({ type: 'updateState', payload: { myLesson: result.data } });
            } else {
                message.error("请求我的课程失败，" + result.msg, 3);
            }
        },
        *queryMyErrorQuestion({ payload }, { put, call }) {//查学生错题集信息 , payload: userId
            const result = yield call(GetQuestionWrongByStudentIdAPI, { StudentId: payload });
            if (result.code == 1) {
                yield put({ type: 'updateState', payload: { questionList: result.data } });
            } else {
                message.error("请求我的错题集失败，" + result.msg, 3);
            }
        },
        *removeWrongQuestion({ payload }, { put, call }) {
            const result = yield call(DelQuestionWrongAPI, payload.questionId);
            if (result.code == 1) {
                yield put({ type: 'queryMyErrorQuestion', payload: payload.userId });
                message.success('删除错题成功！');
            } else {
                message.error("请求我的错题集失败，" + result.msg, 3);
            }
        },
        *queryExamList({payload}, { call, put }) {

            const result = yield call(GetStudentExamInfoAPI, { StudentId: payload});

            if (result.code == 1) {
                yield put({ type: 'updateState', payload: { MyExam: result.data } });
            } else {
                message.error("拉取考试信息失败：" + result.msg, 3);
            }
        },
        *querySystemTime(_, { call, put }) {
            const result = yield call(GetSystemTimeAPI);
            if (result.success) {
                const sysTime = result.data.replace(/-/g, "/");
                const sysDate = new Date(sysTime);
                const cDate = new Date();
                if (Math.abs(parseInt(sysDate - cDate)) > 60000) {
                    yield put({ type: 'updateState', payload: { offsetTime: parseInt(sysDate - cDate) } });
                }
            }
        },
    },

    reducers: {
        updateState(state, action) {
            return { ...state, ...action.payload };
        },
    },
}
