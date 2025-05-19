import React, { useState, useEffect, useContext, useRef } from 'react';
import { Collapse, Row, Col, Spin, Button, Modal, Form, Input, DatePicker, Upload, message, FloatButton, Dropdown, Timeline, Image, Tooltip, Tabs } from "antd";
import { FormOutlined, HeartFilled, HeartOutlined, DownOutlined, ReloadOutlined, DeleteOutlined, PlusOutlined, EditOutlined, UnorderedListOutlined, PlayCircleOutlined, DownloadOutlined, LoadingOutlined, SoundOutlined, SearchOutlined } from '@ant-design/icons'; // Импортируем иконки
import { getLifeLines, getLifeLineEvents, deletePhotoFromEvent, getEventPhotos } from "../http/userAPI";
import { Context } from "../index";  // Для получения текущего пользователя
import { observer } from "mobx-react-lite";
import moment from "moment"; // Импортируем moment для работы с датами
import { handleSaveLifeLine, toggleFavourite, handleSaveEvent, handleSaveNewLifeLine, handleDeleteEvent, toggleFavouriteEvent, handleDeleteLifeLine } from '../utils/ClientUtils'; // Импортируем утилитарные функции

import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const { Panel } = Collapse;

const { TabPane } = Tabs;

const { confirm } = Modal;

