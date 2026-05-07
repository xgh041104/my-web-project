import React from 'react'
// 引入编辑器组件
import BraftEditor from 'braft-editor'
// 引入编辑器样式
import 'braft-editor/dist/index.css'

export default class EditorDemo extends React.Component {

    state = {
        // 创建一个空的editorState作为初始值
        // this.props.content接收父组件的值，渲染富文本
        editorState: BraftEditor.createEditorState(this.props.content ?? null)
    }

    handleEditorChange = (editorState) => {
    	// 更新编辑器的状态
        this.setState({ editorState })
        
        // 判断输入的内容，如果有内容，设置输入的内容；如果没有内容，设置为空字符串 ''
	    if (!editorState.isEmpty()) { // 如此判断的原因，因为即使是没有内容 editorState.toHTML() 是一对空标签，不能直接给表单使用。
	      // 可直接调用editorState.toHtml()来获取HTML格式的内容
	      const content = editorState.toHTML()
	      // 调用父组件的函数，将编辑器输入的内容传递回去
	      this.props.setDetails(content)
	    } else {
	      // 调用父组件的函数，没有内容设置成空字符串 ''
	      this.props.setDetails('')
	    }
    }

    render () {
        const { editorState } = this.state
        return (
            <div className="my-component">
                <BraftEditor
                    contentStyle={{height:305}}
                    value={editorState}
                    onChange={this.handleEditorChange}
                    excludeControls={['fullscreen']}  
                />
            </div>
        )
    }

}
