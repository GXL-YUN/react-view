import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, Space } from 'antd';
import {
  HomeOutlined,
  DesktopOutlined,
  DashboardOutlined,
  CarOutlined,
  FileTextOutlined,
  TeamOutlined,
  ToolOutlined,
  AppstoreOutlined,
  SettingOutlined,
  DatabaseOutlined,
  BellOutlined,
  CheckCircleOutlined,
  UserOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/workbench', icon: <DesktopOutlined />, label: '工作台' },
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/cockpit', icon: <CarOutlined />, label: '智能驾驶舱' },
  { key: '/report', icon: <FileTextOutlined />, label: '报表中心' },
  { key: '/personnel', icon: <TeamOutlined />, label: '人员管理' },
  { key: '/equipment', icon: <ToolOutlined />, label: '设备管理' },
  { key: '/material', icon: <AppstoreOutlined />, label: '物料管理' },
  { key: '/admin', icon: <SettingOutlined />, label: '后台管理' },
  { key: '/datacenter', icon: <DatabaseOutlined />, label: '数据中心' },
];

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', label: '个人中心' },
  { key: 'settings', label: '设置' },
  { type: 'divider' },
  { key: 'logout', label: '退出登录', danger: true },
];

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      console.log('退出登录');
    }
  };

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: 'linear-gradient(135deg, #003366 0%, #004499 100%)',
        height: 56,
        lineHeight: '56px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* Logo 区域 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginRight: 24,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: 'white',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#003366' }}>N</span>
        </div>
        <div style={{ color: 'white' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', lineHeight: 1.2 }}>NAURA</div>
          <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.2 }}>北方华创</div>
        </div>
        <div
          style={{
            color: 'white',
            fontSize: 14,
            marginLeft: 16,
            paddingLeft: 16,
            borderLeft: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          LIMS实验室管理门户
          <DownOutlined style={{ marginLeft: 8, fontSize: 10 }} />
        </div>
      </div>

      {/* 导航菜单 */}
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => handleMenuClick(key)}
        items={menuItems}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: 'white',
          minWidth: 0,
        }}
        theme="dark"
      />

      {/* 右侧快捷入口 */}
      <Space size={16} style={{ flexShrink: 0 }}>
        <Badge count={3} size="small">
          <BellOutlined style={{ fontSize: 18, color: 'white', cursor: 'pointer' }} />
        </Badge>
        <Badge count={1} size="small">
          <CheckCircleOutlined style={{ fontSize: 18, color: 'white', cursor: 'pointer' }} />
        </Badge>
        <div
          style={{
            width: 1,
            height: 24,
            background: 'rgba(255,255,255,0.3)',
          }}
        />
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer', color: 'white' }}>
            <Avatar size={32} icon={<UserOutlined />} style={{ background: '#1890ff' }} />
            <span style={{ fontSize: 14 }}>镭科云_杜俊锋</span>
            <DownOutlined style={{ fontSize: 10 }} />
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Content
        style={{
          background: '#f0f2f5',
          padding: 16,
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        {children}
      </Content>
    </Layout>
  );
};

export default MainLayout;