const FavouriteTimeLines = observer(() => {
  const [favouriteLifeLines, setFavouriteLifeLines] = useState([]);  // Хранит избранные линии жизни
  const [lifeLines, setLifeLines] = useState([]);  // Хранит все линии жизни
  const [loading, setLoading] = useState(true);  // Состояние загрузки
  const [isModalVisible, setIsModalVisible] = useState(false);  // Отображение модального окна редактирования хронологии
  const [editingLifeLine, setEditingLifeLine] = useState(null);  // Хронология, которую редактируем
  const [form] = Form.useForm();  // Форма для редактирования хронологии
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);  // Отображение модального окна для событий
  const [currentEvent, setCurrentEvent] = useState(null);  // Событие, которое редактируется
  const [currentLifeLineId, setCurrentLifeLineId] = useState(null);  // Текущая хронология, с которой работаем
  const [newLifeLineForm] = Form.useForm();  // Форма для создания новой хронологии
  const [isNewLifeLineModalVisible, setIsNewLifeLineModalVisible] = useState(false);  // Отображение модального окна для новой хронологии
  const { user } = useContext(Context);  // Получаем данные о текущем пользователе

  const [sortOrder, setSortOrder] = useState("newest");  // Порядок сортировки

  const [eventPhotos, setEventPhotos] = useState({});  // Фотографии для каждого события

  const [sortEvent, setSortEvent] = useState("newest"); // Порядок сортировки

  const [videoUrl, setVideoUrl] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [uploadingFiles, setUploadingFiles] = useState({}); // Отслеживаем загружаемые файлы

  const videoRef = useRef(null);

  const [audioUrl, setAudioUrl] = useState(null);
  const [audioModalVisible, setAudioModalVisible] = useState(false);
  const audioRef = useRef(null);

  const [currentDeleteEvent, setCurrentDeleteEvent] = useState(null); // Состояние для текущего события
  const [isModalEventVisible, setIsModalEventVisible] = useState(false);

  const [searchTitle, setSearchTitle] = useState('');
  const [searchDate, setSearchDate] = useState(null);

  const [searchEventTitle, setSearchEventTitle] = useState('');
  const [searchEventDate, setSearchEventDate] = useState(null);

  const [lifeLineMap, setLifeLineMap] = useState({}); // Отображение ID хронологии на ее название
const [favouriteEvents, setFavouriteEvents] = useState([]); // Избранные события

const [currentLifeLine, setCurrentLifeLine] = useState(null);
const [isModalDeleteVisible, setIsModalDeleteVisible] = useState(false);

const fileIcons = {
  doc: "/icons/word.png",
  docx: "/icons/word.png",
  xls: "/icons/excel.png",
  xlsx: "/icons/excel.png",
  ppt: "/icons/powerpoint.png",
  pptx: "/icons/powerpoint.png",
  pdf: "/icons/pdf.png",
  zip: "/icons/zip.png",
  rar: "/icons/rar.png",
  "7z": "/icons/7z.png",
  "vsdx": "/icons/visio.png",
  "vsd": "/icons/visio.png",
};

const showDeletePhotoConfirm = (fileId, eventId, e) => {
  e.stopPropagation(); // Остановить всплытие

  confirm({
    title: "Удалить файл?",
    content: "Вы уверены, что хотите удалить этот файл? Это действие необратимо.",
    okText: "Да",
    okType: "danger",
    cancelText: "Отмена",
    onOk() {
      handleDeletePhoto(fileId, eventId);
    },
  });
};

  // Функция для удаления хронологии
  const handleDeleteLifeLineHandler = async (lifeLineId) => {
    await handleDeleteLifeLine(lifeLineId, setLifeLines);
    await fetchFavouriteLifeLinesAndEvents();
  };
  

  const handleOk = async () => {
    if (currentLifeLine) {
      await handleDeleteLifeLineHandler(currentLifeLine);
    }
    setIsModalDeleteVisible(false);
  };

// Переключение избранности события
const handleToggleFavouriteEvent = async (currentEvent) => {
  await toggleFavouriteEvent(currentEvent, setLifeLines);
  await fetchFavouriteLifeLinesAndEvents(); // Обновить избранное
};


const handleSearchEventTitleChange = (e) => {
  setSearchEventTitle(e.target.value);
};

const handleSearchEventDateChange = (date, dateString) => {
  setSearchEventDate(date ? moment(dateString, 'DD.MM.YYYY') : null);
};

// Фильтрация событий по названию и дате
const filteredEvents = (events) => {
  return events.filter((event) => {
    const matchesTitle = event.title.toLowerCase().includes(searchEventTitle.toLowerCase());
    const matchesDate = searchEventDate ? moment(event.event_date).isSame(searchEventDate, 'day') : true;
    return matchesTitle && matchesDate;
  });
};

   // Функция фильтрации по названию и дате
   const filteredLifeLines = favouriteLifeLines.filter((lifeLine) => {
    const matchesTitle = lifeLine.title.toLowerCase().includes(searchTitle.toLowerCase());
    const matchesDate = searchDate
      ? moment(lifeLine.createdAt).isSame(searchDate, 'day')
      : true;
    return matchesTitle && matchesDate;
  });

  const handleSearchTitleChange = (e) => {
    setSearchTitle(e.target.value);
  };

  const handleSearchDateChange = (date, dateString) => {
    setSearchDate(date ? moment(dateString, 'DD.MM.YYYY') : null);
  };

  const showDeleteEventConfirm = (event) => {
    // Устанавливаем выбранное событие и показываем модальное окно
    setCurrentDeleteEvent(event);
    setIsModalEventVisible(true);
  };

  const handleEventCancel = (e) => {
    // Закрываем модальное окно без выполнения удаления
    e.stopPropagation();
    setIsModalEventVisible(false);
  };

  const handleEventOk = async (e) => {
    e.stopPropagation();
    if (currentDeleteEvent) {
      await handleDeleteEventHandler(currentDeleteEvent);
    }
    setIsModalEventVisible(false);
  };
  

    const handleDeleteCancel = (e) => {
    // Закрываем модальное окно без выполнения удаления
    e.stopPropagation();
    setIsModalDeleteVisible(false);
  };

  // Загрузка избранных линий жизни и событий
  const fetchFavouriteLifeLinesAndEvents = async () => {
    try {
      const allLifeLines = await getLifeLines(user.user.id);
      const favouriteLifeLines = allLifeLines.filter(lifeLine => lifeLine.is_favourite && !lifeLine.is_deleted);
      const LifeLines = allLifeLines.filter(lifeLine => !lifeLine.is_deleted);
  
      const eventsData = await Promise.all(
        favouriteLifeLines.map((lifeLine) => getLifeLineEvents(lifeLine.id))
      );
  
      const lifeLineMap = LifeLines.reduce((map, lifeLine) => {
        map[lifeLine.id] = lifeLine.title;
        return map;
      }, {});
  
      const eventsWithLifeLine = favouriteLifeLines.map((lifeLine, index) => ({
        ...lifeLine,
        events: eventsData[index].filter(event => event.is_favourite || !event.is_deleted),
      }));
  
      setFavouriteLifeLines(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(eventsWithLifeLine)) {
          return eventsWithLifeLine;
        }
        return prev;
      });
  
      const allEvents = await Promise.all(
        allLifeLines.map((lifeLine) => getLifeLineEvents(lifeLine.id))
      );
  
      const favouriteEvents = allEvents.flatMap(events =>
        events.filter(event => event.is_favourite && !event.is_deleted)
      );
  
      setFavouriteEvents(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(favouriteEvents)) {
          return favouriteEvents;
        }
        return prev;
      });
  
      setLifeLineMap(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(lifeLineMap)) {
          return lifeLineMap;
        }
        return prev;
      });
  
      setLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки избранных данных", error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFavouriteLifeLinesAndEvents();
  }, [user.user.id]);
  

  // Открытие модального окна для редактирования хронологии
  const showEditModal = (lifeLine) => {
    setEditingLifeLine(lifeLine);
    form.setFieldsValue({
      title: lifeLine.title,
      description: lifeLine.description,
    });
    setIsModalVisible(true);
  };

  // Открытие модального окна для добавления новой хронологии
  const showNewLifeLineModal = () => {
    newLifeLineForm.resetFields();
    setIsNewLifeLineModalVisible(true);
  };

  // Открытие модального окна для редактирования события
  const showEventModal = async (lifeLineId, event = null) => {
    setCurrentLifeLineId(lifeLineId);
    if (event) {
      setCurrentEvent(event);
      form.setFieldsValue({
        title: event.title,
        description: event.description,
        date: dayjs(event.event_date),
      });
    } else {
      setCurrentEvent(null);
      form.resetFields();
    }
    setIsEventModalVisible(true);
  };

  // Закрытие всех модальных окон
  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEventModalVisible(false);
    setEditingLifeLine(null);
    setCurrentEvent(null);
    setIsNewLifeLineModalVisible(false);
  };

  // Сохранение изменений хронологии
  const handleSave = async () => {
    await handleSaveLifeLine(form, editingLifeLine, setLifeLines, setIsModalVisible);
    await fetchFavouriteLifeLinesAndEvents();
  };
  

  // Сохранение события
  const handleSaveEventHandler = async () => {
    try {
      await form.validateFields();
      await handleSaveEvent(form, currentEvent, currentLifeLineId, setLifeLines, setIsEventModalVisible);
      await fetchFavouriteLifeLinesAndEvents();
    } catch (error) {
      console.log('Validation Failed:', error);
    }
  };
  
  // Сохранение новой хронологии
  const handleSaveNewLifeLineHandler = async () => {
    try {
      await newLifeLineForm.validateFields();
      await handleSaveNewLifeLine(newLifeLineForm, user, setLifeLines, setIsNewLifeLineModalVisible);
      await fetchFavouriteLifeLinesAndEvents();
    } catch (error) {
      console.log('Validation Failed:', error);
    }
  };

  // Переключение избранности хронологии
  const handleToggleFavourite = async (lifeLine) => {
    await toggleFavourite(lifeLine, setLifeLines);
    await fetchFavouriteLifeLinesAndEvents();
  };
  
  // Удаление события
  const handleDeleteEventHandler = async (currentEvent) => {
    await handleDeleteEvent(currentEvent, setLifeLines);
    await fetchFavouriteLifeLinesAndEvents();
  };
  

  // Загрузка фотографий для события
  const loadEventPhotos = async (eventId) => {
    try {
      const photos = await getEventPhotos(eventId);
      setEventPhotos((prev) => ({ ...prev, [eventId]: photos }));
      await fetchFavouriteLifeLinesAndEvents();
    } catch (error) {
      console.error("Ошибка загрузки фото:", error);
    }
  };

  // Загрузка фотографий для всех событий при изменении избранных хронологий
  useEffect(() => {
    favouriteLifeLines.forEach(lifeLine => {
      lifeLine.events.forEach(event => {
         loadEventPhotos(event.id);
      });
    });
  }, [favouriteLifeLines]);

  useEffect(() => {
    // Загружаем фотографии для всех избранных событий
    favouriteEvents.forEach(event => {
      loadEventPhotos(event.id); // Функция для загрузки фотографий
    });
  }, [favouriteEvents]);  // Запускается при изменении списка избранных событий
  

  // Удаление фотографии из события
  const handleDeletePhoto = async (photoId, eventId) => {
    try {
      await deletePhotoFromEvent(photoId, eventId);
      setEventPhotos((prev) => ({
        ...prev,
        [eventId]: prev[eventId].filter((photo) => photo.id !== photoId),
      }));
      await fetchFavouriteLifeLinesAndEvents(); // вместо fetchData
    } catch (error) {
      message.error("Ошибка при удалении файла.");
    }
  };
  

