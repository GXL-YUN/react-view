
   
   /**
    * 列表页面展示展示数据维护
    */
   import { LimsData, ApiResponse, FilterState } from "./type"
   import { FD_COL_ZCZT, FD_DOC_STATUS,  } from "./enumerated "
   export const columns = [
        {
            title: '序号',
            dataIndex: 'RN',
            key: 'RN',
            width: 10,
            ellipsis: true,
        },
        {
            title: '资产编号',
            dataIndex: 'FD_COL_ZVBH',
            key: 'FD_COL_ZVBH',
            width: 150,
            ellipsis: true,
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.FD_COL_ZVBH || '').toString().trim();
                const strB = (b.FD_COL_ZVBH || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '资产名称',
            dataIndex: 'FD_COL_ZCMC',
            key: 'FD_COL_ZCMC',
            width: 200,
            ellipsis: true,
        },
                {
            title: '规格型号',
            dataIndex: 'FD_COL_GGXH',
            key: 'FD_COL_GGXH',
            width: 100,
            ellipsis: true,
        },


                        {
            title:'使用人部门',
            dataIndex: 'FD_COL_SYBM_NAME',
            key: 'FD_COL_SYBM_NAME',
            width: 100,
            ellipsis: true,
        },

                                {
            title:'使用人',
            dataIndex: 'FD_COL_SYR_NAME',
            key: 'FD_COL_SYR_NAME',
            width: 100,
            ellipsis: true,
        },

        {
            title: '资产类别',
            dataIndex: 'FD_TARGET_NAME',
            key: 'FD_TARGET_NAME',
            width: 120,
            ellipsis: true,
            render: (text: string) => text || '-',
        },
 
  
          {
            title: '采购员',
            dataIndex: 'FD_COL_CJR_NAME',
            key: 'FD_COL_CJR_NAME',
            width: 100,
            align: 'center' as const,
            render: (text: number) => text || '0',
        },
        {
            title: '资产锁定状态',
            dataIndex: 'FD_COL_H33JFF',
            key: 'FD_COL_H33JFF',
            width: 100,
            align: 'center' as const,

            render: (text: string) => {
                //text === '1' ? '是' : text === '0' ? '否' : '-'
                return text === '1' ? '是' : text === '1' ? '否' : '-';
            },
            sorter: (a: LimsData, b: LimsData) => {
                const strA = (a.FD_COL_H33JFF || '').toString().trim();
                const strB = (b.FD_COL_H33JFF || '').toString().trim();
                return strA.localeCompare(strB, 'zh-CN-u-co-pinyin');
            },
        },
        {
            title: '资产状态',
            dataIndex: 'FD_COL_ZCZT',
            key: 'FD_COL_ZCZT',
            width: 100,
            align: 'center' as const,
            //render: (text: string) => text || '-',

            render: (text: string) => {
                //text === '1' ? '是' : text === '0' ? '否' : '-'
                const item = FD_COL_ZCZT.find(item => item.value === text);
                return item ? item.label : '未知状态';
            },
        }
   
    ];