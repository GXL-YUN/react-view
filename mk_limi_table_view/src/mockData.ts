// 根据真实API字段结构定义类型
export interface LimsData {
    "FD_MAIM_ID": string;
    "FD_COL_MAIN_ID": string;
    "DOC_STATE": string;
    "DOC_NAME": string;
    "DOC_NUMBER": string;
    "DOC_NUM": number;
    "DOC_FIB": number;
    "DOC_TEM": number;
    "DOC_PT" : number;
    "DOC_PRIORITY": string;
    "DOC_SITE": string;
    "FD_JIE_TIME": string;
    "DOC_PROJECT": string;
    "FD_CREATE_TIME": string;
    "DOC_DEPARTMENT": string;
    "DOC_DEPARTMENT_ID": string;
    "DOC_JIE_NAME": string;
    "DOC_JIE_ID": string;
    "FD_TARGET_NAME": string;
    "FD_CABINET": string;
    "FD_GRID": string;
    "FD_URL": string;
    "DOC_NEWSITETIME": number;
    "DOC_CABINETANDGRID": string;
}

// 可选值池
const docStates = ['0', '1','2'];
const priorities = ['1', '2', '3'];
const sites = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '20', '25', '40', '66'];
const cabinets = ['TEM-样品柜', 'SEM-样品柜', 'XPS-样品柜', 'SIMS-样品柜', '综合样品柜-A', '综合样品柜-B'];
const targetNames = ['陈鸿杰', '张伟', '李明', '王芳', '刘洋', '赵静', '周涛', '吴军', '徐丽', '孙鹏'];
const projectPrefixes = ['P7-', 'PRJ-', 'PROJ-', 'P8-', 'P9-'];
const departments = ['流程与数字化体系', '中国科学院物理研究所', '清华大学材料学院', '北京大学化学与分子工程学院', '上海交通大学', '浙江大学', '中国科学技术大学', '南京大学', '西安交通大学', '哈尔滨工业大学', '华中科技大学', '内部检测', '外部协作单位A', '外部协作单位B'];
const jieNames = ['杜俊锋', '张明', '李华', '王强', '刘敏', '陈晨', '杨阳', '赵磊', '黄海', '周杰'];

// 工具函数
function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): string {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function generateId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// 生成DOC_NAME：姓名-仪器类型-日期-序号-测试点数X-能谱数-HT-日期
function generateDocName(index: number): string {
    const instruments = ['A-TEM', 'B-SEM', 'C-XPS', 'D-SIMS', 'E-TEM', 'F-SEM'];
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const seq = String(index + 1).padStart(3, '0');
    const testPoints = randomInt(1, 5);
    const spectra = randomInt(1, 3);
    const extra = randomInt(1, 31);
    return `${randomItem(jieNames)}-${randomItem(instruments)}-${dateStr}-${seq}-测试点数${testPoints}-能谱数${spectra}-HT-${String(extra).padStart(2, '0')}`;
}

// 生成DOC_NUMBER：仪器类型-日期-序号
function generateDocNumber(index: number): string {
    const prefixes = ['A-TEM', 'B-SEM', 'C-XPS', 'D-SIMS', 'E-TEM', 'F-SEM', 'G-TEM', 'H-SEM'];
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const seq = String(index + 1).padStart(3, '0');
    return `${randomItem(prefixes)}-${dateStr}-${seq}`;
}

function generateMockData(count: number): LimsData[] {
    const list: LimsData[] = [];
    const start = new Date('2026-01-01');
    const end = new Date('2026-07-23');

    for (let i = 0; i < count; i++) {
        const mainId = generateId();
        const department = randomItem(departments);
        const jieName = randomItem(jieNames);
        const jieId = generateId();
        const cabinet = randomItem(cabinets);
        const grid = String(randomInt(1, 99));

        list.push({
            "FD_MAIM_ID": mainId,
            "FD_COL_MAIN_ID": mainId,
            "DOC_STATE": randomItem(docStates),
            "DOC_NAME": generateDocName(i),
            "DOC_NUMBER": generateDocNumber(i),
            "DOC_NUM": randomInt(1, 5),
            "DOC_FIB": randomInt(0, 3),
            "DOC_TEM": randomInt(1, 6),
            "DOC_PT": randomInt(1, 6),
            "DOC_PRIORITY": randomItem(priorities),
            "DOC_SITE": randomItem(sites),
            "FD_JIE_TIME": randomDate(start, end),
            "DOC_PROJECT": randomItem(projectPrefixes) + String(randomInt(1000, 9999)),
            "FD_CREATE_TIME": randomDate(start, end),
            "DOC_DEPARTMENT": department,
            "DOC_DEPARTMENT_ID": generateId(),
            "DOC_JIE_NAME": jieName,
            "DOC_JIE_ID": jieId,
            "FD_TARGET_NAME": randomItem(targetNames),
            "FD_CABINET": cabinet,
            "FD_GRID": grid,
            "FD_URL": `/web/#/current/sys-modeling/TEM-SEM/view/${generateId()}/`,
            "DOC_NEWSITETIME": randomInt(0, 5000),
            "DOC_CABINETANDGRID": `${cabinet}_${grid}`
        });
    }

    return list;
}

export const mockLimsData = generateMockData(50);