// Функция для открытия документа
const openDocument = (fileUrl, fileType, setVideoUrl, setModalVisible, setAudioUrl, setAudioModalVisible) => {
  const extension = fileType.split('.').pop().toLowerCase();

  // Для PDF, DOCX, XLSX, PPTX открываем через WebViewer
  if (['pdf', 'docx', 'xlsx', 'pptx'].includes(extension)) {
    const docUrl = `${process.env.REACT_APP_API_URL}${fileUrl}`;
    const viewerUrl = `/docs-viewer?docUrl=${encodeURIComponent(docUrl)}`;
    window.open(viewerUrl, '_blank');  // Открытие DocsViewer в новой вкладке
    return;
  }

  // Для изображений (фото)
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
    
    return;
  }

  if (['mp4', 'webm', 'ogg'].includes(extension)) {
    setVideoUrl(`${process.env.REACT_APP_API_URL}${fileUrl}`);
    setModalVisible(true);
    return;
  }

  if (['mp3', 'wav', 'aac'].includes(extension)) {
    setAudioUrl(`${process.env.REACT_APP_API_URL}${fileUrl}`);
    setAudioModalVisible(true);
    return;
  }
  

  // Для других файлов показываем ссылку для скачивания
  const downloadUrl = `${process.env.REACT_APP_API_URL}${fileUrl}`;
  window.open(downloadUrl, '_blank'); // Открытие файла для скачивания
};

const handleVideoCancel = () => {
  // Останавливаем воспроизведение видео при закрытии окна
  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.currentTime = 0; // (опционально) сбрасываем видео на начало
  }
  setModalVisible(false);
};

const handleAudioCancel = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0; 
  }
  setAudioModalVisible(false);
};

