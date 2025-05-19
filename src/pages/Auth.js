import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AUTH_ROUTE, REGISTRATION_ROUTE, MAIN_ROUTE } from "../utils/consts";
import { login, registration, googleLogin, yandexLogin } from "../http/userAPI";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { Card, Form, Input, Button, Typography, Space, Row, Col, Modal, List, Calendar, ConfigProvider, Spin } from "antd";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { CalendarOutlined, ClockCircleOutlined, InfoCircleOutlined, CheckOutlined, MobileOutlined, CloudOutlined } from "@ant-design/icons";
import ruRU from "antd/locale/ru_RU"; // импортируем русскую локаль

const { Title, Text } = Typography;

// массив фич
const features = [
  "Система авторизации и регистрации – возможность входа через учетные записи в базе данных приложения, а также с использованием сторонних сервисов (OAuth).",
  "Группировка событий – создание тематических групп для классификации событий по различным направлениям (история организации, проекты, рабочие процессы, личные события и т. д.).",
  "Добавление и управление событиями – возможность создавать события, указывать точную дату, добавлять описание, фотографии, видео и документы.",
  "Персонализированное хранение данных – сохранение информации в профиле пользователей для удобного доступа и управления.",
  "Функция избранного – возможность добавления групп или отдельных событий в избранное для быстрого доступа.",
  "Просмотр и взаимодействие с контентом – удобный интерфейс для просмотра содержимого групп, доступа к событиям и связанным с ними материалам.",
  "Редактирование информации – возможность изменять состав групп, добавлять новые события, редактировать существующие записи.",
];

