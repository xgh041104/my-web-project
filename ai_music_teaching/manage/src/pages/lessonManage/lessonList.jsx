import React, { } from 'react';
import { Avatar, Image, Button, Popconfirm, message, Modal } from 'antd';
import { ProTable, TableDropdown, ModalForm, ProFormSelect, ProFormGroup, ProFormText, ProFormDateRangePicker, ProFormSwitch, ProFormUploadButton } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { connect } from 'dva';
import { filePrefix } from 'urlList';
import LessonProgressView from './_LessonProgressView'


const AddModal = (dispatch, lessonManage) => {
  const collegeEnum = {};
  const majorEnum = {};
  lessonManage.collegeList.forEach((item) => {
    collegeEnum[item.Id] = item.CollegeName;
  });
  lessonManage.majorList.forEach((item) => {
    majorEnum[item.MajorId] = item.MajorName;
  });
  const handleValueChange = (newValues) => {
    if (newValues.status == true) {
      Modal.warn({
        content: <span>课程开启后无法编辑课程章节，需要关闭后才能编辑章节</span>
      })
    }
  }
  return (
    <ModalForm
      title="新建课程"
      trigger={<Button icon={<PlusOutlined />} type='primary'>新建</Button>}
      modalProps={{ destroyOnClose: true, }}
      onValuesChange={handleValueChange}
      onFinish={(values) => {
        console.log(values);
        const formData = {
          CourseName: values.lessonName,
          CourseCode: values.CourseCode,
          CollegeId: Number(values.collegeName),
          MajorId: Number(values.majorName),
          CourseStartTime: values.dateRange[0],
          CourseEndTime: values.dateRange[1],
          Status: values.status ? 1 : 0, //open close :true false
        }
        dispatch({ type: 'lessonManage/teacherAddLesson', payload: formData });
        return true;
      }}
    >
      <ProFormText
        width="md" name="lessonName" label="课程名称" placeholder="请输入课程名" rules={[{ required: true, message: '未填写' }]}
      />
      <ProFormText
        width="md" name="CourseCode" label="课程代码" placeholder="请输入课程代码"
      />
      <ProFormGroup>
        <ProFormSelect
          width="md" name="collegeName" label="所属学院" valueEnum={collegeEnum}
          onChange={(value) => {
            // console.log(value);
            dispatch({ type: 'lessonManage/queryMajorByCollegeId', payload: value });
          }}
        />
        <ProFormSelect
          width="md" name="majorName" label="所属专业" valueEnum={majorEnum}
        />
      </ProFormGroup>
      <ProFormGroup>
        <ProFormDateRangePicker rules={[{ required: true, message: '未选择' }]}
          name="dateRange" label="日期区间"
        />
        <ProFormSwitch rules={[{ required: true }]} initialValue={false}
          name="status" label="是否开启" checkedChildren="开启" unCheckedChildren="关闭"
        />
      </ProFormGroup>
    </ModalForm>
  )
}

@connect(({ dispatch, lessonManage, user }) => ({ dispatch, lessonManage, adminSchoolId: user.adminSchoolId }))
export default class LessonList extends React.Component {

