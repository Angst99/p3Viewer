import React, {useEffect, useRef, useState} from 'react';
import * as echarts from 'echarts';
import axios from "axios";
import {AutoComplete, Button, Flex, Form, message} from "antd";

function fetchData(ip) {
    try {
        return axios.get('http://' + ip + ':5000/serial_ctl/xyz/D%2038',
            {
                timeout: 500 // 设置超时时间为 5000 毫秒（5 秒）
            })
            .then(response => {
                const data = response.data;
                return typeof data === 'string' ? data : JSON.stringify(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                return null;
            });
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

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

// eslint-disable-next-line react/prop-types
const Echarts2 = ({ip}) => {
    const [messageApi, contextHolder] = message.useMessage();

    const chartRef = useRef(null);
    const myChartRef = useRef();

    async function loadData() {
        const text = await fetchData(ip);
        // console.log(text);
        if (!text) {
            messageApi.open({
                type: 'error',
                content: '获取数据失败',
                duration: 2,
            });
            return;
        }

        const contentStart = text.indexOf('[');
        const jsonData = text.substring(contentStart);

        const parsedData = JSON.parse(jsonData);

        const array1 = parsedData[0];
        const array2 = parsedData[1];
        const array3 = parsedData[2];

        const currentTime = new Date();
        const currentSeconds = currentTime.getSeconds();
        const currentMinutes = currentTime.getMinutes();
        const currentHours = currentTime.getHours();
        const currentDays = currentTime.getDate();
        const currentMonth = currentTime.getMonth() + 1;
        const currentYear = currentTime.getFullYear();
        const device_id = await queryPrinterName(ip);

        const newData = [];
        for (let i = 0; i < array1.length; i++) {
            const newTime = new Date(currentTime);
            newTime.setSeconds(currentSeconds - (array1.length - 1) * 5 + i * 5);
            const formattedHours = newTime.getHours().toString().padStart(2, '0');
            const formattedMinutes = newTime.getMinutes().toString().padStart(2, '0');
            const formattedSeconds = newTime.getSeconds().toString().padStart(2, '0');
            const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
            // console.log(formattedTime);
            newData.push({
                time: formattedTime,
                p3: array1[i],
                p7: array2[i],
                p11: array3[i],
            });
        }
        messageApi.open({
            type: 'success',
            content: '获取数据成功',
            duration: 1,

        });

        // 定义颜色数组
        // const colors = ["#f96363", "#62daaa", "#6394f9"];

        const option = {
            title: {
                text: `[${device_id}] ${ip} ${currentYear}-${currentMonth}-${currentDays} ${currentHours}:${currentMinutes}:${currentSeconds}`,
                left: 'center',
            },
            color : ["#f96363", "#62daaa", "#6394f9"],

            legend: {
                left: 'auto',
            },
            tooltip: {
                trigger: 'axis'
            },
            grid: {
                left: '4%',
                right: '4%',
                // top: 0,
                // bottom: 0
            },
            xAxis: {
                type: 'category',
                data: newData.map(item => item.time)
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'p7',
                    position: 'left',
                    min: 0,
                },
                {
                    type: 'value',
                    name: 'p3',
                    position: 'right',
                    min: 0,
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                },
                {
                    start: 0,
                }
            ],
            series: [
                {
                    name: 'p3',
                    type: 'line',
                    yAxisIndex: 1,
                    data: newData.map(item => item.p3),
                    showSymbol: false,
                },
                {
                    name: 'p7',
                    type: 'line',
                    yAxisIndex: 0,
                    data: newData.map(item => item.p7),
                    showSymbol: false,
                },
                {
                    name: 'p11',
                    type: 'line',
                    yAxisIndex: 0,
                    data: newData.map(item => item.p11),
                    showSymbol: false,
                },
            ]
        };

        if (chartRef.current) {
            const myChart = echarts.getInstanceByDom(chartRef.current);
            if (myChart) {
                myChart.setOption(option);
                myChart.resize();
            }
        }
    }

    const handleWindowResize = () => {
        const myChart = echarts.getInstanceByDom(chartRef.current);
        if (myChart) {
            myChart.resize();
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
        }
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            destroyChart();
        };
    }, []);
    useEffect(() => {
        if (ip === null || ip === '') return;

        loadData().then(() => {
        });

    }, [ip]);


    return (
        <>
            {contextHolder}
            <div ref={chartRef} style={{height: "70vh", margin: " 0 auto"}}></div>
        </>
    );
}

const Echarts1 = () => {
    const [IP, setIP] = useState('');


    const onFinish = (values) => {
        console.log(values.printerIP);
        setIP(values.printerIP);
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
        <div style={{margin: " 0 auto"}}>
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
            </Flex>

            <Echarts2 ip={IP}/>
        </div>
    );
}

export {Echarts1, Echarts2};