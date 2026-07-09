import { LimsData } from './App';

const statusValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '20', '25', '40', '66'];
const priorityValues = ['1', '2', '3'];
const docStates = ['0', '0', '0', '0', '1'];
const projectPrefixes = ['PRJ-2026-', 'PROJ-SEM-', 'PROJ-TEM-', 'PROJ-XPS-', 'PROJ-SIMS-'];
const samplePhases = ['固相', '液相', '气相', '粉末', '薄膜', '纳米颗粒', '块体材料', '复合材料'];
const units = ['材料研究院', '半导体事业部', '质量检测中心', '纳米技术部', '光电实验室', '微电子所', '先进制造部'];
const names = [
    'TEM样品分析-硅基材料截面观测',
    'SEM表面形貌分析-芯片封装检测',
    'XPS元素价态分析-氧化物薄膜',
    'SIMS深度剖析-掺杂浓度梯度测试',
    'VPD表面污染检测-晶圆表面金属杂质',
    'TEM纳米结构表征-量子点截面',
    'SEM断口分析-金属材料疲劳测试',
    'XPS表面化学分析-催化剂价态',
    'SIMS同位素分析-薄膜扩散研究',
    'VPD微量金属检测-洁净室监控',
    'TEM晶格缺陷观察-位错分析',
    'SEM涂层均匀性检测-光学薄膜',
    'XPS界面反应分析-薄膜附着力',
    'SIMS痕量元素检测-高纯材料',
    'VPD颗粒污染物分析-产线监控',
    'TEM生物样品超薄切片观察',
    'SEM焊接质量分析-BGA封装',
    'XPS腐蚀产物分析-耐蚀涂层',
    'SIMS有机薄膜深度剖析',
    'VPD晶圆表面有机物检测',
];

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function generateMockData(count: number): LimsData[] {
    const list: LimsData[] = [];
    const start = new Date('2026-01-01');
    const end = new Date('2026-07-09');
    for (let i = 0; i < count; i++) {
        list.push({
            FD_MAIM_ID: `fd_main_${String(i + 1).padStart(4, '0')}`,
            DOC_STATE: randomItem(docStates),
            DOC_NAME: names[i % names.length] + (i >= names.length ? `-${String(i + 1).padStart(3, '0')}` : ''),
            DOC_NUMBER: `LIMS${String(2026000 + i + 1)}`,
            DOC_PRIORITY: randomItem(priorityValues),
            DOC_SITE: randomItem(statusValues),
            DOC_PROJECT: randomItem(projectPrefixes) + String(Math.floor(Math.random() * 9000) + 1000),
            DOC_UPDATETIME: randomDate(start, end),
            DOC_AGING: `${Math.floor(Math.random() * 30) + 1}天`,
            FD_ID: `fd_${String(i + 1).padStart(4, '0')}`,
            FD_CREATOR_ID: `user_${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
            FD_URL: 'https://testmmk.naura.com/form/view/',
            FD_COL_1MRA3M: randomItem(samplePhases),
            FD_COL_1FITRK_NAME: randomItem(units),
            FD_COL_6LIFCJ_NAME: randomItem(['张工', '李工', '王工', '赵工', '刘工', '陈工', '周工', '吴工']),
            FD_TARGET_NAME: randomItem(['窗口A-材料检测', '窗口B-半导体分析', '窗口C-纳米表征', '窗口D-表面科学']),
            DOC_PT: Math.floor(Math.random() * 20) + 1,
            DOC_NUM: String(Math.floor(Math.random() * 10) + 1),
            FD_CREATE_TIME: randomDate(start, end),
            FD_JIE_TIME: randomDate(start, end),
            DOC_CABINETANDGRID: `柜${Math.floor(Math.random() * 5) + 1}-格${Math.floor(Math.random() * 20) + 1}`,
            DOC_NEWSITETIME: String(Math.floor(Math.random() * 5000) + 10),
            FD_TEM_COUNT: Math.floor(Math.random() * 10) + 1,
            FD_COL_T9P4F5: Math.floor(Math.random() * 8) + 1,

        });
    }
    return list;
}

export const mockLimsData = generateMockData(50);