  constructor(props) {
    super(props)
    this.tableRef = React.createRef();
    // this.progressViewRef = React.createRef();
    this.state = {
      removeModalOpen: false,
      crtLesson: null,
      isReceiveProps: true,
      currentPage: props.lessonManage.lessonListLastPage
    }
    // this.openRemoveModal = this.openRemovecrtLessonModal.bind(this);
    this.handleCopyRequest = this.handleCopyRequest.bind(this);
    this.handleRemoveRequest = this.handleRemoveRequest.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.lessonManage.lessonListLastPage != this.props.lessonManage.lessonListLastPage) {
      this.setState({ currentPage: this.state.currentPage });
    }
    this.tableRef.current?.reload();
  }
  componentWillUnmount() {
    this.props.dispatch({ type: 'lessonManage/updateState', payload: { lessonListLastPage: this.state.currentPage } });
  }

  openRemoveModal(lesson) {
    this.setState({ removeModalOpen: true, crtLesson: lesson });

  }
  handleCopyRequest() {
    this.props.dispatch({ type: "lessonManage/copyNewLesson", payload: { CourseId: this.state.crtLesson.Id } });

    console.log('handle lesson copy request');

    this.handleCancel()
  }
  handleRemoveRequest() {
    this.props.dispatch({ type: "lessonManage/deleteLesson", payload: { CourseId: this.state.crtLesson.Id } });
    console.log('handle lesson remove request');

    this.handleCancel()
  }

  handleCancel() {
    this.setState({ removeModalOpen: false, crtLesson: null });
  }


  render() {
    // console.log("render called");
    const collegeEnum = {};
    const majorEnum = {};
    const teacherEnum = {};
    const statusEnum = {};
    this.props.lessonManage.lessonList?.forEach((item) => {
      if (!collegeEnum[item.CollegeName]) {
        collegeEnum[item.CollegeName] = item.CollegeName;
      }
      if (!majorEnum[item.MajorName]) {
        majorEnum[item.MajorName] = item.MajorName;
      }
      if (!teacherEnum[item.TeacherName]) {
        teacherEnum[item.TeacherName] = item.TeacherName;
      }
      if (!statusEnum[item.Status]) {
        statusEnum[item.Status] = item.Status ? "打开" : "关闭";
      }
    });
    const highlightText = { fontWeight: 'bold', color: 'rgb(64,169,255)' }

    return <div>
      <Modal
        open={this.state.removeModalOpen}
        title="废除课程"
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" onClick={this.handleCancel}>
            取消
          </Button>,
          <Button key="copy" type="primary" onClick={this.handleCopyRequest}>
            复制
          </Button>,
          <Button key="del" type='danger' onClick={this.handleRemoveRequest}>
            删除
          </Button>,
        ]}
      >
        废除<span style={highlightText}>{this.state.crtLesson && this.state.crtLesson.CourseName || "此课程"}</span>后是否复制此课程信息生成新的课程？
      </Modal>
      {<ProTable actionRef={this.tableRef}
        rowKey='Id'
        // dataSource={this.props.lessonManage.lessonList} //默认数据，没有request也能显示
        pagination={{
          current: this.state.currentPage,
          onChange: (page) => {
            this.setState({ currentPage: page });
          },
          showQuickJumper: true,
          defaultPageSize: 10,
        }}
        search={{}} //展示搜索表单
        cardBordered //边框样式
        dateFormatter="string"
        headerTitle='课程列表'
        //表格字段定义，哪些字段需要筛选、筛选类型定义都在其中，action也可添加在此
        columns={[
          {
            title: 'ID',
            dataIndex: 'Id',
            sorter: (a, b) => a.Id - b.Id,
            search: false,
            align: 'center',
          },
          {
            title: "课程代码",
            dataIndex: "CourseCode",
            align: 'center',
          },
          {
            title: '课程名称',
            dataIndex: 'CourseName',
            align: 'center',
          },
          {
            title: '所属学院',
            dataIndex: 'CollegeName',
            align: 'center',
            filters: true,
            onFilter: true,
            valueEnum: collegeEnum,
          },
          {
            title: '所属专业',
            dataIndex: 'MajorName',
            align: 'center',
            filters: true,
            onFilter: true,
            valueEnum: majorEnum,
          },
          {
            title: '负责教师',
            dataIndex: 'TeacherName',
            align: 'center',
            filters: true,
            onFilter: true,
            valueEnum: teacherEnum,
          },
          {
            title: '开始时间',
            dataIndex: 'CourseStartTime',
            align: 'center',
            search: false,
          },
          {
            title: '结束时间',
            dataIndex: 'CourseEndTime',
            align: 'center',
            search: false,
          },
          {
            title: '状态',
            dataIndex: 'Status',
            align: 'center',
            filters: true,
            onFilter: true,
            valueEnum: statusEnum,
          },
          {
            title: '封面',
            dataIndex: 'FilePath',
            align: 'center',
            search: false,
            render: (_, record) => {
              let randomId = Math.random();
              const src = (record.FilePath) ? (filePrefix() + record.FilePath + "?random" + randomId) : ('');
              return <Image width='30px' style={{ background: 'transparent' }}
                src={src}
              />
            }
          },
          {
            key: "operator",
            title: '操作',
            align: 'center',
            width: '2.5rem',
            search: false,
            render: (text, record, _, action) => [
              <Button
                key='viewLesson'
                type='link'
                onClick={() => {
                  this.props.dispatch({
                    type: "lessonManage/queryCourseProgress",
                    payload: { CourseId: record.Id },
                    callback: data => {
                      Modal.info({
                        title: '课程学习进度',
                        content: (
                          <LessonProgressView lessonProgressData={data} />
                        ),
                        width: '80vw',
                      });
                    }
                  })
                  // history.push({ pathname: "/lessonManage/editlesson", state: { lessonId: record.Id } })
                  // this.progressViewRef.current?.viewProgress(record.Id)
                }}>
                查看进度
              </Button>,
              <Button
                key='1'
                type='link'
                onClick={() => {
                  history.push({ pathname: "/lessonManage/editlesson", state: { lessonId: record.Id } })
                }}>
                编辑课程
              </Button>,
              <Button
                key="2"
                type='link'
                onClick={() => {
                  history.push({ pathname: "/lessonManage/chapterList", state: { courseId: record.Id, courseName: record.CourseName, courseStatus: record.Status } })
                }}>
                编辑章节
              </Button>,
              // <Popconfirm
              //     title="删除该项"
              //     description="是否确认删除该项？"
              //     onConfirm={() => {
              //         this.props.dispatch({ type: "lessonManage/deleteLesson", payload: { CourseId: record.Id } });
              //     }}
              //     onCancel={() => { message.error("取消删除") }}
              //     okText="删除"
              //     cancelText="取消"
              //     key="3"
              // >
              //     <a href=""> 删除</a>
              // </Popconfirm>
              <Button key='reset' danger type='link' onClick={this.openRemoveModal.bind(this, record)}>废除</Button>,
            ],
          }
        ]}
        //数据筛选变化触发，params：搜索表单参数+分页参数；sort表头排序变动；filter表头筛选变动
        request={(params, sort, filter) => {
          return Promise.resolve({
            data: () => {
              return this.props.lessonManage.lessonList?.filter((item) => {
                let result = true;
                if (params.CourseName) {
                  result = (result && item.CourseName.indexOf(params.CourseName) != -1)
                }
                if (params.CourseCode) {
                  result = (result && item.CourseCode.indexOf(params.CourseCode) != -1)
                }
                if (params.CollegeName) {
                  result = (result && item.CollegeName == params.CollegeName)
                }
                if (params.MajorName) {
                  result = (result && item.MajorName == params.MajorName)
                }
                if (params.TeacherName) {
                  result = (result && item.TeacherName == params.TeacherName)
                }
                if (params.Status) {
                  result = (result && item.Status == params.Status)
                }
                if (this.props.adminSchoolId && this.props.adminSchoolId > 0) {
                  result = (result && item.SchoolId == this.props.adminSchoolId)
                }
                return result;

              });
            },
            success: true,
          });
        }}
        toolBarRender={() => [
          AddModal(this.props.dispatch, this.props.lessonManage),  //新建按钮及modal弹窗
        ]}
      >
      </ProTable>
      }
    </div>
  }
}