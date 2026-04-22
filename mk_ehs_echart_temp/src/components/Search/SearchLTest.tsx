import React,  { useState, useEffect } from 'react';
import { Input, Button, List, Card, Typography, Space, Divider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './index.css';
import request from '../../utils/request';


const { Title, Text } = Typography;
const { Search } = Input;

// 定义搜索结果的数据类型
interface ISearchResult {
    ID: string;
    TITLE: string;
    url: string;
    DESCRIPTION: string;
    FDNAME:string;
}

debugger
// 模拟搜索结果数据
const mockSearchResults: ISearchResult[] =[];
// [
//     {
//         ID: '1',
//         TITLE: 'React 官方文档',
//         url: 'https://reactjs.org',
//         DESCRIPTION: '用于构建用户界面的 JavaScript 库 - React 官方文档提供全面的教程和API参考。',
//         FDSYSNAME:'',
//         FDNAME:''
//     }
// ];


const SearchLTest: React.FC = () => {
    const [searchValue, setSearchValue] = useState<string>('');
    const [searchResults, setSearchResults] = useState<ISearchResult[]>([]);
    const [hasSearched, setHasSearched] = useState<boolean>(false);
    //获取数据
   
  useEffect(() => {
    const loadDepartmentData = async () => {
     
      try {
       const response = await request.get('/Optimize/PhaseIIofEHS/getDangerousGoods/all?fdValue=');
        if (response.status === 0 && response.data) {
            console.log(response)
            for (let index = 0; index < response.data.length; index++) {
                mockSearchResults[index] = response.data[index]
            }
        }
      } catch (error) {
        console.error('加载全量数据失败:', error);
      } finally {
      }
    };
    loadDepartmentData();
  }, []);
    
    //console.log(request)
    // 处理搜索 - 添加明确的参数类型
    const handleSearch = (value: string) => {
        if (!value.trim()) return;
        debugger;
        
        setSearchValue(value);
        setHasSearched(true);

        // 模拟搜索API调用
        setTimeout(() => {
            const filteredResults = mockSearchResults.filter(item =>
                item.TITLE.toLowerCase().includes(value.toLowerCase()) ||
                item.FDNAME.toLowerCase().includes(value.toLowerCase())
            );
            setSearchResults(filteredResults);
        }, 300);
    };

    return (
        <div className="baidu-search-container">
            <div className="search-header">
                <Title level={2} className="logo">危险化学品数据源查询</Title>
                <div className="search-box">
                    <Space.Compact size="large" style={{ width: '100%' }}>
                        <Search
                            placeholder="请输入搜索关键词"
                            allowClear
                            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
                            size="large"
                            onSearch={handleSearch}
                            style={{ width: '600px' }}
                        />
                    </Space.Compact>
                </div>
            </div>

            <Divider />

            <div className="search-results">
                {hasSearched ? (
                    <>
                        <div className="result-stats">
                            <Text type="secondary">找到约 {searchResults.length} 条结果（用时 0.3 秒）</Text>
                        </div>

                        {searchResults.length > 0 ? (
                            <List
                                itemLayout="vertical"
                                dataSource={searchResults}
                                renderItem={item => (
                                    <List.Item>
                                        <Card size="small" bordered={false} className="result-card">
                                            <a href={item.ID} target="_blank" rel="noopener noreferrer" className="result-title">
                                                {item.TITLE}
                                            </a>
                                            <div className="result-url">{item.TITLE}</div>
                                            <div className="result-description">{item.FDNAME}</div>
                                        </Card>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <div className="no-results">
                                <Title level={4}>没有找到与"{searchValue}"相关的结果</Title>
                                <Text type="secondary">建议：请检查输入的关键词是否正确，或尝试使用其他关键词搜索</Text>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="welcome-message">
                        <Title level={3}>欢迎使用搜索</Title>
                        <Text type="secondary">请在搜索框中输入关键词，然后点击搜索按钮</Text>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchLTest;