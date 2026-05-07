import React, { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col } from 'antd';
import { connect } from 'umi';
import ReactHlsPlayer from 'react-hls-player'
import { getFilePrefix } from 'config';

const YouModel = ({ resourceClassify, resourceList, userInfo, dispatch, isSecondLevel = false }) => {
    const [resourceFilePath, setResourceFilePath] = useState('')//文件地址
    const [activeKey, setActiveKey] = useState('');//当前选中的tab
    const [secondData, setSecondData] = useState([]);//二级tab数据
    const [secondActiveKey, setSecondActiveKey] = useState('');
    const resourceData = resourceClassify[1]?.children.map(item => ({ key: item.resourceCategoryId, label: item.resourceCategoryName }))//资源重新格式化

    //挂载的时候选则第一个tab，并获取资源列表
    useEffect(() => {
        if (resourceClassify.length > 0) {
            if (isSecondLevel) {
                setSecondData([])//如果有二级菜单，则二级菜单数据赋值
            }
            setActiveKey(resourceClassify[1]?.children[0]?.resourceCategoryId)
            //根据资源分类id获取资源列表
            dispatch({
                type: 'instruTeach/fetchResourceList',
                payload: { resourceCategoryId: resourceClassify[1].children[0].resourceCategoryId }
            });
        }
    }, [])

    //当资源列表改变的时候，获取第一个资源
    useEffect(() => {
        if (resourceList.length > 0) {
            setResourceFilePath(resourceList[0].resourceFilePath)
        } else {
            setResourceFilePath('')
        }
    }, [resourceList])

    //顶部一级菜单
    const onChange = (key) => {
        setActiveKey(key);
        setSecondData([])//二级菜单赋值
        //根据资源分类id获取资源列表
        dispatch({
            type: 'instruTeach/fetchResourceList',
            payload: {
                resourceCategoryId: key,
            }
        })
    };
    //二级菜单
    const onSecondChange = (key) => {
        setSecondActiveKey(key);
        //根据资源分类id获取资源列表
        dispatch({
            type: 'instruTeach/fetchResourceList',
            payload: {
                resourceCategoryId: key,
            }
        })
    }

    return <>
        <Col span={22} offset={1} style={{ marginTop: '6vh' }}>
            <h1 style={{ textAlign: 'center' }}>这里显示一级目录</h1>
            {isSecondLevel && <h1 style={{ textAlign: 'center' }}>这里显示二级目录</h1>}
            {/* <Tabs className='tab' onChange={onChange} items={resourceData} activeKey={activeKey} style={{ fontSize: '.2rem' }}/>
            {isSecondLevel && <Tabs items={secondData} className='tab' onChange={onSecondChange} activeKey={secondActiveKey} style={{ fontSize: '.2rem' }} /> }*/}
            <br />
            <Row>
                <Col span={17} >
                    <Card style={{
                        height: '70vh', overflow: 'auto', borderRadius: '.2rem', textAlign: 'center',
                        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.5), 0 6px 20px 0 rgba(0, 0, 0, 0.5);'
                    }}>
                        <h1>这里显示内容</h1>
                    </Card>
                </Col>
                <Col span={6} offset={1}>
                    <Card style={{
                        height: '70vh', overflow: 'auto', borderRadius: '.2rem',
                        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);'
                    }}>
                        <h1>这里显示资源列表</h1>
                        {resourceList.map(item => <Card.Grid style={{
                            width: '100%',
                            textAlign: 'center',
                            cursor: 'pointer',
                            borderRadius: '.2rem',
                            backgroundColor: item.resourceFilePath === resourceFilePath ? '#3ADF9C' : '#fff',
                        }}
                            key={"instruTeach" + item.resourceId}
                            onClick={() => { setResourceFilePath(item.resourceFilePath) }}
                        >
                            {/* <h1 style={{ color: item.resourceFilePath === resourceFilePath ? '#fff' : 'black', fontSize: '.3rem' }}>{item.resourceName}</h1> */}
                        </Card.Grid>)}
                    </Card></Col>
            </Row>
        </Col>
    </>
}

export default connect(({ example }) => ({
    resourceClassify: example.resourceClassify,
    resourceList: example.resourceList,
}))(YouModel)