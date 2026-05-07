import { Select, Spin, Row, Col } from 'antd'
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { selecterContent } from './instruments'


export default forwardRef((props, ref) => {

    const [loadings, setLoadings] = useState(props.partInfo?.map(({ loading }) => loading))

    const setLoading = (index, isLoading) => {
        let newLoadings = [...loadings];
        newLoadings[index] = isLoading;
        setLoadings(newLoadings);
    }

    const handelChange = (partId, value) => {
        setLoading(partId, true)
        let id = -1;
        for (let [index, item] of selecterContent.entries()) {
            if (item.value == value) {
                id = index;
                break;
            }
        }
        if (id >= 0) {
            props.onChanged(partId, id, value);
        }
    }

    useImperativeHandle(
        ref,
        () => ({
            setLoading
        }),
    )


    return <div style={{ position: 'absolute', top: "66px", left: "0px", zIndex: "99" }}>
        <p>声部音色：</p>
        {
            props.partInfo?.map((item, index) => {

                if (!item || !selecterContent[item.instrumentId] || !selecterContent[item.instrumentId].value) {
                    console.warn("未知的instrument id", item);
                    return <p>声部1: 钢琴</p>;
                }



                return <Row key={index} style={{ width: 300 }} align='middle'>
                    <Col span={4} >
                        声部{index + 1}：
                    </Col>
                    <Col span={20}>
                        <Spin spinning={loadings[index]||false}>
                            <Select style={{ minWidth: 230 }}
                                defaultValue={selecterContent[item.instrumentId].value}
                                // style={{ width: 200, }}
                                options={selecterContent}
                                onChange={value => handelChange(index, value)}
                                // loading={loadings[index]}
                            />
                        </Spin>
                    </Col>
                </Row>
            })
        }
    </div>
})
