import React from 'react';
import { List, Breadcrumb} from 'antd';
import { Link } from 'umi';
import { connect } from 'dva';
import NoticeCard from './noticecard';


const NoticePage = ({ loading, dispatch, noticeModel }) => {
    const data = noticeModel.noticeList;
    return <div style={{ left: 0, right: 0, margin: "auto", width: "80%" }}>
        {/* <Breadcrumb>
            <Breadcrumb.Item>
                <Link to='/homePage'>首页</Link>   
            </Breadcrumb.Item>
            <Breadcrumb.Item>
                <Link to='/notice/noticepage'>通知公告</Link>
            </Breadcrumb.Item>
        </Breadcrumb> */}

        <List
            grid={{
                gutter: 10,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 2,
                xl: 2,
                xxl: 2,
            }}
            pagination={{defaultCurrent:1, defaultPageSize:4}}
            dataSource={data}
            renderItem={(item, index) => (
                <List.Item>
                    <NoticeCard itemData={item} />
                </List.Item>
            )}
        >

        </List>
    </div >
}

export default connect(({ loading, dispatch, noticeModel }) => ({ loading, dispatch, noticeModel }))(NoticePage);