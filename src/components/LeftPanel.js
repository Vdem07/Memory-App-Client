import React, { useState, useContext, useEffect } from 'react';
import { MAIN_ROUTE, FAVOUR_ROUTE, DELETE_ROUTE, AUTH_ROUTE } from "../utils/consts";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Context } from "../index";

import {
  DeleteOutlined,
  FormOutlined,
  HeartOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  SettingOutlined,
  UserOutlined,
  MailOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { Button, Menu, Dropdown, Layout, Typography, Switch } from 'antd';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

const items = [
  { key: '1', icon: <HomeOutlined />, label: 'Главная', route: MAIN_ROUTE },
  { key: '2', icon: <HeartOutlined />, label: 'Избранное', route: FAVOUR_ROUTE },
  { key: '3', icon: <DeleteOutlined />, label: 'Удаленное', route: DELETE_ROUTE }
];

const LeftPanel = () => {
  const [collapsed, setCollapsed] = useState(true);
  const toggleCollapsed = () => setCollapsed(!collapsed);

  const { user } = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.split('/').pop();

  // Состояние для темы (по умолчанию берем из localStorage)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Функция переключения темы
  const toggleTheme = (checked) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Применяем тему при загрузке
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Функция выхода
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    user.setIsAuth(false);
    user.setUser({});
    navigate(AUTH_ROUTE);
  };

  const profileMenuItems = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px' }}>
          <Text strong><UserOutlined /> {user.user?.name || 'Гость'}</Text><br />
          <Text type="secondary"><MailOutlined /> {user.user?.email || 'Нет email'}</Text>
        </div>
      ),
      disabled: true
    },
    { type: 'divider' },
    // {
    //   key: 'theme-toggle',
    //   label: (
    //     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}>
    //       <BulbOutlined style={{ marginRight: '10px' }} />
    //       Темная тема
    //       <Switch checked={theme === 'dark'} onChange={toggleTheme} style={{ marginLeft: '10px' }} />
    //     </div>
    //   )
    // },
    { key: '4', label: 'Выход', onClick: handleLogout }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: theme === 'dark' ? '#141414' : '#fff' }}>
      {/* Верхняя панель */}
      <Header
    style={{
      padding: 0,
      backgroundColor: theme === 'dark' ? '#001529' : 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      justifyContent: 'space-between',
      position: 'fixed',
      width: '100%',
      zIndex: 1000,
      height: '64px' // стандартная высота антовского Header
    }}
  >
        <div style={{ color: theme === 'dark' ? 'white' : 'black', fontSize: '32px', marginLeft: '20px' }}>
          {currentPage === 'Main' && 'Главная'}
          {currentPage === 'Favourite' && 'Избранное'}
          {currentPage === 'Deleted' && 'Удаленное'}
          {currentPage === 'docs-viewer' && 'Просмотр документов'}
        </div>
        <div style={{ marginRight: '20px' }}>
          <Dropdown menu={{ items: profileMenuItems }} trigger={['click']}>
            <a onClick={(e) => e.preventDefault()} style={{ color: theme === 'dark' ? 'white' : 'black', fontSize: "16px" }}>
              Профиль <DownOutlined />
            </a>
          </Dropdown>
        </div>
      </Header>

      {/* Основное содержимое с меню слева */}
      <Layout style={{ paddingTop: '64px' /* отступ, чтобы контент не залез под шапку */ }}>
    {/* Меню слева */}
    <Sider
      width={collapsed ? 80 : 156}
      collapsed={collapsed}
      style={{
        backgroundColor: theme === 'dark' ? '#001529' : 'rgba(255, 255, 255, 0.9)',
        overflow: 'auto',
        height: 'calc(100vh - 64px)', // уменьшаем на высоту шапки
        position: 'fixed',
        left: 0,
        top: '64px'
      }}
    >
          <Button
            type="primary"
            onClick={toggleCollapsed}
            style={{ marginBottom: 16, marginTop: '10px', marginLeft: '10px' }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </Button>
          <Menu defaultSelectedKeys={['1']} mode="inline" theme={theme === 'dark' ? 'dark' : 'light'} inlineCollapsed={collapsed} style={{ fontSize: "16px" }}>
            {items.map((item) => (
              <Menu.Item key={item.key} icon={item.icon}>
                <Link to={item.route}>{item.label}</Link>
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        {/* Контент справа от меню */}
        <Layout
      style={{
        marginLeft: collapsed ? 80 : 156,
        padding: '2px 2px 2px',
        minHeight: 'calc(100vh - 64px)',
        overflow: 'auto',
        backgroundColor: theme === 'dark' ? '#001529' : 'white'
      }}
    >
      <Content
        style={{
          padding: 2,
          margin: 0,
          minHeight: 280,
          borderRadius: '8px',
          color: theme === 'dark' ? 'white' : 'black'
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  </Layout>
</Layout>
  );
};

export default LeftPanel;
