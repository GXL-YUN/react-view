// services/category.ts
import axios from 'axios';
import {CategoryItem} from '../../tier/ts/category';
// 实际API接口
export const fetchCategories = async (parentId?: string): Promise<CategoryItem[]> => {
  try {

    const params = parentId ? { parentId } : {};
    const response = await axios.get('/ekp_mkpass/back/asset/getTail/byParentId?parentId='+parentId, { params });
        debugger
    // 假设接口返回 { code: 0, data: CategoryItem[], message: 'success' }
    console.error('结果'+response.data);
    if (response.data.status === 0) {
         console.error('结果'+response.data.status);
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('获取类别数据失败:', error);
    return [];
  }
};