const Clock = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [city, setCity] = useState(localStorage.getItem("selectedCity") || "Kaluga");
  const [isModalVisible, setIsModalVisible] = useState(false); // для управления модалкой

  const availableCities = [
    { value: "Kaluga", label: "Калуга" },
    { value: "Moscow", label: "Москва" },
    { value: "Saint Petersburg", label: "Санкт-Петербург" },
    { value: "Kazan", label: "Казань" },
    { value: "Novosibirsk", label: "Новосибирск" },
    { value: "Yekaterinburg", label: "Екатеринбург" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString("ru-RU", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("ru-RU");
  };

  const fetchWeather = async (selectedCity) => {
    try {
      setLoadingWeather(true);
      const apiKey = "f24d4864f20da298fdd9ec2436343f99";
      const lang = "ru";
      const units = "metric";

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${selectedCity}&appid=${apiKey}&units=${units}&lang=${lang}`
      );

      const data = await response.json();
      setWeather({
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
      });
    } catch (error) {
      console.error("Ошибка загрузки погоды:", error);
      setWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
    localStorage.setItem("selectedCity", selectedCity);
    setIsModalVisible(false); // закрываем модалку после выбора
  };

  return (
    <>
      <Row justify="center" style={{ width: 650, marginBottom: 20 }} gutter={[16, 16]}>
        
        {/* Дата */}
        <Col>
          <Card
            size="small"
            bordered={false}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              minWidth: 180,
            }}
            bodyStyle={{ display: "flex", alignItems: "center", gap: 8, padding: 0 }}
          >
            <CalendarOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            <Text strong>{formatDate(time)}</Text>
          </Card>
        </Col>

        {/* Время */}
        <Col>
          <Card
            size="small"
            bordered={false}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              minWidth: 140,
            }}
            bodyStyle={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: 0,
            }}
          >
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", height: "100%" }}>
              <ClockCircleOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            </div>
            <div style={{ flexGrow: 1, textAlign: "center" }}>
              <Text strong>{formatTime(time)}</Text>
            </div>
          </Card>
        </Col>

        {/* Погода */}
        <Col>
          <Card
            size="small"
            bordered={false}
            hoverable
            onClick={handleCardClick}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              padding: "8px 16px",
              minWidth: 180,
              cursor: "pointer",
            }}
            bodyStyle={{ display: "flex", alignItems: "center", gap: 8, padding: 0 }}
          >
            <CloudOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            {loadingWeather ? (
              <Spin size="small" />
            ) : (
              <Text strong>
                {weather ? `${weather.temp}°C, ${weather.description}` : "Нет данных"}
              </Text>
            )}
          </Card>
        </Col>

      </Row>

      {/* Модальное окно выбора города */}
      <Modal
        title="Выберите город"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {availableCities.map((cityObj) => (
            <Button
              key={cityObj.value}
              type="default"
              onClick={() => handleCitySelect(cityObj.value)}
              style={{ textAlign: "left" }}
            >
              {cityObj.label}
            </Button>
          ))}
        </div>
      </Modal>
    </>
  );
};

const HelpInfo = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleDownloadClick = () => {
    window.open("https://github.com/Vdem07/shedule-bmstu/releases/tag/v1.0.0", "_blank");
  };

  return (
    <>
      <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
        {/* Карточка "О ресурсе" */}
        <Card
          size="small"
          bordered={false}
          onClick={showModal}
          hoverable
          style={{
            background: "#ffffff",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            flex: 1,
          }}
          bodyStyle={{ display: "flex", alignItems: "center", gap: 8, padding: 0 }}
        >
          <InfoCircleOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          <Text strong>О ресурсе</Text>
        </Card>

        {/* Карточка "Скачать приложение" */}
        <Card
          size="small"
          bordered={false}
          onClick={handleDownloadClick}
          hoverable
          style={{
            background: "#ffffff",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            flex: 1,
          }}
          bodyStyle={{ display: "flex", alignItems: "center", gap: 8, padding: 0 }}
        >
          <MobileOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          <Text strong>Скачать приложение</Text>
        </Card>
      </div>

      {/* Модалка о ресурсе */}
      <Modal
        title="О ресурсе"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleOk}
        footer={null}
      >
        <Typography.Paragraph>
          Пользовательский ресурс хронологических событий — веб-система, позволяющая фиксировать и структурировать события в логической и временной последовательности, объединять их по тематикам, прикреплять сопутствующие материалы и выделять приоритетные записи. Такой ресурс может быть востребован в самых разных контекстах — от ведения проектной документации до учета внутренней активности в организациях.
        </Typography.Paragraph>
      </Modal>
    </>
  );
};

const Auth = observer(() => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === REGISTRATION_ROUTE;

  const handleAuth = async (values) => {
    setLoading(true);
    let data;
    try {
      if (isRegister) {
        data = await registration(values.name, values.email, values.password);
      } else {
        data = await login(values.email, values.password);
      }

      const loginTime = new Date().getTime();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("loginTime", loginTime);
      console.log(data)
      user.setUser(data);
      user.setIsAuth(true);
      navigate(MAIN_ROUTE);
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      alert(error.response?.data?.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  };
  
  const GoogleLoginButton = () => {
    const handleGoogleAuth = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        // Проверим, есть ли access_token
        if (!tokenResponse || !tokenResponse.access_token) {
          alert("Ошибка: отсутствует access_token");
          return;
        }
    
        try {
          // Сделаем запрос к API Google для получения данных пользователя
          const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          });
    
          // Получаем данные пользователя
          const userData = await userInfoResponse.json();
    
          // Если нужно, используйте данные для авторизации в вашем приложении
          const data = await googleLogin(tokenResponse.access_token);
          const loginTime = new Date().getTime();
          let data_user = await login(userData.email, userData.sub);
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(userData)); // Используем данные пользователя
          localStorage.setItem("loginTime", loginTime);
          user.setUser(data_user);
          user.setIsAuth(true);
    
          navigate(MAIN_ROUTE);
        } catch (error) {
          console.error("Ошибка Google авторизации:", error);
          alert("Ошибка при авторизации через Google");
        }
      },
      onError: () => alert("Ошибка авторизации через Google"),
      flow: 'implicit',
      scope: "openid email profile",
    });
    
  
    return <Button type="default" onClick={() => handleGoogleAuth()} block><svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 326667 333333"
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    imageRendering="optimizeQuality"
    fillRule="evenodd"
    clipRule="evenodd"
    width={20}
    height={20}
  >
    <path
      d="M326667 170370c0-13704-1112-23704-3518-34074H166667v61851h91851c-1851 15371-11851 38519-34074 54074l-311 2071 49476 38329 3428 342c31481-29074 49630-71852 49630-122593m0 0z"
      fill="#4285f4"
    />
    <path
      d="M166667 333333c44999 0 82776-14815 110370-40370l-52593-40742c-14074 9815-32963 16667-57777 16667-44074 0-81481-29073-94816-69258l-1954 166-51447 39815-673 1870c27407 54444 83704 91852 148890 91852z"
      fill="#34a853"
    />
    <path
      d="M71851 199630c-3518-10370-5555-21482-5555-32963 0-11482 2036-22593 5370-32963l-93-2209-52091-40455-1704 811C6482 114444 1 139814 1 166666s6482 52221 17777 74814l54074-41851m0 0z"
      fill="#fbbc04"
    />
    <path
      d="M166667 64444c31296 0 52406 13519 64444 24816l47037-45926C249260 16482 211666 1 166667 1 101481 1 45185 37408 17777 91852l53889 41853c13520-40185 50927-69260 95001-69260m0 0z"
      fill="#ea4335"
    />
  </svg>Войти через аккаунт Google</Button>;
  };

  const handleYandexAuth = () => {
    const clientId = "85d1e30fbddc4975a8695d62a05a77a1";
    const redirectUri = "http://localhost:3000/yandex-auth";
    
    const authWindow = window.open(
      `https://oauth.yandex.ru/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}`,
      "_blank",
      "width=500,height=600"
    );

    const interval = setInterval(() => {
      try {
        if (authWindow.closed) {
          clearInterval(interval);
        } else {
          const url = authWindow.location.href;
          if (url.includes("access_token")) {
            const params = new URLSearchParams(url.split("#")[1]);
            const token = params.get("access_token");
            authWindow.close();
            clearInterval(interval);
            processYandexAuth(token);
          }
        }
      } catch (error) {}
    }, 1000);
  };

  const processYandexAuth = async (token) => {
    try {
      if (!token) {
        alert("Ошибка: отсутствует access_token");
        return;
      }
      const authData = await yandexLogin(token);
      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));
      user.setUser(authData.user);
      user.setIsAuth(true);
      navigate(MAIN_ROUTE);
    } catch (error) {
      console.error("Ошибка авторизации через Яндекс:", error);
      alert("Ошибка при авторизации через Яндекс");
    }
  };
  

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f2f5", padding: 20 }}>
        <Title level={2} style={{ textAlign: "center", marginBottom: 10 }}>Классификатор событий учебной и производственной деятельности</Title>
        <Clock />
        <Row
  gutter={[32, 32]}
  justify="center"
  align="top" // теперь важно align=top
  style={{ marginTop: 20, width: "100%" }}
