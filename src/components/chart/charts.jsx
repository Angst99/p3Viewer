import React, {useEffect, useState} from "react";
import {Axis, Chart, Geom, Legend, Slider, Tooltip,} from 'bizcharts';
import DataSet from '@antv/data-set';


import axios from "axios";
import {AutoComplete, Button, Flex, Form, message} from "antd";

function fetchData(ip) {
    try {
        return axios.get('http://' + ip + ':5000/serial_ctl/xyz/D%2038',{
             timeout: 500
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
        timeout: 500
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
const Charts = ({ip}) => {

    const [messageApi, contextHolder] = message.useMessage();

    const [chartData, setChartData] = useState([]);
    const [currentTime, setCurrentTime] = useState('');

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
        setCurrentTime(`[${device_id}] ${ip} ${currentYear}-${currentMonth}-${currentDays} ${currentHours}:${currentMinutes}:${currentSeconds}`);

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

        setChartData(newData);
        // console.log(chartData);
        // console.log(newData);
    }

    useEffect(() => {
        if(ip === null || ip === '') return;
        // console.log(ip)
        const loadDataAsync = async () => {
            await loadData();
        };
        loadDataAsync();
    }, [ip]);
    const [chartIns, setChartIns] = useState(null);

    const scale = {
        value: {
            alias: "p7",
            // tickCount: 7,
            min: 0,
            type: "linear-strict",
        },
        p3: {
            alias: "p3",
            // tickCount: 6,
            min: 0,
            type: "linear-strict",
        },
        time: {
            alias: "time",
            // tickCount: 20,
        },
    };

    const ds = new DataSet();
    const dv = ds.createView().source(chartData);

    // dv
    //     .transform({
    //         type: 'map',
    //         callback(row) {
    //             if (row.key === 'p7') {
    //                 return {...row, color: colors[1]};
    //             } else if (row.key === 'p11') {
    //                 return {...row, color: colors[2]};
    //             }
    //             return row;
    //         },
    //     })
    //     .transform({
    //         type: 'fold',
    //         fields:['p7','p11'],
    //         key: 'key',
    //         value: 'value',
    //     });

    dv.transform({
        type: 'map',
    }).transform({
        type: 'fold',
        fields: ['p7', 'p11'],
        key: 'key',
        value: 'value',
    });

    const colors = ["#62daaa", "#6394f9", "#f96363"];

    const axisLabel = {
        formatter(text, item, index) {
            // console.log("axisLabel", text);
            // return moment(text).format("HH:mm");
            return text;
        },
    };

    // const handleLegendChange = (ev) => {
    //     const item = ev.item;
    //     const value = item.value;
    //     const checked = !item.unchecked;
    //     const geoms = chartIns.geometries;
    //
    //     for (let i = 0; i < geoms.length; i++) {
    //         const geom = geoms[i];
    //
    //         if (geom.getYScale().field === value) {
    //             if (checked) {
    //                 geom.show();
    //             } else {
    //                 geom.hide();
    //             }
    //         }
    //     }
    // };

    const handleLegendChange = (ev) => {
        const item = ev.item;
        const value = item.value;
        const checked = !item.unchecked;
        const geoms = chartIns.geometries;
        const geomStates = {};
        geoms.forEach((geom) => {
            geomStates[geom.getYScale().field] = geom.visible();
        });
        geoms.forEach((geom) => {
            if (geom.getYScale().field === value) {
                geom.visible(checked);
            } else {
                geom.visible(geomStates[geom.getYScale().field]);
            }
        });
    };


    return (
        <>
            {contextHolder}

            <div style={{height: "70vh", margin:" 0 auto"}}>

                <div style={{textAlign: 'center'}}>
                    <h3> {currentTime}</h3>
                </div>
                <Chart
                    scale={scale}
                    // height={600}
                    autoFit
                    data={dv}
                    notCompareData={false}
                    errorContent
                    onGetG2Instance={(chart) => setChartIns(chart)}
                >

                    <Axis name="value" title position={"left"} line={{
                        style: {
                            stroke: colors[1],
                            fill: colors[1],
                            lineDash: [2, 2, 3],
                            lineWidth: 3
                        }
                    }}/>
                    <Axis name="p3" position={"right"} title
                          line={{
                              style: {
                                  stroke: colors[0],
                                  fill: colors[0],
                                  lineDash: [2, 2, 3],
                                  lineWidth: 3
                              }
                          }}
                    />
                    <Axis name="time" title label={axisLabel} animate={false}/>

                    <Legend
                        custom={true}
                        allowAllCanceled={true}
                        items={[
                            {
                                value: "p3",
                                name: "p3",
                                marker: {
                                    symbol: "circle",
                                    style: {fill: colors[2], r: 5},
                                },
                                color: colors[2],
                            },
                            {
                                value: "p7",
                                name: "p7",
                                marker: {
                                    symbol: "hyphen",
                                    style: {stroke: colors[1], r: 5, lineWidth: 3},
                                },
                                // color: colors[1],

                            },
                            {
                                value: "p11",
                                name: "p11",
                                marker: {
                                    symbol: "diamond",
                                    style: {fill: colors[0], r: 5},
                                },
                                // color: colors[0],

                            },
                        ]}
                        onChange={handleLegendChange}
                    />
                    <Tooltip shared showCrosshairs showMarkers region={null}/>

                    <Geom type="line"
                          position="time*p3"
                          size={2}
                          color={colors[2]}
                          animate={false}
                          tooltip={true}
                    />
                    <Geom type="line"
                          position="time*value"
                          size={2}
                          color='key'
                          animate={false}
                        // tooltip={[
                        //     "key*value",
                        //     (key, value) => {
                        //         const myTitle = key;
                        //         return {
                        //             name: key,
                        //             value: `${value}`,
                        //             title: myTitle,
                        //         };
                        //     },
                        // ]}
                    />


                    <Slider
                        start={0}
                        padding={[0, 0, 0, 0]}
                        // formatter={(v) => {
                        //     return `${v}`;
                        // }}
                    />
                </Chart>
            </div>
        </>
    );
}


const Charts2 = () => {
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
            return ['172.20.10.', '172.20.9.'].map((domain) => ({
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

            <Charts ip={IP}/>
        </div>
    );
}

export {Charts, Charts2};