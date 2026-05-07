import React from 'react';
import { ProTable, ModalForm, ProFormText, ProFormGroup, ProFormSelect } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';
import { connect } from 'dva';


//TODO:新建、编辑教师用户的都待做
const AddModal = (dispatch, teacherManage) => {
  const schoolEnum = {};
  teacherManage.schoolList?.forEach((item) => {
    schoolEnum[item.Id] = item.SchoolName;
  });
  return (
    <ModalForm
      title="新建教师"
      width={'35vw'}
      trigger={<Button icon={<PlusOutlined />} type='primary'>新建</Button>}
      modalProps={{ destroyOnClose: true, }}
      onFinish={(values) => {
        const data = {
          SchoolId: 4,
          TeacherAccount: values.teacherAccount,
          TeacherPassword: '123456',
          TeacherName: values.teacherName,
          Sex: Number(values.sex),
          PhoneNumber: values.phoneNumber,
          Email: values.email,
          TeacherTitle: values.teacherTitle,
        }
        dispatch({ type: 'teacherManage/addTeacher', payload: data });
        return true;
      }}
    >
      <ProFormText
        width="md" name="teacherName" label="姓名" placeholder="请输入姓名" rules={[{ required: true, message: '请填写' }]}
      />
      <ProFormText
        width="md" name="teacherAccount" label="账户名" placeholder="请输入账户名" rules={[{ required: true, message: '请填写' }]}
      />
      <ProFormText
        width="md" name="teacherTitle" label="职称" placeholder="请输入职称"
      />
      <ProFormSelect
        width='sm' name='sex' label='性别'
        valueEnum={{
          1: '男',
          0: '女',
        }}
      />
      <ProFormText
        width="sm" name="email" label="邮箱" placeholder="请输入邮箱"
      />
      <ProFormText
        width="sm" name="phoneNumber" label="电话" placeholder="请输入电话"
      />

    </ModalForm>
  )
};

const EditPwdModal = (dispatch, record) => {
  return (
    <ModalForm
      key='editpwd'
      title="修改老师密码"
      trigger={<Button type='link'>修改密码</Button>}
      modalProps={{ destroyOnClose: true, }}
      width={'35vw'}
      onFinish={(values) => {
        const data = {
          TeacherId: record.TeacherId,
          TeacherPassword: values.password,
        }
        dispatch({ type: 'teacherManage/editPassword', payload: data });
        return true;
      }}
      initialValues={{
        teacherName: record.TeacherName
      }}
    >
      <ProFormText
        width="md" name="teacherName" label="老师姓名" readonly
      />
      <ProFormText
        width="md" name="password" label="新密码" placeholder="请输入新密码" rules={[{ required: true, message: '请填写' }]}
      />

    </ModalForm>
  )
};

const EditModal = (dispatch, teacherManage, Id) => {
  const schoolEnum = {};
  teacherManage.schoolList?.forEach((item) => {
    schoolEnum[item.Id] = item.SchoolName;
  });
  const initData = teacherManage.teacherList?.filter((item) => {
    return (item.TeacherId == Id);
  })[0];
  return (
    initData && <ModalForm
      key='edit'
      title="编辑教师信息"
      trigger={<Button type='link'>编辑</Button>}
      width={'35vw'}
      modalProps={{ destroyOnClose: true, }}
      onFinish={(values) => {
        const data = {
          SchoolId: 4,
          TeacherId: Id,
          TeacherName: values.teacherName,
          Sex: Number(values.sex),
          PhoneNumber: values.phoneNumber,
          Email: values.email,
          TeacherTitle: values.teacherTitle,
        }
        dispatch({ type: 'teacherManage/editTeacherInfo', payload: data });
        return true;
      }}
      initialValues={{
        teacherName: initData.TeacherName,
        teacherAccount: initData.TeacherAccount,
        schoolName: String(initData.SchoolId),
        teacherTitle: initData.TeacherTitle,
        sex: String(initData.Sex),
        email: initData.Email,
        phoneNumber: initData.PhoneNumber
      }}
    >
      <ProFormText
        width="md" name="teacherName" label="姓名" placeholder="请输入姓名" rules={[{ required: true, message: '请填写' }]}
      />
      <ProFormText readonly
        width="md" name="teacherAccount" label="账户名" placeholder="请输入账户名" rules={[{ required: true, message: '请填写' }]}
      />
      {/* <ProFormSelect readonly
          width='md' name='schoolName' label='所属学校' rules={[{ required: true, message: '请填写' }]}
          valueEnum={schoolEnum}
        /> */}
      <ProFormText
        width="md" name="teacherTitle" label="职称" placeholder="请输入职称"
      />
      <ProFormSelect
        width='sm' name='sex' label='性别'
        valueEnum={{
          1: '男',
          0: '女',
        }}
      />
      <ProFormText
        width="sm" name="email" label="邮箱" placeholder="请输入邮箱"
      />
      <ProFormText
        width="sm" name="phoneNumber" label="电话" placeholder="请输入电话"
      />

    </ModalForm>
  )
};

