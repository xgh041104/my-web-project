import { CloseOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons'
import React, { useEffect, useState } from 'react'


export default function MidiDeviceDetect() {
    const [status, setStatus] = useState({ code: 2, message: "MIDI设备正在检测中。。。" });

    const error = (error) => {
        console.log(`访问MIDI设备失败:${error.name}, ${error.message}`);
        setStatus({ code: 0, message: `访问MIDI设备失败:${error.name}, ${error.message}` })
    }
    const success = (midi) => {
        console.log('获取MIDI输入设备:', midi);
        if (midi.inputs.size === 0) {
            setStatus({ code: 0, message: `没有MIDI输入设备` })
            return;
        }
        setStatus({ code: 1, message: `获取MIDI输入设备:${midi.inputs.values[0]}` })
    }

    useEffect(() => {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess()
                .then(success)
                .catch(error)
        }
        else {
            error({ message: '不支持访问用户媒体' });
        }
    }, [])

    const statutsList = [
        <CloseOutlined style={{ color: 'red' }} />,
        <CheckOutlined style={{ color: 'green' }} />,
        <LoadingOutlined style={{ color: 'blue' }} />
    ]

    return <span>{statutsList[status.code]}{status.message}</span>
}