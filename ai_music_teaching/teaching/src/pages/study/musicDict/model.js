import { message } from 'antd';
import api from 'api';
import axios from 'axios';
import { baseUrl } from 'config';

//RMYY的原始服务器接口
const RYToken = '7d4ce113557e42f6b1c461405ab8a562'
const axiosInstance = axios.create({
    baseURL: '/musicDict/api',
    timeout: 5000,
    headers: {
        'Token': RYToken,
    }
});

//新部署的字典服务接口
const axiosInstance2 = axios.create({
    baseURL: '/newDict/personmusic/personmusic',
    timeout: 5000,
})

function login() {
    //暂时未做，以后出现token失效的情况再做登陆功能
}

async function checkLoginInfo() {
    const res = await axiosInstance.get('/logInfo');
    console.log('checkRYLoginInfo：', res.status)
    if (res.status != 200 || !res?.data?.member?.loginName) {
        login(); //如果查询状态为未登录，则说明上面的RYToken失效了，需要重新登陆并改变token
        return false;
    } else {
        return true;
    }
}

async function getCat(parentId) {
    var cats = []
    const res = await axiosInstance.get('/cats', {
        params: { docLibId: 0, parentId: parentId },
    })
    // console.log('get cats: ', res);
    if (res.status == 200) {
        var data = res.data;
        for (let i = 0; i < data.length; i++) { //取到cat分类信息
            if (data[i].children) { //如果有child
                const children = await getCat(data[i].id); //则遍历循环取
                data[i].catsContent = children;
            } else {//如果没有child
                data[i].catsContent = [];
            }
        }
        cats = data;
    } else { //如果api/cats接口报错，则直接返回空
        cats = [];
    }
    return cats;
}

async function getAllCat() {
    var catList = [
        {
            "uuid": "1239-0",
            "id": 1239,
            "name": "中国音乐词典分类",
            "docLibId": 0,
            "catTypeCode": "CTCAT",
            "sequence": null
        },
        {
            "uuid": "4439-0",
            "id": 4439,
            "name": "百科分类",
            "docLibId": 0,
            "catTypeCode": "BK_CAT",
            "sequence": null
        }
    ];

    for (let item of catList) {
        const children = await getCat(item.uuid);
        item.catsContent = children;
    }
    // console.log('catList: ', catList);
    return catList;
}

function exchangeTreeData(list, parentId, isRoot) {
    var treeData = [];
    for (let item of list) {
        let node = {
            id: item.id,
            key: (isRoot) ? (item.uuid) : (item.id),
            pId: parentId,
            value: (isRoot) ? (item.name) : (item.text),//(isRoot) ? (item.uuid) : (item.id),
            title: (isRoot) ? (item.name) : (item.text),
            isLeaf: false,
        }
        if (item.catsContent.length > 0) {
            treeData.push(node);
            const nodes = exchangeTreeData(item.catsContent, item.id, false);
            treeData = [...treeData, ...nodes];
        } else {
            node.isLeaf = true;
            treeData.push(node);
        }
    }
    return treeData;
}

async function getCatsInJson() {
    // const res = await fetch('http://localhost:8000/rmyy/cats.json');
    const res = await fetch(baseUrl + '/rmyy/cats_new.json');
    // console.log(res);
    const json = await res.json();
    // console.log(json)
    return json;
}

async function getDocsList(idList, searchText = '', page = 0) {
    // console.log(idList, searchText);
    if (!(idList instanceof Array)) {
        console.log('Id list 参数错误');
        return [];
    }
    let url = '/search?channelId=0&page=' + String(page) + '&t=0';
    for (let id of idList) {
        url += '&cats=' + String(id);
    }

    if (searchText != '') {
        url += '&q=' + searchText;
    }

    const res = await axiosInstance.get(url);
    if (res.status == 200) {
        console.log("test:", res.data);
        return res.data;
    }
    return [];
}

async function getDocsList2(idList, searchText = '', page = 1) {
    var topicstr = '';
    for (let id of idList) {
        topicstr += '_' + String(id);
    }
    const res = await axiosInstance2.get('/GetList', {
        params: {
            topicstr: topicstr,
            texttag: searchText,
            pageSize: 10,
            page: page,
        },
    })
    if (res.status == 200) {
        const data = res.data;
        // console.log('MongoDB Test： ', data);
        if (data?.code == 0) {
            return data;
        } else {
            return {};
        }
    }
}

async function getDocDetail(docId, docLibId) {
    let url = '/docs/' + String(docId) + '/getDetail?doclibid=' + String(docLibId);
    // console.log(docId, docLibId)
    const res = await axiosInstance.get(url);
    // console.log(res)
    if (res.status == 200) {
        return res.data;
    }
    return {};
}

async function getDocDetail2(docId, docLibId) {
    const res = await axiosInstance2.get('/GetDoc', {
        params: {
            docId: docId,
            doclibId: docLibId
        },
    })
    if (res.status == 200 && res?.data?.code == 0) {
        return res.data.data;
    }
    return {};
}

export default {
    namespace: 'musicDict',
    state: {
        catsList: [], //原始的cats信息
        catsTreeData: [], //转换过后的treeData信息
        currentDocsList: {},
        docDetail: {},
    },
    subscriptions: {
        setupHistory({ dispatch, history }) {
            return history.listen(({ pathname, state }) => {
                if (pathname === '/study/musicDict') {
                    dispatch({ type: 'queryMusicDict' });
                    return;
                }
            });
        },
    },
    effects: {
        * queryMusicDict({ _ }, { put, call, select }) {
            // const status = yield call(checkLoginInfo)//只是做个验证输出，启用新服务后，即不需要验证登陆状态了
            // console.log(status);
            // if (status) {
            //     //查询分类列表cats
            //     // const cats = yield call(getAllCat);
            //     // const treeData = exchangeTreeData(cats, 0, true);
            //     // console.log(treeData);
            const catsJson = yield call(getCatsInJson);
            yield put({ type: 'updateState', payload: { catsList: catsJson.cats, catsTreeData: catsJson.treeData } });

            //查询默认显示列表
            const docs = yield call(getDocsList2, []);
            // console.log(docs);
            yield put({ type: 'updateState', payload: { currentDocsList: docs } });
            // }
        },
        * queryDocsById({ payload }, { put, call }) {
            // console.log(payload);// payload: [] idList
            const docs = yield call(getDocsList2, payload.idList, payload.searchText);
            yield put({ type: 'updateState', payload: { currentDocsList: docs } });
        },
        * queryDocsByPage({ payload }, { put, call }) {
            const docs = yield call(getDocsList2, payload.idList, payload.searchText, payload.page);
            yield put({ type: 'updateState', payload: { currentDocsList: docs } });
        },
        * queryDocsByText({ payload, callback }, { put, call }) {
            // console.log(payload)
            const docs = yield call(getDocsList2, payload.idList, payload.searchText);
            yield put({ type: 'updateState', payload: { currentDocsList: docs } });
            if (callback) {
                callback(docs);
            }
        },
        * queryDocDetail({ payload, callback }, { put, call }) {
            // console.log(payload)
            const detail = yield call(getDocDetail2, payload.docId, payload.docLibId);
            yield put({ type: 'updateState', payload: { docDetail: detail } });
            callback(detail);
        },
    },
    reducers: {
        updateState(state, action) {
            return { ...state, ...action.payload };
        },
    },
}