@connect(({ dispatch, teacherManage, user }) => ({ dispatch, teacherManage, adminSchoolId: user.adminSchoolId }))
export default class TeacherList extends React.Component {
  constructor(props) {
    super(props)
    this.tableRef = React.createRef();
  }

  componentDidUpdate() {
    this.tableRef.current?.reload();
  }

  render() {
    const data = this.props.teacherManage.teacherList;
    return (
      <ProTable
        actionRef={this.tableRef}
        headerTitle="教师用户列表"
        rowKey='TeacherId'
        cardBordered
        pagination={{
          defaultPageSize: 10,
          showQuickJumper: true,
        }}
        // defaultData={data}
        columns={[
          {
            title: '教师ID',
            dataIndex: 'TeacherId',
            sorter: (a, b) => a.TeacherId - b.TeacherId,
            search: false,
            align: 'center',
          },
          {
            title: '账户名',
            dataIndex: 'TeacherAccount',
            align: 'center',
          },
          {
            title: '姓名',
            dataIndex: 'TeacherName',
            align: 'center',
          },
          // {
          //   title: '所属学校',
          //   dataIndex: 'SchoolName',
          //   align: 'center',
          // },
          {
            title: '性别',
            dataIndex: 'sex',
            search: false,
            align: 'center',
          },
          {
            title: '电话',
            dataIndex: 'PhoneNumber',
            search: false,
            align: 'center',
          },
          {
            title: '邮箱',
            dataIndex: 'Email',
            search: false,
            align: 'center',
          },
          {
            title: '备注',
            dataIndex: 'TeacherTitle',
            search: false,
            align: 'center',
          },
          {
            title: '操作',
            align: 'center',
            width: '2.5rem',
            render: (text, record, _, action) => [
              EditModal(this.props.dispatch, this.props.teacherManage, record.TeacherId),
              EditPwdModal(this.props.dispatch, record),
              <Popconfirm
                title="删除该项"
                description="是否确认删除该项？"
                onConfirm={() => {
                  this.props.dispatch({ type: "teacherManage/deleteTeacher", payload: { TeacherId: record.TeacherId } });
                }}
                onCancel={() => { message.error("取消删除") }}
                okText="删除"
                cancelText="取消"
                key="2"
              >
                <Button key={"del"} type='link' danger>删除</Button>
              </Popconfirm>
            ],
            search: false,
            align: 'center',
          },
        ]}
        toolBarRender={() => [
          AddModal(this.props.dispatch, this.props.teacherManage),
        ]}
        request={(params, sort, filter) => {
          return Promise.resolve({
            data: () => {
              return data?.filter((item) => {
                let result = true;
                if (params.TeacherAccount) {
                  result = (result && item.TeacherAccount.indexOf(params.TeacherAccount) != -1);
                }
                if (params.TeacherName) {
                  result = (result && item.TeacherName.indexOf(params.TeacherName) != -1);
                }
                if (params.SchoolName) {
                  result = (result && item.SchoolName == params.TeacherAccount);
                }
                if (this.props.adminSchoolId && this.props.adminSchoolId > 0) {
                  result = (result && item.SchoolId === this.props.adminSchoolId)
                }
                return result;
              });
            },
            success: true,
          })
        }}
      />
    )
  }
}