const handleUploadChange = (eventId) => {
  return async ({ file }) => {
    setUploadingFiles((prev) => {
      const newState = { ...prev };

      if (file.status === "uploading") {
        if (!newState[eventId]) {
          newState[eventId] = {};
        }
        newState[eventId][file.uid] = file.percent || 0;
      }

      return newState;
    });

    if (file.status === "done" || file.status === "error") {
      setUploadingFiles((prev) => {
        const updatedState = { ...prev };
        if (updatedState[eventId]) {
          delete updatedState[eventId][file.uid];
          if (Object.keys(updatedState[eventId]).length === 0) {
            delete updatedState[eventId];
          }
        }
        return updatedState;
      });

      if (file.status === "done") {
        try {
          // Дадим серверу немного времени обработать файл
          await new Promise((resolve) => setTimeout(resolve, 500));
          await loadEventPhotos(eventId)
          await fetchFavouriteLifeLinesAndEvents();
        } catch (error) {
          console.error("Ошибка при обновлении данных после загрузки:", error);
        }
      } else if (file.status === "error") {
        message.error("Ошибка при загрузке файла");
      }
    }
  };
};


  // Сортировка хронологий
  const sortLifeLines = (lifeLines, order) => {
    switch (order) {
      case "oldest":
        return [...lifeLines].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "a-z":
        return [...lifeLines].sort((a, b) => a.title.localeCompare(b.title));
      case "z-a":
        return [...lifeLines].sort((a, b) => b.title.localeCompare(a.title));
      default:
        return [...lifeLines].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  // Функция для сортировки событий
  const sortEvents = (Events, order) => {
    switch (order) {
      case "oldest":
        return [...Events].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      case "a-z":
        return [...Events].sort((a, b) => a.title.localeCompare(b.title));
      case "z-a":
        return [...Events].sort((a, b) => b.title.localeCompare(a.title));
      default:
        return [...Events].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    }
  };

  // Сортировка
  const menuItems = [
    { label: "От новых к старым", key: "newest" },
    { label: "От старых к новым", key: "oldest" },
    { label: "От А до Я", key: "a-z" },
    { label: "От Я до А", key: "z-a" },
  ];

  // Обработчик смены сортировки
  const handleSortChange = ({ key }) => {
    setSortOrder(key);
  };

  const handleSortEventChange = ({ key }) => {
    setSortEvent(key);
  };

  // Показываем загрузочный спиннер, если данные ещё загружаются
  if (loading) {
    return <Spin size="large" style={{ display: "flex", justifyContent: "center", marginTop: "20px" }} />;
  }

  return (
    <div className="main" style={{ padding: "20px" }}>
          <Tabs
  defaultActiveKey="1"
  centered
  tabBarStyle={{ fontSize: "18px", fontWeight: "600", textAlign: "center" }}
>

      <TabPane tab="Избранные группы" key="1">
      <Row justify="end" align="middle">
      <Col>
          {/* Поле для поиска по названию */}
          <Input
            placeholder="Поиск по названию"
            value={searchTitle}
            onChange={handleSearchTitleChange}
            style={{ width: 170, marginRight: 5, marginBottom: 10 }}
            prefix={<SearchOutlined />}
          />
        </Col>
        <Col>
          {/* Поле для поиска по дате */}
          <ConfigProvider locale={ruRU}>
          <DatePicker
            placeholder="Поиск по дате"
            onChange={handleSearchDateChange}
            style={{ width: 170, marginRight: 5, marginBottom: 10, fontSize: "18px" }}
            format="DD.MM.YYYY"
          />
          </ConfigProvider>
        </Col>
        <Col>
          {/* Кнопка для сортировки */}
          <Dropdown menu={{ items: menuItems, onClick: handleSortChange }} trigger={["click"]} style={{ width: 170 }}>
            <Button style={{ marginBottom: 10, width: 170, fontSize: "16px" }}>
              <UnorderedListOutlined />
              Сортировка <DownOutlined style={{ fontSize: "16px" }} />
            </Button>
          </Dropdown>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        {/* Колонка для Timeline слева от событий */}
        <Col span={24}>
          <Timeline mode="left">
          {sortLifeLines(filteredLifeLines, sortOrder).map((lifeLine) => (
              <Col span={24} style={{ fontSize: "18px" }}>
              {moment(lifeLine.createdAt).format("DD.MM.YYYY")}
                      {/* Основная информация о хронологиях и событиях */}
                      <Collapse accordion style={{ width: "100%" }}>
            {/* {sortLifeLines(lifeLines, sortOrder).map((lifeLine) => ( */}
              <Panel
                header={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{lifeLine.title}</h3>
                      <small style={{ color: "gray" }}>
                      <div style={{ color: "black", fontSize: "16px", marginTop: "4px" }}>
                        Дата создания: {moment(lifeLine.createdAt).format("DD.MM.YYYY HH:mm")}
                        </div>
                      </small>
                    </div>
                    <div style={{ display: "flex" }}>
                    <Tooltip title="Редактировать группу">
                      <Button onClick={(e) => { e.stopPropagation(); showEditModal(lifeLine)}} type="link" size="large">
                      <EditOutlined />
                      </Button>
                      </Tooltip>
                      <Tooltip title="Убрать из избранного">
                      <Button
                        icon={lifeLine.is_favourite ? <HeartFilled /> : <HeartOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleToggleFavourite(lifeLine)}}
                        type="link"
                        size="large"
                      />
                      </Tooltip>
                      {/* <Tooltip title="Удалить группу">
                      <Button
                        icon={lifeLine.is_deleted ? <ReloadOutlined /> : <DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); showDeleteConfirm(lifeLine)}}
                        type="link"
                        danger
                        size="large"
                      />
                      </Tooltip> */}
                    </div>
                  </div>
                }
                key={lifeLine.id}
                style={{ width: "100%" }}
              >
                <h3 style={{ margintop: 20 }}>Описание</h3>
                <p style={{ 
  backgroundColor: '#f5f5f5', 
  padding: '10px', 
  borderRadius: '8px', 
  whiteSpace: 'pre-line', 
  maxWidth: '100%', 
  wordWrap: 'break-word', 
  minHeight: '100px', // Устанавливаем минимальную высоту блока
  fontSize: "16px"
}}>{lifeLine.description}</p>
                <h3 style={{ margintop: 20 }}>События</h3>
                <Row justify="end" align="middle">
                <Col>
    <Input
      placeholder="Поиск по названию"
      value={searchEventTitle}
      onChange={handleSearchEventTitleChange}
      style={{ width: 170, marginRight: 5, marginBottom: 10 }}
      prefix={<SearchOutlined />}
    />
  </Col>
  <Col>
  <ConfigProvider locale={ruRU}>
    <DatePicker
      placeholder="Поиск по дате"
      onChange={handleSearchEventDateChange}
      style={{ width: 170, marginRight: 5, marginBottom: 10, fontSize: "18px" }}
      format="DD.MM.YYYY"
    />
    </ConfigProvider>
  </Col>
  <Col>
    {/* Кнопка для сортировки */}
    <Dropdown menu={{ items: menuItems, onClick: handleSortEventChange }} trigger={["click"]}>
      <Button style={{ marginBottom: 10, width: 170, fontSize: "16px" }}>
      <UnorderedListOutlined />
        Сортировка <DownOutlined style={{ fontSize: "16px" }} />
      </Button>
    </Dropdown>
  </Col>
</Row>
                <Row gutter={[16, 16]}>
                  {/* Колонка для Timeline, занимает 6 частей из 24 */}
                  <Col span={24}>
                    {lifeLine.events && lifeLine.events.length > 0 && (
                      <Timeline mode="left" style={{ marginBottom: "20px" }}>
                      {sortEvents(filteredEvents(lifeLine.events), sortEvent).map((event) => (
                          <Col span={24} style={{ fontSize: "16px" }}>
                          {moment(event.event_date).format("DD.MM.YYYY")}
                          <Collapse>
              <Panel
                header={
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <div>
                      <span><h5>{event.title}</h5></span>
                    </div>
                    <div style={{ display: "flex" }}>
                    <Tooltip title="Редактировать событие">
                      <Button onClick={(e) => { e.stopPropagation(); showEventModal(lifeLine.id, event)}} type="link" size="large">
                      <EditOutlined />
                      </Button>
                      </Tooltip>
                      <Tooltip title={event.is_favourite ? "Убрать из избранного" : "Добавить в избранное"}>
                  <Button
                     icon={event.is_favourite ? <HeartFilled /> : <HeartOutlined />}
                    onClick={(e) => { e.stopPropagation(); handleToggleFavouriteEvent(event) }}
                    type="link"
                    size="large"
                  />
                </Tooltip>
                      <Tooltip title="Удалить событие">
                      <Button
                        icon={event.is_deleted ? <ReloadOutlined /> : <DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); showDeleteEventConfirm(event)}}
                        type="link"
                        danger={!event.is_deleted}
                        size="large"
                      />
                      {/* Модальное окно для подтверждения удаления */}
                      </Tooltip>
                    </div>
                  </div>
                }
                key={event.id}
              >
                <h5 style={{ margintop: 20 }}>Описание события</h5>
                <p style={{ 
  backgroundColor: '#f5f5f5', 
  padding: '10px', 
  borderRadius: '8px', 
  whiteSpace: 'pre-line', 
  maxWidth: '100%', 
  wordWrap: 'break-word', 
  minHeight: '100px' , // Устанавливаем минимальную высоту блока
  fontSize: "16px"
}}>{event.description}</p>
                <p style={{ fontSize: "16px" }}>{moment(event.event_date).format("DD.MM.YYYY")}</p>
                      {/* Кнопка добавления файлов */}
      <Upload
        action={`${process.env.REACT_APP_API_URL}/api/Photo?event_id=${event.id}`}
        listType="picture-card"
        showUploadList={false}
        multiple={true}
        onChange={handleUploadChange(event.id)} // Обработчик изменения состояния загрузки
      >
        <button style={{ border: 0, background: "none" }} type="button">
          <PlusOutlined />
          <div style={{ marginTop: 8, fontSize: "16px" }}>Добавить файлы</div>
        </button>
      </Upload>
                <div style={{ display: "flex", alignItems: "center" }}>
      {eventPhotos[event.id] && eventPhotos[event.id].length > 0 && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginRight: "10px", marginTop: "20px" }}>
          {eventPhotos[event.id].map((file) => {
            const extension = file.url.split('.').pop().toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
            const isVideo = ['mp4', 'webm', 'ogg'].includes(extension);
            const isAudio = ['mp3', 'wav', 'ogg'].includes(extension);
            const isDocument = Object.keys(fileIcons).includes(extension);

return (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
  <div
    key={file.id}
    style={{
      position: "relative",
      borderRadius: "8px",
      overflow: "hidden",
      width: 100,
      height: 100,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      cursor: "pointer",
      backgroundColor: "#f0f0f0",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
    onClick={() => openDocument(file.url, file.url, setVideoUrl, setModalVisible, setAudioUrl, setAudioModalVisible)}
  >
    {isImage ? (
      <Image
        src={`${process.env.REACT_APP_API_URL}${file.url}`}
        width="100%"
        height="100%"
        style={{ objectFit: "cover" }}
      />
    ) : isVideo ? (
      <>
        <PlayCircleOutlined
          style={{
            fontSize: "36px",
            color: "#fff",
            position: "absolute",
            zIndex: 2,
          }}
        />
        <video
          src={`${process.env.REACT_APP_API_URL}${file.url}`}
          width="100%"
          height="100%"
          style={{ objectFit: "cover", opacity: 0.7 }}
          muted
        />
      </>
    ) : isAudio ? (
      <>
        <SoundOutlined
          style={{
            fontSize: "36px",
            color: "#000",
            position: "absolute",
            zIndex: 2,
          }}
        />
        <audio
          src={`${process.env.REACT_APP_API_URL}${file.url}`}
          style={{ display: "none" }}
        />
      </>
    ) : isDocument ? (
      <img
        src={fileIcons[extension]}
        alt={extension}
        style={{ width: "80%", height: "80%", objectFit: "contain" }}
      />
    ) : (
      <span style={{ fontSize: 24 }}>📄</span> // Иконка по умолчанию
    )}

<Button
  icon={<DeleteOutlined />}
  size="small"
  danger
  style={{ position: "absolute", top: 5, right: 5 }}
  onClick={(e) => showDeletePhotoConfirm(file.id, event.id, e)}
/>
    <Button
      icon={<DownloadOutlined />}
      size="small"
      style={{ position: "absolute", top: 70, right: 5 }}
      onClick={() => {
        const downloadUrl = `${process.env.REACT_APP_API_URL}${file.url}`;
        window.open(downloadUrl, '_blank');
      }}
    />
  </div>
  {/* Название файла отдельным блоком */}
<span
  style={{
    fontSize: "12px",
    color: "#333",
    whiteSpace: "normal", // Разрешаем перенос строк
    wordBreak: "break-word", // Разрешаем разрыв длинных слов
    maxWidth: "100px",
    textAlign: "center",
  }}
  title={file.description} // Полное имя при наведении
>
  {file.description}
</span>
  </div>
);
          })}
        </div>
      )}

      {/* Модальное окно для видео */}
      <Modal
      open={modalVisible}
      footer={null}
      onCancel={handleVideoCancel}
      centered
      width={800}
    >
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          style={{ width: '100%' }}
        />
      )}
    </Modal>
    <Modal
  open={audioModalVisible}
  footer={null}
  onCancel={handleAudioCancel}
  centered
  width={600}
>
  {audioUrl && (
    <audio ref={audioRef} src={audioUrl} controls autoPlay style={{ width: "100%" }} />
  )}
</Modal>

{/* Показываем индикаторы загрузки */}
{uploadingFiles[event.id] && Object.keys(uploadingFiles[event.id]).length > 0 && (
  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginRight: "10px" }}>
    {Object.keys(uploadingFiles[event.id]).map((fileId) => (
      <div
        key={fileId}
        style={{
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
          width: 100,
          height: 100,
          backgroundColor: "#f0f0f0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "10px",
        }}
      >
        <LoadingOutlined style={{ fontSize: 36, color: "#1890ff" }} />
        <span style={{ fontSize: "12px", color: "#555", marginTop: "5px" }}>
          Загрузка файла...
        </span>
      </div>
    ))}
  </div>
)}
    </div>
              </Panel>
            </Collapse>
                          </Col>
                        ))}
                      </Timeline>
                    )}
                  </Col>

                  {/* Колонка для Collapse, занимает 18 частей из 24 */}
                  
                </Row>

                                <Button
                  onClick={() => showEventModal(lifeLine.id)}
                  type="primary"
                  style={{
                    fontSize: "16px",
                  }}
                >
                  Добавить событие
                </Button>
              </Panel>
          </Collapse>
        </Col>
              )
            )}
          </Timeline>
        </Col>
  
      </Row>

      </TabPane>

