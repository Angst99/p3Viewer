import React, {forwardRef, useEffect, useRef, useState} from "react";
import {Button, Form, Cascader, Space, Card, Progress, message, AutoComplete, Flex} from 'antd';
import {convertJsonFormat2, loadDataByPost} from "../searchIP.js";
import axios from "axios";

const LogOutputComponent = forwardRef((props, ref) => {
    const [output, setOutput] = useState('');

    const logOutput = (content) => {
        setOutput(prevOutput => prevOutput + `<p>${content}</p>`);
    };

    const clearOutput = () => {
        setOutput('');
    };

    useEffect(() => {
        if (ref && ref.current) {
            ref.current.logOutput = logOutput;
            ref.current.clearOutput = clearOutput;
        }
    }, [ref, logOutput, clearOutput]);

    return (
        <div ref={ref}>
            <div dangerouslySetInnerHTML={{__html: output}}/>
        </div>
    );
});


const Vent = () => {

    const logComponentRef = useRef(null);
    const [messageApi, contextHolder] = message.useMessage();


    const callLogOutput = (content) => {
        let currentDate = new Date();
        let year = currentDate.getFullYear();
        let month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        let day = currentDate.getDate().toString().padStart(2, '0');
        let hours = currentDate.getHours().toString().padStart(2, '0');
        let minutes = currentDate.getMinutes().toString().padStart(2, '0');
        let seconds = currentDate.getSeconds().toString().padStart(2, '0');
        let customTimeString = `${hours}:${minutes}:${seconds}`;
        console.log(customTimeString);
        if (logComponentRef.current) {
            logComponentRef.current.logOutput(customTimeString + ' ' + content);
        }
    };

    const clearLogOutput = () => {
        if (logComponentRef.current) {
            logComponentRef.current.clearOutput();
        }
    };

    const [options, setOptions] = useState([
        {
            label: 'A排',
            value: 'rowA',
            children: [],
        },
        {
            label: 'B排',
            value: 'rowB',
            children: [],
        },
        {
            label: 'C排',
            value: 'rowC',
            children: [],
        },
        {
            label: 'D排',
            value: 'rowD',
            children: [],
        },
        {
            label: 'E排',
            value: 'rowE',
            children: [],
        },
        {
            label: 'F排',
            value: 'rowF',
            children: [],
        },
    ]);

    const pushData = (rowNames) => {
        if (options.find(item => item.value === 'rowA').children.length !== 0) {
            return;
        }
        let updatedItems = [...options];
        for (const rowName of rowNames) {
            let children = convertJsonFormat2(rowName);
            let targetObjectIndex = updatedItems.findIndex(item => item.value === rowName);

            if (targetObjectIndex !== -1) {
                let updatedObject = {
                    ...updatedItems[targetObjectIndex],
                    children: [...updatedItems[targetObjectIndex].children, ...children]
                };
                updatedItems[targetObjectIndex] = updatedObject;
            }
        }
        console.log(updatedItems);
        setOptions(updatedItems);
    };


    const [loadings, setLoadings] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('active');

    const enterLoading = () => {

        setLoadings((prevLoadings) => {
            let newLoadings = prevLoadings;
            newLoadings = true;
            return newLoadings;
        });
        const checkProgress = () => {
            setProgress((prevPercent) => {
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

    let selectedOptions = {
        rowA: [],
        rowB: [],
        rowC: [],
        rowD: [],
        rowE: [],
        rowF: [],
    };

    const handleChange = (value) => {
        selectedOptions = {
            rowA: [],
            rowB: [],
            rowC: [],
            rowD: [],
            rowE: [],
            rowF: [],
        };
        value.forEach((row) => {
            if (row.length === 1) {
                options.forEach((item) => {
                    if (item.value === row[0]) {
                        selectedOptions[item.value] = item.children.map(child => ({
                            device_id: child.value,
                            ip: child.ip
                        }));
                    }
                });
            } else if (row.length === 2) {
                const parentValue = row[0];
                const childValue = row[1];
                const parentOption = options.find(option => option.value === parentValue);
                const childOption = parentOption.children.find(child => child.value === childValue);
                if (childOption) {
                    if (selectedOptions[parentValue]) {
                        selectedOptions[parentValue].push({
                            device_id: childOption.value,
                            ip: childOption.ip
                        });
                    }
                }
            }
        })

        const orderedSelectedOptions = {
            rowA: [],
            rowB: [],
            rowC: [],
            rowD: [],
            rowE: [],
            rowF: [],
        };

        options.forEach(option => {
            Object.keys(selectedOptions).forEach(key => {
                if (key === option.value) {
                    option.children.forEach(child => {
                        selectedOptions[option.value].forEach(item => {
                            if (item.device_id === child.value) {
                                orderedSelectedOptions[option.value].push({
                                    device_id: child.value,
                                    ip: child.ip
                                });
                            }
                        })

                    })
                }
            });

        });
        selectedOptions = orderedSelectedOptions;
        // console.log(`selected ${JSON.stringify(value)}`);
        console.log(`${JSON.stringify(selectedOptions)}`);
    };


    async function vent(selectedOptions) {

        let array = [];
        Object.keys(selectedOptions).forEach(key => {

            selectedOptions[key].forEach((item) => {
                if (item.ip) {
                    array.push(item.ip);
                }
            })
        })
        console.log(selectedOptions);
        console.log(array);
        let map = new Map();

        async function get_vent(ip, device_id) {
            try {

                const openTime = '30';//通气时间 秒
                const printer_vent_url = 'http://' + ip + ':5000/serial_ctl/xyz/I%209%20' + openTime;

                const status_response = await axios.get('http://' + ip + ':5000/status_json', {
                    timeout: 2000
                });
                // console.log(status_response);
                if (status_response !== null && status_response.data.status === 'printing') {
                    callLogOutput(ip + device_id + '正在打印，跳过')
                    return;
                }
                callLogOutput(device_id + '正在通气...');

                const printer_vent_response = await axios.get(printer_vent_url, {});
                // console.log('printer_vent_response:', printer_vent_response.data);
                if (printer_vent_response.data === 'info_rec OpenTime=' + parseFloat(openTime).toFixed(6).toString()) {
                    console.log(device_id, '通气成功')
                    messageApi.open({
                        type: 'success',
                        content: device_id + '通气成功',
                        duration: 3,

                    });
                    callLogOutput(device_id + '通气成功')
                } else {
                    console.log(device_id, '失败')
                    messageApi.open({
                        type: 'error',
                        content: device_id + '通气失败',
                        duration: 3,

                    });
                    callLogOutput(device_id + '失败')

                }
            } catch (error) {
                console.error('Error fetching printer vent:', ip, error);
                callLogOutput(device_id + '失败' + error)
            }
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }


        for (const ip of array) {
            try {
                const printer_info_url = 'http://' + ip + ':5000/get_printer_information/';
                const printer_info_response = await axios.get(printer_info_url, {
                    timeout: 500
                });

                // 如果返回的数据已经是对象
                if (typeof printer_info_response.data === 'object') {
                    const printerInfoRoot = printer_info_response.data;
                    // console.log('printerInfoRoot', printerInfoRoot);
                    if (printerInfoRoot && printerInfoRoot.device_id) {
                        const device_id = printerInfoRoot.device_id;
                        console.log('ip', ip, ' ', '名称:', device_id);
                        callLogOutput('ip' + ' ' + ip + ' ' + '名称:' + device_id)
                        map.set(ip, device_id);
                    }
                }
            } catch (error) {
                console.error('获取打印机ip失败:', ip, error);
                callLogOutput('获取打印机ip失败:' + ip);
            }

        }
        let totalItems = map.size;
        let processedItems = 0;
        let progress = 0;
        setProgress(progress);
        setProgressStatus('active');

        if(totalItems === 0){
            setProgress(100);
            return;
        }

        for (const [ip, device_id] of map) {
            console.log('ip, device_id');
            await get_vent(ip, device_id);
            await sleep(500);
            processedItems++;
            progress = Math.round((processedItems / totalItems) * 100);
            setProgress(progress);
        }
        if (processedItems >= totalItems) {
            setProgressStatus('success');
        }
    }


    const handleStart = () => {
        vent(selectedOptions);

    };


    useEffect(() => {

        loadDataByPost().then(() => {
            pushData(['rowA', 'rowB', 'rowC', 'rowD', 'rowE', 'rowF'])
        });

    }, [])

    const [autoCompleteOptions, setAutoCompleteOptions] = React.useState([]);
    const handleSearch = (value) => {
        setAutoCompleteOptions(() => {
            if (!value) {
                return [];
            }
            if (value.includes('172.20.22.')) {
                return ['172.20.22.'].map(() => ({
                    label: `${value}`,
                    value: `${value}`,
                }));
            }
            return ['172.20.22.', '172.20.9.'].map((domain) => ({
                label: `${domain}${value}`,
                value: `${domain}${value}`,
            }));
        });
    };

    return (

        <Space
            style={{
                width: '100%',
            }}
            // align='center'
            direction="horizontal"
            gap="middle" justify="space-between"
        >
            {contextHolder}

            <Space
                style={{
                    width: '100%',
                }}
                // align='center'
                direction="vertical"
            >
                <h4>通气日志</h4>
                <Space
                    style={{
                        width: '30vw',
                        height: '30vh',
                        border: '1px solid #ebeef5',
                        overflow: 'auto',
                        display: 'block',
                        unicodeBidi: 'isolate',

                    }}

                    // align='center'
                    // direction="vertical"
                >

                    <div style={{
                        // border: '1px solid #ebeef5',
                        display: 'block',
                        unicodeBidi: 'isolate',
                        width: '100%',
                        height: '100%',
                    }}>
                        <LogOutputComponent ref={logComponentRef}/>
                        <p></p>


                    </div>


                </Space>
                <Space
                    style={{
                        width: '30vw',
                        height: '30vh',
                        border: '1px solid #ebeef5',
                        overflow: 'auto',
                        display: 'block',
                        unicodeBidi: 'isolate',

                    }}

                    // align='center'
                    // direction="vertical"
                >
                    <div style={{
                        // border: '1px solid #ebeef5',
                        display: 'block',
                        unicodeBidi: 'isolate',
                        width: '100%',
                        height: '100%',
                    }}>
                        <p>文本</p>

                    </div>


                </Space>
            </Space>
            <Space
                style={{
                    width: '100%',
                }}
                align='center'
                direction="vertical"
            >
                <Form
                    name="basic"
                    layout={"horizontal"}
                    initialValues={{
                        layout: 'horizontal',
                    }}
                    // onFinish={onFinishSearch}
                    autoComplete="off"
                >

                    <Form.Item
                        name="select"
                        label="选择机器"
                        rules={[
                            {
                                required: false,
                            },
                        ]}
                    >
                        <Cascader
                            style={{
                                width: '30vw',
                            }}
                            options={options}
                            onChange={handleChange}
                            multiple
                            // maxTagCount="responsive"
                        />

                    </Form.Item>

                </Form>
                <Progress
                    style={{
                        width: '20vw',
                    }}
                    percent={progress}
                    type="line"
                    status={progressStatus}

                />

                <Button type="primary" autoInsertSpace
                        loading={loadings}
                        onClick={() => {
                            // setProgress(0);
                            handleStart();
                            enterLoading();

                        }}>
                    开始通气
                </Button>

                <Button type="primary" danger
                        autoInsertSpace
                    // loading={loadings}
                        onClick={() => {
                            clearLogOutput();
                        }}>
                    清空输出
                </Button>

                <Flex wrap gap="small">
                    <Form
                        name="basic2"
                        layout={"inline"}
                        initialValues={{
                            layout: 'inline',
                        }}
                        // onFinish={onFinish}
                        autoComplete="off"
                    >

                        <Form.Item
                            name="printerIP"
                            label="IP"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            {/*<Input placeholder="输入打印机IP"/>*/}
                            <AutoComplete
                                style={{
                                    width: 200,
                                }}
                                onSearch={handleSearch}
                                placeholder="输入打印机IP"
                                options={autoCompleteOptions}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                开始通气
                            </Button>
                        </Form.Item>


                    </Form>

                </Flex>


            </Space>
        </Space>
    );
}
export {Vent};