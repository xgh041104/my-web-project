import { message } from 'antd';
// import api from 'api';
import axios from 'axios';
import CryptoJS from 'crypto-js';


const boxApiKey = '90b11c3dd9a5';

function getApiToken() {
    const timeStamp = new Date().getTime()
    const keyStr = boxApiKey + String(timeStamp);
    //token: 32位MD5(apikey + 13位时间戳) + 13位时间戳
    const md5Value = CryptoJS.MD5(keyStr).toString(CryptoJS.enc.Hex) + String(timeStamp);
    // console.log(timeStamp, keyStr, md5Value);
    return md5Value;
}


const axiosInstance = axios.create({
    baseURL: '/musicBox/api',
    timeout: 3000,
    headers: {
        'apiKey': boxApiKey,
        'apiToken': getApiToken(),
    }
});

//根据parentId与type，查该分类id下的分类
async function getCats(parentId, type) {

    var data = [];

    const res = await axiosInstance.get('/web/enjoy/classify', {
        params: { parentId: parentId, type: type },
    });
    if (res.status == 200 && res.data.code == 'success') {
        const resData = res.data.data;
        for (let item of resData) {
            item.children = await getCats(item.id, type);
            data.push(item);
        }
    } else {
        message.error('人音赏析库请求分类出错：' + res.statusText + res?.data?.msg);
    }
    return data;
}

//3级select，因此默认先读取各级分类的第一个
async function getAllCats() {
    var allCats = [
        { label: '专辑资源', value: 1 },
        { label: '视频资源', value: 2 },
    ];

    //取parentId为0下的所有一级分类
    allCats[0].children = await getCats(0, 1);
    allCats[1].children = await getCats(0, 2);
    allCats[0].children.push(...allCats[1].children);

    return allCats;
}

async function getResourceList(type, classifyId, pageNo, pageSize) {
    var data = [];
    if (type == 1) { //专辑
        const res = await axiosInstance.get('/web/enjoy/catalogue/list', {
            params: { classifyId: classifyId, pageNo: pageNo, pageSize: pageSize },
        });
        // console.log(res);
        if (res.status == 200 && res.data.code == 'success') {
            data = res.data.data;
        } else {
            message.error('人音赏析库请求专辑列表出错：' + res.statusText + res?.data?.msg);
        }
    } else if (type == 2) { //视频
        // console.log('video/list: ', classifyId);
        const res = await axiosInstance.get('/web/enjoy/video/list', {
            params: { classifyId: classifyId, pageNo: pageNo, pageSize: pageSize },
        });
        console.log(res);
        if (res.status == 200 && res.data.code == 'success') {
            data = res.data.data;
        } else {
            message.error('人音赏析库请求视频列表出错：' + res.statusText + res?.data?.msg);
        }
    }
    return data;
}

async function getRecommendList() {
    const data = await getResourceList(1, 2, 1, 1000);
    //至多随机取7个
    const dataLength = data?.list?.length;
    // console.log('getRecommendList: ', dataLength);
    if (dataLength > 7) {
        const numbers = [];

        //保证取7个不同的随机数
        while (numbers.length < 7) {
            const num = Math.floor((Math.random() * dataLength));
            if (numbers.indexOf(num) == -1) {
                numbers.push(num);
            }
        }

        return [
            data.list[numbers[0]],
            data.list[numbers[1]],
            data.list[numbers[2]],
            data.list[numbers[3]],
            data.list[numbers[4]],
            data.list[numbers[5]],
            data.list[numbers[6]]
        ]
    } else if (dataLength >= 0 && dataLength <= 3) {
        return data.list;
    } else {
        return [];
    }
}

async function getResourceDetail(type, id) {
    var data = {};
    if (type == 1) {
        const res = await axiosInstance.get('/web/enjoy/catalogue/info', {
            params: { id: id },
        });
        // console.log(res);
        if (res.status == 200 && res.data.code == 'success') {
            data = res.data.data;
        } else {
            message.error('人音赏析库请求专辑详情出错：' + res.statusText + res?.data?.msg);
        }
    } else if (type == 2) {
        const res = await axiosInstance.get('/web/enjoy/video/info', {
            params: { id: id },
        });
        // console.log(res);
        if (res.status == 200 && res.data.code == 'success') {
            data = res.data.data;
        } else {
            message.error('人音赏析库请求视频详情出错：' + res.statusText + res?.data?.msg);
        }
    }
    return data;
}

