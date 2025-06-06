// import jsonData1 from "./data.json";


//ip及机台名称json数据  一次返回全部机台信息
let jsonData1 = {};
let data;
const loadDataByPost = async () => {
    try {
        const response = await fetch('http://172.20.26.212:3333/searchAllIP2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
        data = await response.json();
        console.log('data加载完成');

    } catch (error) {
        console.warn('查询 IP 全部地址时出错：', error);
    }
}

//通过哪排名称，返回子菜单数据
const convertJsonFormat = (rowName, inputJson = data) => {
    if (!inputJson) {
        // console.warn('Data is null');
        // inputJson = jsonData1;
        return [];
    }
    let children = [];

    for (let rowKey in inputJson) {
        if (!rowKey.startsWith(rowName)) {
            continue;
        }
        let rowData = inputJson[rowKey];

        for (let device of rowData) {
            let deviceKey = device.device_id.split('-')[0];
            children.push({
                key: deviceKey,
                label: deviceKey
            });
        }
    }

    return children;
};

const convertJsonFormat2 = (rowName, inputJson = data) => {
    if (!inputJson) {
        // console.warn('Data is null');
        // inputJson = jsonData1;
        return [];
    }
    let children = [];

    for (let rowKey in inputJson) {
        if (!rowKey.startsWith(rowName)) {
            continue;
        }
        let rowData = inputJson[rowKey];

        for (let device of rowData) {
            let deviceKey = device.device_id.split('-')[0];
            let deviceIP = device.IP;
            children.push({
                label: deviceKey,
                value: deviceKey,
                ip: deviceIP
            });
        }
    }

    return children;
};


//通过机台名称，返回ip地址 反之亦可 mode: IP 或者 device_id 默认名称查ip
const findIpByDeviceId = async (deviceId, mode = 'IP', jsonData = data) => {
    if (!jsonData) {
        // console.warn('jsonData is null');
        // jsonData = jsonData1;
        return null;
    }
    if (!jsonData || !deviceId) {
        return null;
    }
    const keys = Object.keys(jsonData);

    for (const key of keys) {
        if (key.startsWith('row')) {
            const rows = jsonData[key];
            const foundRow = rows.find(row => {
                // row.device_id === deviceId;
                const currentDeviceId = row.device_id.split('-')[0];
                return currentDeviceId.toUpperCase() === deviceId.toUpperCase();
            });
            if (foundRow) {
                if (mode === 'IP') {
                    return foundRow.IP;
                } else if (mode === 'device_id') {
                    return foundRow.device_id;
                }
            }
        }
    }

    return null;
}


//通过接口查询ip地址  一个名称返回一个ip地址
const handleSearchIPByAPI = async (devive_id) => {
    let ip = '';

    try {
        const response = await fetch('http://127.0.0.1:3003/searchIP', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({deviceName: devive_id}),
        });

        const data = await response.json();
        if (data && data.length > 0 && data[0].IP) {
            const text = data[0].IP;
            ip = text;
            // const parts = text.split('.');
            // ip = parts[parts.length - 1];
        } else {
            console.warn('未找到匹配的 IP 地址');
        }
        return ip;

    } catch (error) {
        console.warn('查询 IP 地址时出错：', error);
    }
};


export {findIpByDeviceId, loadDataByPost, convertJsonFormat, convertJsonFormat2}