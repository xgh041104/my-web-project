import { Empty, Button } from "antd"
import { history } from "umi"

const UnloginEmpty = () => {
    return (
        <Empty
            description={
                <span>未登录状态，无法请求个人中心数据</span>
            }
        >
            <Button type='primary' onClick={()=>{history.push({pathname:("/login")})}}>去登录</Button>
        </Empty>
    )
}

export default UnloginEmpty;