export default {
    namespace: 'musicBox',
    state: {
        allCats: [],
        // cats0: [//根分类，目前只有固定的专辑和视频两种，分别对应type=1，type=2
        //     { label: '专辑资源', value: 1 },
        //     { label: '视频资源', value: 2 },
        // ],
        // cats1: [], //大分类，一级分类
        // cats2: [], //小分类，二级分类, 需要根据一级分类进行切换

        resourceList: [], //资源列表，后台已处理分页；专辑和视频返回的列表字段不同
        resourceDetail: {}, //资源详情，专辑和视频的资源详情字段不一样
        recommendList: [], //智能推荐列表, 默认取7个
        lastRecordList: [], //最近记录列表，默认只留7个
    },
    subscriptions: {
        setupHistory({ dispatch, history }) {
            return history.listen(({ pathname, state }) => {
                if (pathname === '/study/musicBox') {
                    dispatch({ type: 'queryMusicBoxCats' });
                    return;
                }
            });
        },
    },
    effects: {
        //先将所有分类查到
        * queryMusicBoxCats({ _ }, { put, call }) {
            const cats = yield call(getAllCats);
            // console.log(cats);
            if (cats.length <= 0) {
                message.info('查询音乐百宝箱分类为空');
            }
            yield put({ type: 'updateState', payload: { allCats: cats } });

            //默认查询第一个分类的内容
            if (cats?.length && cats.length > 0) {
                yield put({
                    type: 'queryResourceList',
                    payload: {
                        rootType: 1,
                        classifyId: 2,
                        pageNo: 1,
                        pageSize: 10,
                    },
                });

                yield put({ type: 'queryRecommendList' });
                yield put({ type: 'queryLastRecordList' });
            } else {
                message.info('未查询到资源！');
            }
        },
        //查询某个分类的资源列表，需要传递二级分类id、分页信息
        * queryResourceList({ payload }, { put, call }) {
            const listData = yield call(getResourceList, payload.rootType, payload.classifyId, payload.pageNo, payload.pageSize);
            // console.log('resourceList: ', listData, payload);
            if (listData.length <= 0) {
                message.info('查询音乐百宝箱资源为空！');
            }
            yield put({ type: 'updateState', payload: { resourceList: listData } });
        },
        //查询某个资源的详情，专辑和视频可以通用查询
        * openResourceDetail({ payload, callback }, { put, call }) {
            const detail = yield call(getResourceDetail, payload.rootType, payload.resourceId);
            if (typeof detail !== 'object' || Object.keys(detail).length <= 0) {
                message.info('查询音乐百宝箱资源详情为空！');
            }
            callback(detail);
            yield put({ type: 'updateState', payload: { resourceDetail: detail } })
        },
        //查智能推荐列表，默认只查中国音乐的歌曲资源，随机拿取
        * queryRecommendList({ }, { put, call }) {
            const recommend = yield call(getRecommendList);
            // console.log('recommend list: ', recommend);
            yield put({ type: 'updateState', payload: { recommendList: recommend } });
        },
        //查智能推荐列表，默认只查中国音乐的歌曲资源，随机拿取; 不设置state，直接callback返回
        *recommendListHomepage({ callback }, { call }) {
            const recommend = yield call(getRecommendList);
            callback(recommend);
        },
        //查最近记录列表，从local storage中取
        * queryLastRecordList({ }, { put, call }) {
            const dataStr = window.localStorage.getItem("lastRecord");
            if (dataStr) {
                const data = JSON.parse(dataStr, null);
                if (data?.length) {
                    yield put({ type: 'updateState', payload: { lastRecordList: data } });
                } else {
                    yield put({ type: 'updateState', payload: { lastRecordList: [] } });
                }
            } else {
                yield put({ type: 'updateState', payload: { lastRecordList: [] } });
            }
        },
        * setLastRecord({ payload }, { put }) {
            const dataStr = window.localStorage.getItem("lastRecord");
            if (dataStr) {
                const data = JSON.parse(dataStr, null);
                if (data?.length) {
                    const newData = [];
                    newData.push(payload);
                    for (let i = 0; i < data.length; i++) {
                        const item = data[i];
                        if (item.detail.id != payload.detail.id) {
                            newData.push(item);
                            if (newData.length >= 7) {
                                break;
                            }
                        }
                    }

                    yield put({ type: 'updateState', payload: { lastRecordList: newData } });
                    window.localStorage.setItem("lastRecord", JSON.stringify(newData));
                } else {
                    yield put({ type: 'updateState', payload: { lastRecordList: [payload] } });
                    window.localStorage.setItem("lastRecord", JSON.stringify([payload]));
                }
            } else {
                yield put({ type: 'updateState', payload: { lastRecordList: [payload] } });
                window.localStorage.setItem("lastRecord", JSON.stringify([payload]));
            }
        },
    },
    reducers: {
        updateState(state, action) {
            return { ...state, ...action.payload };
        },
    },
}