>

  {/* Левый блок — Ключевые функции */}
  <Col style={{ display: "flex", justifyContent: "center" }}>
    <Card
      style={{
        width: 550,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Title level={4}>Ключевые функции</Title>
      <List
        dataSource={features}
        renderItem={(item) => (
          <List.Item style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <CheckOutlined style={{ color: "#1677ff", marginTop: 4 }} />
            <Text>{item}</Text>
          </List.Item>
        )}
      />
    </Card>
  </Col>

  {/* Центр — форма авторизации */}
  <Col style={{ display: "grid", justifyContent: "center" }}>
    <Card
      style={{
        width: 400, // ширина формы остается
        padding: 20,
        borderRadius: 10,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
            <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
              {isRegister ? "Регистрация" : "Вход"}
            </Title>
            <Form layout="vertical" onFinish={handleAuth}>
              {isRegister && (
                <Form.Item label="Имя" name="name" rules={[{ required: true, message: "Введите имя" }]}>
                  <Input placeholder="Введите ваше имя" />
                </Form.Item>
              )}
              <Form.Item label="Email" name="email" rules={[{ required: true, message: "Введите email" }]}>
                <Input placeholder="Введите email" />
              </Form.Item>
              <Form.Item label="Пароль" name="password" rules={[{ required: true, message: "Введите пароль" }]}>
                <Input.Password placeholder="Введите пароль" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  {isRegister ? "Зарегистрироваться" : "Войти"}
                </Button>
              </Form.Item>
            </Form>

            <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
              <Text style={{ cursor: "pointer", color: "#1890ff" }} onClick={() => navigate(isRegister ? AUTH_ROUTE : REGISTRATION_ROUTE)}>
                {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
              </Text>
              <Text>или</Text>
            </Space>

            <GoogleOAuthProvider clientId="533607809429-bc7nja5rjf9clr9ls7q7i4jlq9uq8o64.apps.googleusercontent.com">
              <GoogleLoginButton />
            </GoogleOAuthProvider>

            <Button
              type="default"
              onClick={handleYandexAuth}
              block
              style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <img src="/icons/ya.svg" alt="Яндекс" width="22" height="22" />
              Войти через аккаунт Яндекс
            </Button>
          </Card>
          {/* <div style={{ marginTop: 20, width: 400, display: "grid", justifyContent: "center" }}>
  <ConfigProvider locale={ruRU}>
    <Card
      style={{
        borderRadius: 12,
        boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
        background: "#ffffff",
        padding: 10,
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Calendar fullscreen={false} />
    </Card>
  </ConfigProvider>
</div> */}
        </Col>

{/* Правый блок — Скриншоты */}
<Col style={{ display: "flex", justifyContent: "center" }}>
    <div
      style={{
        width: 550,
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {/* Веб-версия */}
      <img
        src="/images/2025-05-15_14-45-39.png"
        alt="Веб интерфейс"
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      />

      {/* Мобильная версия */}
      <img
        src="/images/Mobile.jpg"
        alt="Мобильный интерфейс"
        style={{
          width: "40%",
          marginTop: "-80px",
          marginLeft: "auto",
          marginRight: "10px",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 1,
        }}
      />

      {/* Текст с галочками */}
      <div
        style={{
          marginTop: -30,
          alignSelf: "flex-start",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckOutlined style={{ color: "#1677ff", fontSize: 16 }} />
          <Typography.Text>Доступна веб-версия</Typography.Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckOutlined style={{ color: "#1677ff", fontSize: 16 }} />
          <Typography.Text>Доступно мобильное приложение</Typography.Text>
        </div>
      </div>
    </div>
  </Col>


      </Row>
      <HelpInfo />
      </div>
  );
});

export default Auth;