<TabPane tab="Избранные события" key="2">
      <Row justify="end" align="middle">
                <Col>
    <Input
      placeholder="Поиск по названию"
      value={searchEventTitle}
      onChange={handleSearchEventTitleChange}
      style={{ width: 170, marginRight: 5, marginBottom: 10 }}
      prefix={<SearchOutlined />}
    />
  </Col>
  <Col>
  <ConfigProvider locale={ruRU}>
    <DatePicker
      placeholder="Поиск по дате"
      onChange={handleSearchEventDateChange}
      style={{ width: 170, marginRight: 5, marginBottom: 10, fontSize: "18px" }}
      format="DD.MM.YYYY"
    />
    </ConfigProvider>
  </Col>
  <Col>
    {/* Кнопка для сортировки */}
    <Dropdown menu={{ items: menuItems, onClick: handleSortEventChange }} trigger={["click"]}>
      <Button style={{ marginBottom: 10, width: 170, fontSize: "16px" }}>
      <UnorderedListOutlined />
        Сортировка <DownOutlined style={{ fontSize: "16px" }} />
      </Button>
    </Dropdown>
  </Col>
</Row>
<Row gutter={[16, 16]}>
  <Col span={24}>
  <Timeline mode="left" style={{ marginBottom: "20px" }}>
                      {sortEvents(filteredEvents(favouriteEvents), sortEvent).map((event) => (
                          <Col span={24} style={{ fontSize: "16px" }}>
                          {moment(event.event_date).format("DD.MM.YYYY")}
                          <Collapse>
              <Panel
                header={
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <div>
                    <span><h5>{event.title}</h5></span>
                      <div>
                      <div style={{ color: "black", fontSize: "16px", marginTop: "4px" }}>
                    из группы: {lifeLineMap[event.lifeline_id] || "Не указано"}
                  </div>
                </div>
                    </div>
                    <div style={{ display: "flex" }}>
                    <Tooltip title="Редактировать событие">
                      <Button onClick={(e) => { e.stopPropagation(); showEventModal(event.lifeline_id, event)}} type="link" size="large">
                      <EditOutlined />
                      </Button>
                      </Tooltip>
                      <Tooltip title={event.is_favourite ? "Убрать из избранного" : "Добавить в избранное"}>
                  <Button
                     icon={event.is_favourite ? <HeartFilled /> : <HeartOutlined />}
                    onClick={(e) => { e.stopPropagation(); handleToggleFavouriteEvent(event) }}
                    type="link"
                    size="large"
                  />
                </Tooltip>
                      {/* <Tooltip title="Удалить событие">
                      <Button
                        icon={event.is_deleted ? <ReloadOutlined /> : <DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); showDeleteEventConfirm(event)}}
                        type="link"
                        danger={!event.is_deleted}
                        size="large"
                      />
                      </Tooltip> */}
                    </div>
                  </div>
                }
                key={event.id}
              >
                <h5 style={{ margintop: 20 }}>Описание события</h5>
                <p style={{ 
  backgroundColor: '#f5f5f5', 
  padding: '10px', 
  borderRadius: '8px', 
  whiteSpace: 'pre-line', 
  maxWidth: '100%', 
  wordWrap: 'break-word', 
  minHeight: '100px', // Устанавливаем минимальную высоту блока
  fontSize: "16px"
}}>{event.description}</p>
                <p style={{ fontSize: "16px" }}>{moment(event.event_date).format("DD.MM.YYYY")}</p>
                      {/* Кнопка добавления файлов */}
      <Upload
        action={`${process.env.REACT_APP_API_URL}/api/Photo?event_id=${event.id}`}
        listType="picture-card"
        showUploadList={false}
        multiple={true}
        onChange={handleUploadChange(event.id)} // Обработчик изменения состояния загрузки
      >
        <button style={{ border: 0, background: "none" }} type="button">
          <PlusOutlined />
          <div style={{ marginTop: 8, fontSize: "16px" }}>Добавить файлы</div>
        </button>
      </Upload>
                <div style={{ display: "flex", alignItems: "center" }}>
      {eventPhotos[event.id] && eventPhotos[event.id].length > 0 && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginRight: "10px", marginTop: "20px" }}>
          {eventPhotos[event.id].map((file) => {
            const extension = file.url.split('.').pop().toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
            const isVideo = ['mp4', 'webm', 'ogg'].includes(extension);
            const isAudio = ['mp3', 'wav', 'ogg'].includes(extension);
            const isDocument = Object.keys(fileIcons).includes(extension);

return (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
  <div
    key={file.id}
    style={{
      position: "relative",
      borderRadius: "8px",
      overflow: "hidden",
      width: 100,
      height: 100,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      cursor: "pointer",
      backgroundColor: "#f0f0f0",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
    onClick={() => openDocument(file.url, file.url, setVideoUrl, setModalVisible, setAudioUrl, setAudioModalVisible)}
  >
    {isImage ? (
      <Image
        src={`${process.env.REACT_APP_API_URL}${file.url}`}
        width="100%"
        height="100%"
        style={{ objectFit: "cover" }}
      />
    ) : isVideo ? (
      <>
        <PlayCircleOutlined
          style={{
            fontSize: "36px",
            color: "#fff",
            position: "absolute",
            zIndex: 2,
          }}
        />
        <video
          src={`${process.env.REACT_APP_API_URL}${file.url}`}
          width="100%"
          height="100%"
          style={{ objectFit: "cover", opacity: 0.7 }}
          muted
        />
      </>
    ) : isAudio ? (
      <>
        <SoundOutlined
          style={{
            fontSize: "36px",
            color: "#000",
            position: "absolute",
            zIndex: 2,
          }}
        />
        <audio
          src={`${process.env.REACT_APP_API_URL}${file.url}`}
          style={{ display: "none" }}
        />
      </>
    ) : isDocument ? (
      <img
        src={fileIcons[extension]}
        alt={extension}
        style={{ width: "80%", height: "80%", objectFit: "contain" }}
      />
    ) : (
      <span style={{ fontSize: 24 }}>📄</span> // Иконка по умолчанию
    )}

<Button
  icon={<DeleteOutlined />}
  size="small"
  danger
  style={{ position: "absolute", top: 5, right: 5 }}
  onClick={(e) => showDeletePhotoConfirm(file.id, event.id, e)}
/>
    <Button
      icon={<DownloadOutlined />}
      size="small"
      style={{ position: "absolute", top: 70, right: 5 }}
      onClick={() => {
        const downloadUrl = `${process.env.REACT_APP_API_URL}${file.url}`;
        window.open(downloadUrl, '_blank');
      }}
    />
  </div>
  {/* Название файла отдельным блоком */}
<span
  style={{
    fontSize: "12px",
    color: "#333",
    whiteSpace: "normal", // Разрешаем перенос строк
    wordBreak: "break-word", // Разрешаем разрыв длинных слов
    maxWidth: "100px",
    textAlign: "center",
  }}
  title={file.description} // Полное имя при наведении
>
  {file.description}
</span>
  </div>
);
          })}
        </div>
      )}

      {/* Модальное окно для видео */}
      <Modal
      open={modalVisible}
      footer={null}
      onCancel={handleVideoCancel}
      centered
      width={800}
    >
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          style={{ width: '100%' }}
        />
      )}
    </Modal>
    <Modal
  open={audioModalVisible}
  footer={null}
  onCancel={handleAudioCancel}
  centered
  width={600}
