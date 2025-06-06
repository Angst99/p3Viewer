import React, {useState, useEffect, useRef} from "react";
import * as echarts from 'echarts';
import {AutoComplete, Button, Flex, Form, message} from 'antd';
import axios from "axios";

// 获取实时p3值
async function fetchData(ip) {
    try {
        const response = await axios.get('http://' + ip + ':5000/serial_ctl/xyz/D%204', {
            timeout: 500 // 设置超时时间为5000毫秒（5秒）
        });
        const data = response.data;
        return typeof data === 'string' ? data : JSON.stringify(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// 从接口获取机台名称
async function queryPrinterName(ip) {
    const printer_info_url = 'http://' + ip + ':5000/get_printer_information/';
    const printer_info_response = await axios.get(printer_info_url, {
        timeout: 500 // 设置超时时间为5000毫秒（5秒）
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

const RealTimeChart2 = () => {
    const [messageApi, contextHolder] = message.useMessage();


    const chartRef = useRef(null);
    const myChartRef = useRef();

    const [data, setData] = useState([]);
    const [chartTitle, setChartTitle] = useState('');

    async function loadData(ip) {
        if (ip === '') {
            messageApi.open({
                type: 'warning',
                content: 'ip不能为空',
            });
            return -1;
        }
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

        setChartTitle(`[${device_id}]-${ip} ${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`);

        setData(prevData => ([
            ...prevData,
            {
                time: `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`,
                value: value,
            },
        ]));

        return 0;
    }

    useEffect(() => {
        if (chartRef.current) {
            const myChart = echarts.getInstanceByDom(chartRef.current);
            if (myChart) {
                const newOption = {
                    title: {
                        text: chartTitle,
                        left: 'center',
                    },
                    xAxis: {
                        type: 'category',
                        data: data.map(item => item.time)
                    },

                    series: [
                        {
                            data: data.map(item => item.value),
                        },
                    ],
                };
                myChart.setOption(newOption);
                myChart.resize();
            }
        }
        console.log(data);
    }, [data]);

    const handleWindowResize = () => {
        if (chartRef.current) {
            const myChart = echarts.getInstanceByDom(chartRef.current);
            if (myChart) {
                myChart.resize();
            }
        }
    };

    const destroyChart = () => {
        const myChart = myChartRef.current;
        if (myChart) {
            myChart.dispose();
            myChartRef.current = null;
        }
    };

    useEffect(() => {
        if (!myChartRef.current) {
            myChartRef.current = echarts.init(chartRef.current);
            const initialOption = {
                title: {
                    text: '',
                    left: 'center',
                },
                color : ["#e3a70d"],

                legend: {
                    left: 'auto',
                },
                tooltip: {
                    trigger: 'axis'
                },
                grid: {
                    left: '4%',
                    right: '4%',
                },
                xAxis: {
                    type: 'category',
                    data: [],
                },
                yAxis: {
                    type: 'value',
                    name: 'p3',
                    position: 'left',
                },
                dataZoom: [
                    {
                        type: 'inside',
                    },
                    {
                        start: 0,
                    }
                ],
                series: [
                    {
                        name: 'p3',
                        type: 'line',
                        data: [],
                        showSymbol: false,
                    },
                ],
                animate: true,
            };
            myChartRef.current.setOption(initialOption);
        }
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            destroyChart();
        };
    }, []);

    const [timerId, setTimerId] = useState(null);

    const onFinish = (values) => {
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

    const [options, setOptions] = React.useState([]);
    const handleSearch = (value) => {
        setOptions(() => {
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
        <>
            {contextHolder}

            <div style={{height: "70vh", margin: " 0 auto"}}>
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

                <div ref={chartRef} style={{height: "70vh", margin: " 0 auto"}}></div>

            </div>
        </>
    )
}

export default RealTimeChart2;