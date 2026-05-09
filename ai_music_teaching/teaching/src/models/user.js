import { history } from 'umi';
import api from 'api';
import { pathToRegexp } from 'path-to-regexp'
import { getUserMedia } from 'utils/getUserMedia';

const { GetSystemTimeAPI } = api

export default {
    namespace: 'user',
    state: {
        userInfo: {
            userName: "",
            account: "",
            userId: -1,
            userType: -1,
        },
        token: "",
        pathname: "",
        moduleInfo: {
            moduleKey: "",
            moduleName: ""
        },
        macAddress: "",
        registry: "",
        teacherInfo: null
    },
    subscriptions: {
        // 只在第一次访问或者刷新浏览器时才触发此函数
        setup({ history, dispatch }, error) {
            if (window?.electronAPI) {
                window.electronAPI.send('get-mac-address');
                window.electronAPI.receive('mac-address', (macAddress, event) => {
                    dispatch({ type: "updateMac", payload: macAddress });
                })
                window.electronAPI.send('get-registry');
                window.electronAPI.receive('registry-value', (registry, event) => {
                    if (registry) {
                        dispatch({ type: "updateRegistry", payload: registry });
                    }
                })
                window.electronAPI.receive('teacherInfo', (info) => {
                    if (info) dispatch({ type: "queryTeacherInfo", payload: info });
                })
                window.electronAPI.receive('stream', async (sourceId) => {
                    console.log('sourceId', sourceId);
                    const stream = await getUserMedia(sourceId);
                    let videoElement = document.createElement('video');
                    videoElement.autoplay = true;
                    videoElement.controls = true;
                    videoElement.style.width = "100%";
                    videoElement.srcObject = stream;
                    // 将 video 插入到 #root 节点下
                    document.getElementById('root').appendChild(videoElement);
                });
            }

            history.listen(({ pathname, state }) => {
                console.log("用户切换路径", pathname);
                dispatch({ type: "updatePathname", payload: pathname });
                if (state && state.moduleInfo) {
                    // 检查路由变化,用于切换tab
                    dispatch({ type: "syncUser", payload: { moduleInfo: state.moduleInfo } })
                }
            });
            // console.log("查询用户信息");
            dispatch({ type: 'query', payload: history.location.pathname });
        },

    },
    effects: {
        *query({ payload }, { select, put }) {
            try {
                let userInfo = null;
                // 先从sessionStorage获取userInfo
                const userInfoStr = window.sessionStorage.getItem("userInfo");
                if (userInfoStr) {
                    userInfo = JSON.parse(userInfoStr, userInfo);
                    //这里在重复刷新的时候，会读取缓存值，而state中值并未改变
                    yield put({ type: "syncUser", payload: { userInfo: userInfo } });
                }
                else {
                    // 或从state里获取userInfo
                    userInfo = yield select(_ => _.user.userInfo);
                }
                console.log("get user info: " + JSON.stringify(userInfo))
                if (!userInfo || userInfo.userId < 0) {
                    // 用户未登陆
                    if (history.location.pathname !== '/login') {
                        history.push({ pathname: '/login' });
                    }
                    return;
                }

            } catch (error) {
                console.error("用户信息查询出错：" + error);
            }
        },

        *changeModule({ payload }, { put }) {
            history.push({ pathname: payload.pathname })
            yield put({ type: 'syncUser', payload: { moduleInfo: payload.moduleInfo } });
        },

        *logout({ }, { put }) {
            yield put({ type: "logoutUser" });
        },

        *queryTeacherInfo({ payload }, { call, put, select }) {
            const { teacherInfo } = yield select(_ => _.user);
            if (teacherInfo) return;
            yield put({ type: "updateTeacherInfo", payload: payload });
        },

        *querySystemTime({ callback }, { call, put }) {
            const result = yield call(GetSystemTimeAPI);
            if (result.success) {
                const sysTime = result.data.replace(/\-/g, "/");
                const sysDate = new Date(sysTime);
                // const cDate = new Date();
                // if (Math.abs(parseInt(sysDate - cDate)) > 60000) {
                // yield put({ type: 'updateState', payload: { offsetTime: parseInt(sysDate - cDate) } });
                // }
                callback(sysDate);
            }
        },

    },
    reducers: {

        updateTeacherInfo(state, { payload }) {
            return { ...state, teacherInfo: payload };
        },

        updateMac(state, { payload }) {
            return { ...state, macAddress: payload };
        },

        updateRegistry(state, { payload }) {
            return { ...state, registry: payload };
        },

        updateUser(state, { payload }) {
            // 将user信息存入sessionStorage
            window.sessionStorage.setItem("userInfo", JSON.stringify(payload.userInfo));
            if (payload.token) {
                window.sessionStorage.setItem("token", payload.token);
            }
            return {
                ...state,
                ...payload
            }
        },
        logoutUser(state, { }) {
            //退出登录时，清空state和storage
            window?.electronAPI?.send('teacher-logout', 'quit');
            const initInfo = {
                userInfo: {
                    userName: "",
                    account: "",
                    userId: -1,
                    userType: -1, //社会考生2  或在校生1  
                },
                token: "",
                teacherInfo: null
            };
            window.sessionStorage.clear();
            window.sessionStorage.setItem("userInfo", JSON.stringify(initInfo.userInfo));
            window.sessionStorage.setItem("token", initInfo.token);
            window.sessionStorage.setItem("faceVerifyInfo", JSON.stringify(initInfo.faceVerifyInfo))
            return {
                ...state,
                ...initInfo
            }
        },
        syncUser(state, { payload }) {
            //将读到的登录用户信息，写回到state中
            return {
                ...state,
                ...payload
            }
        },
        updatePathname(state, { payload: pathname }) {
            return {
                ...state,
                pathname
            }
        },
        updateDeviceStatus(state, { payload: devicestatus }) {
            return {
                ...state,
                devicestatus: {
                    facestatus: devicestatus.FaceVerify,
                    midistatus: devicestatus.MidiFlag
                },

            }
        },
        updateFaceVerified(state, { payload: faceVerifyInfo }) {
            window.sessionStorage.setItem("faceVerifyInfo", JSON.stringify(faceVerifyInfo));
            return {
                ...state,
                faceVerifyInfo,
            }
        }
    }
}