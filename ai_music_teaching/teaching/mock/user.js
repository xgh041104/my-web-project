'use strict';
import api from '../src/services/api';

const users =
{
    UserName: "dbq",
    UserPwd: "123"
}


const { loginUser } = api;


export default {
    // [loginUser](req, res) {
    [loginUser](req, res) {
        // console.log("get req", req);
        if (req.body.UserName !== users.UserName
            || req.body.UserPwd !== users.UserPwd) {
            res.json({
                code: 0,
                data: "",
                msg: "用户名dbq密码123"
            })
            return;
        }

        res.json({
            code: 1,
            data: {
                "Id": 1,
                "UserName": "dbq",
                "UserPwd": "202cb962ac59075b964b07152d234b70"
            },
            msg: "成功"
        })
    },
}