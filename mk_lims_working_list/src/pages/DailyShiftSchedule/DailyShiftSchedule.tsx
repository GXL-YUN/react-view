import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, message, ConfigProvider, Spin, Empty } from 'antd';
import { LoadingOutlined, UserOutlined, PhoneOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import axios from 'axios';

// ==================== 类型定义 ====================

/** 班组长信息 */
interface TeamLeaderInfo {
    name: string;
    phone: string | null;
    employeeId?: string;
}

/** 班组信息 */
interface TeamInfo {
    id: string;
    name: string;
    department: string;
    leader: TeamLeaderInfo;
    todaySchedule?: string;
    shiftType?: 'day' | 'night' | 'regularShift' | 'dayCut';
}

/** API 响应结构 */
interface ApiResponse {
    status: number;
    msg: string;
    data: {
        data: TeamInfo[];
    };
}

// ==================== 常量 ====================
const API_URL = '/ekp_mkpass/back/mk_limi_table_view/lims/ShiftSchedulingDataComtorller/getSchedulingList';

// ==================== 主组件 ====================
const DailyShiftSchedule: React.FC = () => {
    // ===== 状态 =====
    const [loading, setLoading] = useState<boolean>(true);
    const [teams, setTeams] = useState<TeamInfo[]>([]);
    const [currentDate, setCurrentDate] = useState<string>('');

    // ===== 调用API获取数据（POST 请求，无参数） =====
    const fetchShiftData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post<ApiResponse>(
                API_URL,
                {}, // 空对象作为请求体
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const { status, msg, data } = response.data;

            if (status === 0) {
                const list = data?.data || [];
                setTeams(list);
            } else {
                message.error(msg || '获取排班数据失败');
                setTeams([]);
            }
        } catch (error) {
            console.error('获取排班数据失败:', error);
            message.error('获取排班数据失败，请稍后重试');
            setTeams([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ===== 刷新数据 =====
    const handleRefresh = useCallback(() => {
        fetchShiftData();
        message.success('已刷新');
    }, [fetchShiftData]);

    // ===== 初始化 =====
    useEffect(() => {
        fetchShiftData();
        const now = new Date();
        setCurrentDate(
            `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`
        );
    }, [fetchShiftData]);

    // ===== 按部门分组 =====
    const groupedTeams = useMemo(() => {
        const groups: Record<string, TeamInfo[]> = {};
        teams.forEach((team) => {
            const deptKey = team.department || '未分类';
            if (!groups[deptKey]) {
                groups[deptKey] = [];
            }
            groups[deptKey].push(team);
        });
        return groups;
    }, [teams]);

    // ===== 统计信息 =====
    const stats = useMemo(() => {
        const total = teams.length;
        const dayCount = teams.filter((t) => t.shiftType === 'day').length;
        const nightCount = teams.filter((t) => t.shiftType === 'night').length;
        const dayCutCount = teams.filter((t) => t.shiftType === 'dayCut').length;
        const regularCount = teams.filter((t) => t.shiftType === 'regularShift').length;
        return { total, dayCount, nightCount, dayCutCount, regularCount };
    }, [teams]);

    // ===== 获取排班类型对应的颜色 =====
    const getShiftColor = (type?: TeamInfo['shiftType']): string => {
        switch (type) {
            case 'day': return '#52c41a';
            case 'night': return '#1890ff';
            case 'dayCut': return '#fa8c16';
            case 'regularShift': return '#722ed1';
            default: return '#d9d9d9';
        }
    };

    // ===== 获取排班类型对应的文本标签 =====
    const getShiftLabel = (type?: TeamInfo['shiftType']): string => {
        switch (type) {
            case 'day': return '白班';
            case 'night': return '夜班';
            case 'dayCut': return '中班';
            case 'regularShift': return '正常班';
            default: return '未排班';
        }
    };

    // ===== 加载状态 =====
    if (loading) {
        return (
            <ConfigProvider locale={zhCN}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="加载排班数据..." />
                </div>
            </ConfigProvider>
        );
    }

    // ===== 渲染 =====
    return (
        <ConfigProvider locale={zhCN}>
            <div style={{ padding: '16px 0' }}>
                {/* 顶部标题栏 */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '20px',
                        padding: '0 4px',
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#1a1a2e' }}>
                            <span style={{ marginRight: '12px', color: '#1890ff' }}>📅</span>
                            当日班组排班
                        </h2>
                        <div style={{ color: '#7a8a9e', fontSize: '14px', marginTop: '4px' }}>
                            <span style={{ marginRight: '6px' }}>🕐</span>
                            {currentDate || '加载中...'} · 共 {stats.total} 个班组
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div
                            style={{
                                display: 'flex',
                                gap: '16px',
                                alignItems: 'center',
                                background: '#f5f7fa',
                                padding: '6px 16px',
                                borderRadius: '30px',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '3px',
                                        background: '#52c41a',
                                    }}
                                />
                                <span style={{ fontSize: '13px', color: '#3d4e62' }}>白班 {stats.dayCount}</span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '3px',
                                        background: '#1890ff',
                                    }}
                                />
                                <span style={{ fontSize: '13px', color: '#3d4e62' }}>夜班 {stats.nightCount}</span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '3px',
                                        background: '#fa8c16',
                                    }}
                                />
                                <span style={{ fontSize: '13px', color: '#3d4e62' }}>中班 {stats.dayCutCount}</span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '3px',
                                        background: '#722ed1',
                                    }}
                                />
                                <span style={{ fontSize: '13px', color: '#3d4e62' }}>正常班 {stats.regularCount}</span>
                            </span>
                        </div>
                        <Button type="primary" onClick={handleRefresh}>
                            🔄 刷新
                        </Button>
                    </div>
                </div>

                {/* 班组卡片网格 */}
                {Object.keys(groupedTeams).length === 0 ? (
                    <Empty description="暂无班组数据" style={{ marginTop: '60px' }} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {Object.entries(groupedTeams).map(([department, teamList]) => (
                            <div key={department}>
                                {/* 部门标题 */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginBottom: '14px',
                                        padding: '0 4px',
                                    }}
                                >
                                    <EnvironmentOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#1a2a3a' }}>
                                        {department}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            color: '#7a8a9e',
                                            background: '#f0f2f5',
                                            padding: '0 12px',
                                            borderRadius: '30px',
                                            lineHeight: '26px',
                                        }}
                                    >
                                        {teamList.length} 个班组
                                    </span>
                                </div>

                                {/* 班组卡片列表 */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                        gap: '18px',
                                    }}
                                >
                                    {teamList.map((team) => (
                                        <Card
                                            key={team.id}
                                            bordered={false}
                                            style={{
                                                borderRadius: '16px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                border: '1px solid #eaedf2',
                                                transition: 'all 0.2s ease',
                                            }}
                                            bodyStyle={{ padding: 0 }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: '16px 20px 10px 20px',
                                                    borderBottom: '1px solid #f0f2f5',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    gap: '6px',
                                                }}
                                            >
                                                <h3
                                                    style={{
                                                        margin: 0,
                                                        fontSize: '17px',
                                                        fontWeight: 600,
                                                        color: '#1a1a2e',
                                                    }}
                                                >
                                                    <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                                    {team.name}
                                                </h3>
                                            </div>

                                            <div style={{ padding: '14px 20px 20px 20px' }}>
                                                {/* 排班状态 */}
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        marginBottom: '14px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '2px 14px',
                                                            borderRadius: '30px',
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            color: '#fff',
                                                            background: getShiftColor(team.shiftType),
                                                        }}
                                                    >
                                                        {getShiftLabel(team.shiftType)}
                                                    </span>
                                                    {team.todaySchedule && (
                                                        <span style={{ fontSize: '13px', color: '#5a6a7e' }}>
                                                            {team.todaySchedule}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 班组长信息 */}
                                                <div
                                                    style={{
                                                        background: '#f9fafc',
                                                        borderRadius: '12px',
                                                        padding: '14px 16px',
                                                        border: '1px solid #e8ecf2',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: '12px',
                                                            color: '#7a8a9e',
                                                            fontWeight: 500,
                                                            letterSpacing: '0.3px',
                                                            marginBottom: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        <span style={{ color: '#f5a623', fontSize: '14px' }}>👑</span>
                                                        班组长
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            flexWrap: 'wrap',
                                                            gap: '8px 20px',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: '16px',
                                                                fontWeight: 600,
                                                                color: '#1a2a3a',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                            }}
                                                        >
                                                            <UserOutlined style={{ color: '#1e6fff', fontSize: '15px' }} />
                                                            {team.leader.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px 18px',
                                                                flexWrap: 'wrap',
                                                                color: '#3d4e62',
                                                                fontSize: '13px',
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    background: 'white',
                                                                    padding: '2px 12px 2px 8px',
                                                                    borderRadius: '30px',
                                                                    border: '1px solid #e8ecf2',
                                                                }}
                                                            >
                                                                <PhoneOutlined
                                                                    style={{ color: '#52c41a', fontSize: '13px' }}
                                                                />
                                                                {team.leader.phone || '暂无电话'}
                                                            </span>
                                                            {team.leader.employeeId && (
                                                                <span style={{ fontSize: '12px', color: '#7a8a9e' }}>
                                                                    工号: {team.leader.employeeId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 底部信息 */}
                <div
                    style={{
                        marginTop: '32px',
                        padding: '16px 20px',
                        background: '#f9fafc',
                        borderRadius: '12px',
                        border: '1px solid #eaedf2',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        fontSize: '13px',
                        color: '#7a8a9e',
                    }}
                >
                    <span>
                        <span style={{ marginRight: '6px', color: '#1890ff' }}>ℹ️</span>
                        数据更新时间: {new Date().toLocaleString('zh-CN')}
                    </span>
                    <span>
                        共 {teams.length} 个班组 · {Object.keys(groupedTeams).length} 个部门
                    </span>
                </div>
            </div>
        </ConfigProvider>
    );
};

export default DailyShiftSchedule;