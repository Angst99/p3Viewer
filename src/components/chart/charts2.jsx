import React, {useState, useEffect} from "react";
import {Chart, Geom, Slider} from "bizcharts";
import {AutoComplete, Button, Flex, Form, Input, message} from 'antd';
import axios from "axios";


//获取实时p3值
async function fetchData(ip) {
    try {
        const response = await axios.get('http://' + ip + ':5000/serial_ctl/xyz/D%204',{
            timeout: 500
        });
        const data = response.data;
        return typeof data === 'string' ? data : JSON.stringify(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

//从接口获取机台名称
async function queryPrinterName(ip) {
    const printer_info_url = 'http://' + ip + ':5000/get_printer_information/';
    const printer_info_response = await axios.get(printer_info_url, {
        timeout: 500 // 设置超时时间为 5000 毫秒（5 秒）
    });

    // 如果返回的数据已经是对象
    if (typeof printer_info_response.data === 'object') {
        const printerInfoRoot = printer_info_response.data;
        if (printerInfoRoot && printerInfoRoot.device_id) {
            console.log(printerInfoRoot.device_id);
            return printerInfoRoot.device_id;
        } else {
            return '';
        }
    } else {
        return '';
    }
}

const RealTimeChart = () => {
    const [messageApi, contextHolder] = message.useMessage();

    const [data, setData] = useState([]);
    const [deviceName, setDeviceName] = useState('null');

    async function loadData(ip) {
        if (ip === '') return -1;
        const text = await fetchData(ip);
        if (!text) {
            return -1;
        }

        const parts = text.split(' ');
        const lastPart = parts[parts.length - 1];
        const value = parseFloat(lastPart);
        if (isNaN(value)) {
            messageApi.open({
                type: 'error',
                content: '解析数据失败',
            });
            return -1;
        }
        console.log(value);

        const currentTime = new Date();
        const device_id = await queryPrinterName(ip);
        setDeviceName(`[${device_id}]-${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`);
        setData(pre => ([
            ...pre,
            {
                time: `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`,
                value: value,
            },
        ]));

        return 0;
    }


    const [printerIP, setPrinterIP] = useState('');
    const [timerId, setTimerId] = useState(null);

    const onFinish = (values) => {

        setPrinterIP(values.printerIP);

        stopTimer();

        startTimer(values.printerIP);
        setData([]);
    };


    const startTimer = async (ip) => {
        try {
            await loadData(ip);

            let interval = setInterval(async () => {
                try {
                    await loadData(ip);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }

            }, 1000);

            setTimerId(interval);

            setTimeout(() => {
                stopTimer();
            }, 600000);

        } catch (error) {
            console.error('Error first fetching data:', error);

            if (timerId !== null) {
                clearInterval(timerId);
            }
        }
    };

    const stopTimer = () => {
        if (timerId !== null) {
            clearInterval(timerId);
        }
    };

    useEffect(() => {
        return () => {
            stopTimer();
        }
    }, [timerId]);


    const scale = {
        value: {
            alias: "p3",
            min: 0,
            type: "linear-strict",
        },
        time: {
            alias: "time",
            // tickCount: 30,
        },
    };

    const [options, setOptions] = React.useState([]);
    const handleSearch = (value) => {
        setOptions(() => {
            // if (!value || value.includes('.')) {
            //     return [];
            // }
            return ['172.20.22.', '172.20.9.'].map((domain) => ({
                label: `${domain}${value}`,
                value: `${domain}${value}`,
            }));
        });
    };


    return (
        <>
            {contextHolder}

            <div style={{height: "60vh", margin: " 0 auto"}}>
                <Flex wrap gap="small">
                    <Form
                        name="basic2"
                        layout={"inline"}
                        initialValues={{
                            layout: 'inline',
                        }}
                        onFinish={onFinish}
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
                                options={options}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                确定
                            </Button>
                        </Form.Item>


                    </Form>

                    <Button type="primary" onClick={stopTimer}>
                        停止
                    </Button>
                </Flex>
                <div style={{textAlign: 'center'}}>
                    <h3> {deviceName}</h3>
                </div>
                <Chart
                    scale={scale}
                    autoFit
                    // height={500}
                    data={data}>
                    <Geom
                        type="line"
                        position="time*value"
                        color={"#ff7f0e"}
                        // animate={false}
                        // animate={{
                        //     appear: {
                        //         animation: "pahtIn"
                        //     },
                        //     enter: {
                        //         animation: "fadeIn"
                        //     }
                        // }}
                    />
                    <Geom
                        type="point"
                        position="time*value"
                        size={1}
                        // size={['value', (value) => {
                        //     if (value > 0.1)
                        //         return 3;
                        //     else return 1;
                        // }]}

                        color={"#ff7f0e"}
                        // animate={false}
                        // animate={{
                        //     appear: {
                        //         animation: "pahtIn"
                        //     },
                        //     enter: {
                        //         animation: "fadeIn"
                        //     }
                        // }}
                    />
                    <Slider
                        start={0}
                        padding={[0, 0, 0, 0]}
                    />
                </Chart>
            </div>
        </>
    )
}


export default RealTimeChart;