>
  {audioUrl && (
    <audio ref={audioRef} src={audioUrl} controls autoPlay style={{ width: "100%" }} />
  )}
</Modal>

{/* Показываем индикаторы загрузки */}
{uploadingFiles[event.id] && Object.keys(uploadingFiles[event.id]).length > 0 && (
  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginRight: "10px" }}>
    {Object.keys(uploadingFiles[event.id]).map((fileId) => (
      <div
        key={fileId}
        style={{
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
          width: 100,
          height: 100,
          backgroundColor: "#f0f0f0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "10px",
        }}
      >
        <LoadingOutlined style={{ fontSize: 36, color: "#1890ff" }} />
        <span style={{ fontSize: "12px", color: "#555", marginTop: "5px" }}>
          Загрузка файла...
        </span>
      </div>
    ))}
  </div>
)}
    </div>
              </Panel>
            </Collapse>
                          </Col>
                        ))}
                      </Timeline>
  </Col>
</Row>

</TabPane>
</Tabs>

<Modal
        title="Подтвердите удаление"
        visible={isModalEventVisible}
        onCancel={handleEventCancel}
        onOk={handleEventOk}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }} // Красная кнопка для удаления
      >
        <p>Вы уверены, что хотите удалить это событие?</p>
      </Modal>

