import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { Modal, Image } from 'antd'


const CommitModal = (props, ref) => {
    const { onComfirm } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [previewImg, setPreviewImg] = useState("");
    const openModal = () => {
        setIsOpen(true);
    }

    const closeModal = () => {
        setIsOpen(false);
    }

    const setImagePreview = (image) => {
        setPreviewImg(image);
    }

    const okModal = () => {
        onComfirm();
        closeModal();
    }

    useImperativeHandle(
        ref,
        () => ({
            openModal,
            setImagePreview
        }),
        //   [third],
    )

    return <Modal
        title="上传练习结果"
        open={isOpen}
        onOk={okModal}
        onCancel={closeModal}
    >
        <p>确定提交练习结果？</p>
        {previewImg && previewImg!="" && <Image
            width={'19.2rem'}
            height={'10.8rem'}
            style={{
                alignContent: 'center'
            }}
            src={previewImg}
            alt={"曲谱练习结果"}
        />}
    </Modal>
}

export default forwardRef(CommitModal);
