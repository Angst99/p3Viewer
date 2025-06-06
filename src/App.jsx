import React, {useEffect, useState} from 'react';
import './App.css';
import {
    AppstoreOutlined,
    LineChartOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import {Button, Form, Input, Layout, Menu, Space, Switch, Radio, theme} from 'antd';

import RealTimeChart from "./components/chart/charts2.jsx";
import {Echarts1, Echarts2} from './components/chart/echarts1.jsx'
import RealTimeChart2 from "./components/chart/echarts2.jsx";

import {convertJsonFormat, findIpByDeviceId, loadDataByPost} from "./searchIP.js";
import axios from "axios";
import {Charts, Charts2} from "./components/chart/charts.jsx";
import ScanIP from "./components/scanIP.jsx";
import {Vent} from "./components/vent.jsx";

const {Header, Sider, Content, Footer} = Layout;
const App = () => {

    const [chartLibrary, setChartLibrary] = useState('ECharts');
    //ip地址，用于图表组件使用，用于查询对应机台的ip地址
    const [IP, setIP] = useState('');

    //刷新图表组件的key，用于刷新图表组件
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => {
        setRefreshKey((prevKey) => prevKey + 1);
    };
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: {colorBgContainer, borderRadiusLG},
    } = theme.useToken();

    //是否显示实时图，默认显示实时图，相应菜单显示相应内容，临时方案，后续优化
    const [showSelectChart, setShowSelectChart] = useState('1');

    //菜单点击事件函数，点击相应的菜单时调用，通过获取菜单key，找到对应的机台，查找并设置对应ip地址，供图表组件使用
    const handleSelect = async ({item, key, keyPath}) => {
        if (key === '0') {
            setShowSelectChart('0');
            return;
        } else if (key === '1') {
            setShowSelectChart('1');
            return;
        } else if (key === 'scan') {
            setShowSelectChart('scan');
            return;
        } else if (key === 'vent') {
            setShowSelectChart('vent');
            return;
        }
        setShowSelectChart(key);
        // console.log('selected', item, key, keyPath)
        const ipAddr = await findIpByDeviceId(key);
        setIP(ipAddr);
    }
    const [textContent, setTextContent] = useState('');

    //反查ip响应函数
    const onFinishSearch = async (Name) => {
        setTextContent(await findIpByDeviceId(Name.printerName, "device_id") + '-' + await findIpByDeviceId(Name.printerName));
    }

    // 侧边栏样式
    const siderStyle = {
        overflow: 'auto',
        height: '100vh',
        // position: 'fixed',
        zIndex: 1,
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
        scrollbarWidth: 'none',
        // scrollbarWidth: 'thin',
        scrollbarGutter: 'auto',
    };


    const [items, setItems] = useState([
        {
            key: '0',
            icon: <LineChartOutlined/>,
            label: 'p3实时图',
        },
        {
            key: '1',
            icon: <LineChartOutlined/>,
            label: 'p3图',
        },
        {
            key: 'rowA',
            label: 'A排',
            // icon:'A排',
            popupClassName: 'self_overflow',

            children: [],
        },
        {
            key: 'rowB',
            label: 'B排',
            popupClassName: 'self_overflow',
            popupStyle: {},
            children: [],
        },
        {
            key: 'rowC',
            label: 'C排',
            popupClassName: 'self_overflow',

            children: [],
        },
        {
            key: 'rowD',
            label: 'D排',
            popupClassName: 'self_overflow',

            children: [],
        },
        {
            key: 'rowE',
            label: 'E排',
            popupClassName: 'self_overflow',

            children: [],
        },
        {
            key: 'rowF',
            label: 'F排',
            popupClassName: 'self_overflow',

            children: [],
        },
        {
            key: 'scan',
            label: 'scan',
            icon: <AppstoreOutlined/>,
        },
        {
            key: 'vent',
            label: '通气',
            icon: <AppstoreOutlined/>,
        },
    ]);

    const pushData = (rowNames) => {
        if (items.find(item => item.key === 'rowA').children.length !== 0) {
            return;//只允许设置items一次，避免重复展开items导致多此设置 测试时出现，正常应该不会
        }
        let updatedItems = [...items];
        for (const rowName of rowNames) {
            let children = convertJsonFormat(rowName);
            let targetObjectIndex = updatedItems.findIndex(item => item.key === rowName);

            if (targetObjectIndex !== -1) {
                let updatedObject = {
                    ...updatedItems[targetObjectIndex],
                    children: [...updatedItems[targetObjectIndex].children, ...children]
                };
                updatedItems[targetObjectIndex] = updatedObject;
            }
        }
        setItems(updatedItems);
    };

    const ChartSelectorComponent = ({chartLibrary, showSelectChart, IP}) => {
        let selectedComponent;

        if (showSelectChart === '0') {
            if (chartLibrary === "ECharts") {
                selectedComponent = <RealTimeChart2/>;
            } else if (chartLibrary === "BizCharts") {
                selectedComponent = <RealTimeChart/>;
            }
        } else if (showSelectChart === '1') {
            if (chartLibrary === "ECharts") {
                selectedComponent = <Echarts1/>;
            } else if (chartLibrary === "BizCharts") {
                selectedComponent = <Charts2/>;
            }
        } else if (showSelectChart === 'scan') {
            selectedComponent = <ScanIP/>
        } else if (showSelectChart === 'vent') {
            selectedComponent = <Vent/>
        } else {
            if (chartLibrary === "ECharts") {
                selectedComponent = <Echarts2 ip={IP}/>;
            } else if (chartLibrary === "BizCharts") {
                selectedComponent = <Charts ip={IP}/>;
            }
        }
        return selectedComponent;
    };


    useEffect(() => {

        loadDataByPost().then(() => {
            pushData(['rowA', 'rowB', 'rowC', 'rowD', 'rowE', 'rowF'])
        });

    }, [])

    return (
        <Layout
            style={{
                minHeight: "100vh"
            }}
        >
            <Sider
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                style={siderStyle}>
                {/*collapsible*/}

                <h4 style={{color: '#fff', textAlign: 'center'}}>P3 Viewer</h4>

                <Menu
                    defaultSelectedKeys={['1']}
                    // defaultOpenKeys={['sub1']}
                    mode="inline"
                    theme="dark"
                    // inlineCollapsed={collapsed}  //浏览器报警告 应该控制sider的折叠 不是菜单，
                    onSelect={handleSelect}
                    items={items}
                />
            </Sider>
            <Layout>
                <Header
                    style={{
                        maxHeight: '10vh',
                        padding: 0,
                        background: colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Button
                        type="text"

                        icon={collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    <Button
                        type="text"

                        onClick={handleRefresh}
                        icon={<ReloadOutlined/>}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />

                    {/*<Switch checkedChildren="ECharts" unCheckedChildren="BizCharts" defaultChecked/>*/}
                    <Radio.Group
                        block
                        options={[
                            {
                                label: 'ECharts',
                                value: 'ECharts',
                            },
                            {
                                label: 'BizCharts',
                                value: 'BizCharts',
                            },
                        ]}
                        defaultValue="ECharts"
                        optionType="button"
                        buttonStyle="solid"
                        onChange={(value) => {
                            setChartLibrary(value.target.value);
                        }}
                    />
                    <Form
                        name="basic"
                        layout={"inline"}
                        initialValues={{
                            layout: 'inline',
                        }}
                        onFinish={onFinishSearch}
                        autoComplete="off"
                    >

                        <Form.Item
                            name="printerName"
                            label="打印机名称反查IP"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Input placeholder="输入名称如 A02"/>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                确定
                            </Button>
                        </Form.Item>

                    </Form>
                    <div>
                        <p>{textContent}</p>
                    </div>
                </Header>
                <Content
                    key={refreshKey}
                    style={{
                        margin: '2vh 16px',
                        padding: 5,
                        minHeight: 280,
                        maxHeight: '80vh',
                        height: '100%',
                        overflow: 'auto',
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <div>
                        {/*切换Content的临时方法，后续改路由*/}

                        {/*<ChartSelectorComponent*/}
                        {/*    chartLibrary={chartLibrary}*/}
                        {/*    showSelectChart={showSelectChart}*/}
                        {/*    IP={IP}*/}
                        {/*/>*/}

                        {showSelectChart === '0'
                            ? (chartLibrary === "ECharts"
                                ? <RealTimeChart2/>
                                : (chartLibrary === "BizCharts" ? <RealTimeChart/> : null))
                            : (showSelectChart === '1'
                                ? (chartLibrary === "ECharts"
                                    ? <Echarts1/>
                                    : (chartLibrary === "BizCharts" ? <Charts2/> : null))
                                : (showSelectChart === 'scan'
                                    ? <ScanIP/>
                                    : (showSelectChart ==='vent'
                                       ? <Vent/>
                                    : (chartLibrary === "ECharts"
                                        ? <Echarts2 ip={IP}/>
                                        : (chartLibrary === "BizCharts" ? <Charts ip={IP}/> : null)))))
                        }
                    </div>

                </Content>
                <Footer
                    style={{
                        maxHeight: '5vh',
                        textAlign: 'center',
                    }}
                >
                    P3 Viewer ©{new Date().getFullYear()} Created by Machao
                </Footer>
            </Layout>
        </Layout>
    );
};
export default App;