<Modal
        title="Подтвердите удаление"
        visible={isModalDeleteVisible}
        onCancel={handleDeleteCancel}
        onOk={handleOk}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }} // Красная кнопка для удаления
      >
        <p>Вы уверены, что хотите удалить эту группу?</p>
      </Modal>

      {/* Модальные окна для редактирования хронологии и события */}
      <Modal
        title={editingLifeLine ? "Редактировать группу" : "Создать группу"}
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSave}
        cancelText="Отмена" // Заменяем текст кнопки "Cancel" на "Отмена"
        okText="Сохранить"  // Заменяем текст кнопки "OK" на "Сохранить"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название" name="title" rules={[{ required: true, message: "Введите название группы" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="description">
          <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={currentEvent ? "Редактировать событие" : "Создать событие"}
        visible={isEventModalVisible}
        onCancel={handleCancel}
        onOk={handleSaveEventHandler}  // Сохраняем событие
        cancelText="Отмена" // Заменяем текст кнопки "Cancel" на "Отмена"
        okText="Сохранить"  // Заменяем текст кнопки "OK" на "Сохранить"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название" name="title" rules={[{ required: true, message: "Введите название события" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="description">
          <Input.TextArea rows={4} />
          </Form.Item>
          <ConfigProvider locale={ruRU}>
          <Form.Item label="Дата события" name="date" rules={[{ required: true, message: "Выберите дату события" }]}>
            <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
          </Form.Item>
          </ConfigProvider>
        </Form>
      </Modal>

{/* Кнопка для добавления новой хронологии с подсказкой */}
<Tooltip title="Создать группу событий">
  <FloatButton
    icon={<FormOutlined />}
    shape="square"
    type="primary"
    style={{ insetInlineEnd: 24 }}
    onClick={showNewLifeLineModal}
    size="large"
  />
</Tooltip>

      {/* Модальное окно для добавления новой хронологии */}
      <Modal
        title="Создать новую группу"
        visible={isNewLifeLineModalVisible}
        onCancel={handleCancel}
        onOk={handleSaveNewLifeLineHandler}
        cancelText="Отмена" // Заменяем текст кнопки "Cancel" на "Отмена"
        okText="Сохранить"  // Заменяем текст кнопки "OK" на "Сохранить"
      >
        <Form form={newLifeLineForm} layout="vertical">
          <Form.Item
            label="Название"
            name="title"
            rules={[{ required: true, message: "Введите название группы" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="description">
          <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default FavouriteTimeLines;
