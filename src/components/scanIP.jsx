import React, {useEffect, useState} from 'react';
import {MinusOutlined, PoweroffOutlined} from '@ant-design/icons';
import {Button, Flex, Progress} from 'antd';
import axios from "axios";


const ScanIP = () => {

    const [loadings, setLoadings] = useState(false);
    const [firstProgress, setFirstProgress] = useState(0);
    const [secondProgress, setSecondProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('active');
    const [isDisabled, setIsDisabled] = useState(false);

    const enterLoading = () => {

        setLoadings((prevLoadings) => {
            let newLoadings = prevLoadings;
            newLoadings = true;
            return newLoadings;
        });
        const checkProgress = () => {
            setSecondProgress((prevPercent) => {
                // console.log(prevPercent);
                if (prevPercent === 100) {
                    setLoadings((prevLoadings) => {
                        let newLoadings = prevLoadings;
                        newLoadings = false;
                        return newLoadings;
                    });
                } else {
                    setTimeout(checkProgress, 100);
                }
                return prevPercent;
            });

        };

        checkProgress();
    };

    const scanIP = async () => {
        try {
            setIsDisabled(true);
            const response = await axios.post('http://172.20.26.212:3333/scanIP');
            const data = response.data;
            console.log(data);
            setIsDisabled(true);

        } catch (error) {
            console.error('Error:', error);
        }
    };

    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [inputMessage, setInputMessage] = useState('');

    useEffect(() => {
        const newSocket = new WebSocket('ws://172.20.26.212:8080'); // WebSocket地址

        newSocket.onopen = () => {
            console.log('ws连接已建立');
        };

        newSocket.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            setMessage(receivedMessage);
            if (receivedMessage.firstProgress && receivedMessage.firstProgress) {
                setFirstProgress(parseInt(receivedMessage.firstProgress));
                setSecondProgress(parseInt(receivedMessage.secondProgress));
                if (receivedMessage.firstProgress === 100 && receivedMessage.secondProgress === 100) {
                    setLoadings((prevLoadings) => {
                        let newLoadings = prevLoadings;
                        newLoadings = false;
                        return newLoadings;
                    });
                    setProgressStatus('success');
                }
                if ((receivedMessage.firstProgress > 0 && receivedMessage.firstProgress < 100) || (receivedMessage.secondProgress > 0 && receivedMessage.secondProgress < 100)) {
                    setProgressStatus('active');
                    setLoadings((prevLoadings) => {
                        let newLoadings = prevLoadings;
                        newLoadings = true;
                        return newLoadings;
                    });

                }
            }
        };

        newSocket.onclose = () => {
            console.log('ws连接已关闭');
        };

        newSocket.onerror = (error) => {
            console.log('ws错误:', error);
        };

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, [])

    const sendMessage = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(inputMessage);
            setInputMessage('');
            console.log('已发送消息:', inputMessage);
        } else {
            console.log('无法发送消息');
        }
    };

    return (
        <>
            <Flex gap="small" vertical>
                <Button
                    type="primary"
                    icon={<PoweroffOutlined/>}
                    loading={loadings}
                    // disabled={isDisabled}
                    onClick={() => {
                        // setFirstProgress(0);
                        // setSecondProgress(0)
                        enterLoading();
                        scanIP();
                    }}

                >
                    扫描IP
                </Button>
                <Progress percent={firstProgress} type="line" status={progressStatus}/>
                <Progress percent={secondProgress} type="line" status={progressStatus}/>
            </Flex>


        </>);
}

export default ScanIP;