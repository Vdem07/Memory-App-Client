import React, { useState, useEffect, useContext, useRef } from 'react';
import { Collapse, Row, Col, Spin, Button, Modal, message, Image, Timeline, Dropdown, Tooltip, Tabs } from "antd";
import { ReloadOutlined, DeleteOutlined, UnorderedListOutlined, DownOutlined, PlayCircleOutlined, DownloadOutlined, SoundOutlined, LoadingOutlined } from '@ant-design/icons';
import { getLifeLines, getLifeLineEvents, deleteLifeLine, deleteLifeLineEvent, getEventPhotos } from "../http/userAPI";
import { Context } from "../index";  // Для получения текущего пользователя
import { observer } from "mobx-react-lite";
import moment from "moment"; // Импортируем moment для работы с датами
import { handleDeleteLifeLine, handleDeleteEvent } from '../utils/ClientUtils'; // Импортируем функции

const { Panel } = Collapse;

const { TabPane } = Tabs;

const DeletedLifeLines = observer(() => {
  // Состояние для хранения данных хронологий и событий
  const [lifeLines, setLifeLines] = useState([]); // Все хронологии
  const [lifeLineMap, setLifeLineMap] = useState({}); // Отображение ID хронологии на ее название
  const [deletedEvents, setDeletedEvents] = useState([]); // Удаленные события
  const [deletedLifeLines, setDeletedLifeLines] = useState([]); // Удаленные хронологии
  const [loading, setLoading] = useState(true); // Индикатор загрузки
  const { user } = useContext(Context); // Получаем текущего пользователя из контекста

  const [eventPhotos, setEventPhotos] = useState({}); // Фото событий

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

  const showDeleteConfirm = (lifeLine) => {
    // Устанавливаем выбранную хронологию и показываем модальное окно
    setCurrentLifeLine(lifeLine);
    setIsModalDeleteVisible(true);
  };

  const handleDeleteCancel = (e) => {
    // Закрываем модальное окно без выполнения удаления
    e.stopPropagation();
    setIsModalDeleteVisible(false);
  };

  const handleOk = () => {
    // Выполняем удаление выбранной хронологии
    if (currentLifeLine) {
      handlePermanentDeleteLifeLine(currentLifeLine.id);
    }
    setIsModalDeleteVisible(false); // Закрываем модальное окно после удаления
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

  const handleEventOk = (e) => {
    // Выполняем удаление выбранного события
    e.stopPropagation();
    if (currentDeleteEvent) {
      handlePermanentDeleteEvent(currentDeleteEvent.id);
    }
    setIsModalEventVisible(false); // Закрываем модальное окно после удаления
  };

  const fetchLifeLinesAndEvents = async () => {
    try {
      const allLifeLines = await getLifeLines(user.user.id);  // Получаем все хронологии
      const eventsData = await Promise.all(
        allLifeLines.map((lifeLine) => getLifeLineEvents(lifeLine.id)) // Получаем события для всех хронологий
      );

      // Создаем объект, который маппит lifeLine_id на название хронологии
      const lifeLineMap = allLifeLines.reduce((map, lifeLine) => {
        map[lifeLine.id] = lifeLine.title;
        return map;
      }, {});
      setLifeLineMap((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(lifeLineMap)) {
          return lifeLineMap;
        }
        return prev;
      });
      

      // Объединяем хронологии с их событиями
      const lifeLinesWithEvents = allLifeLines.map((lifeLine, index) => ({
        ...lifeLine,
        events: eventsData[index],  // Добавляем события в хронологию
      }));

      // Фильтруем удаленные хронологии
      const filteredDeletedLifeLines = lifeLinesWithEvents.filter((lifeLine) => lifeLine.is_deleted);
      setDeletedLifeLines((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(filteredDeletedLifeLines)) {
          return filteredDeletedLifeLines;
        }
        return prev;
      });
      

      // Separate events into two categories:
      const deletedEvents = [];
      const nonDeletedEvents = [];
      
      lifeLinesWithEvents.forEach((lifeLine) => {
        lifeLine.events.forEach((event) => {
          if (event.is_deleted) {
            if (lifeLine.is_deleted) {
              deletedEvents.push(event); // Event belongs to a deleted life line
            } else {
              nonDeletedEvents.push(event); // Event belongs to a non-deleted life line
            }
          }
        });
      });

      // Фильтруем все удаленные события (независимо от состояния хронологии)
      const filteredDeletedEvents = lifeLinesWithEvents.flatMap((lifeLine) =>
        lifeLine.events.filter((event) => event.is_deleted)
      );
      setDeletedEvents((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(filteredDeletedEvents)) {
          return filteredDeletedEvents;
        }
        return prev;
      });      

      setLoading(false); // Загружено
    } catch (error) {
      console.error("Ошибка загрузки удаленных линий жизни", error);
      setLoading(false);
    }
  };

  // Загружаем хронологии и события при монтировании компонента
  useEffect(() => {
    fetchLifeLinesAndEvents(); // Вызов функции для загрузки данных
  }, [user.user.id]);  // Загружаем при изменении user.id

  // Восстановление хронологии
  const handleRestoreLifeLineHandler = async (lifeLineId) => {
    await handleDeleteLifeLine(lifeLineId, setDeletedLifeLines, true);
    await fetchLifeLinesAndEvents(); // 🔄 Обновляем данные
  };
  

  // Удаление события
  const handleDeleteEventHandler = async (currentEvent) => {
    await handleDeleteEvent(currentEvent, setLifeLines);
    await fetchLifeLinesAndEvents();
  };

  // Удаление хронологии навсегда
  const handlePermanentDeleteLifeLine = async (lifeLineId) => {
    try {
      await deleteLifeLine(lifeLineId);
      message.success("Группа удалена");
      await fetchLifeLinesAndEvents(); // 🔄 Обновляем данные
    } catch (error) {
      message.error("Ошибка при удалении хронологии");
    }
  };
  

  // Удаление события навсегда
  const handlePermanentDeleteEvent = async (eventId) => {
    try {
      await deleteLifeLineEvent(eventId);
      message.success("Событие удалено навсегда");
      await fetchLifeLinesAndEvents(); // 🔄 Обновляем данные
    } catch (error) {
      message.error("Ошибка при удалении события");
    }
  };  

  // Загрузка фото для события
  const loadEventPhotos = async (eventId) => {
    try {
      const photos = await getEventPhotos(eventId);
      setEventPhotos((prev) => ({ ...prev, [eventId]: photos }));
    } catch (error) {
      console.error("Ошибка загрузки фото:", error);
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

// Пункты меню для сортировки
const menuItems = [
{ label: "От новых к старым", key: "newest" },
{ label: "От старых к новым", key: "oldest" },
{ label: "От А до Я", key: "a-z" },
{ label: "От Я до А", key: "z-a" },
];

const handleSortEventChange = ({ key }) => {
  setSortEvent(key);
};

  // Загружаем фотографии событий после изменения списка удаленных хронологий и событий
  useEffect(() => {
    deletedLifeLines.forEach(lifeLine => {
      lifeLine.events.forEach(event => {
        loadEventPhotos(event.id);
      });
    });
  }, [deletedLifeLines]);

  useEffect(() => {
    deletedEvents.forEach(event => {
      loadEventPhotos(event.id);
    });
  }, [deletedEvents]);

  // Если загрузка еще не завершена, показываем индикатор загрузки
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
      
            <TabPane tab="Удаленные группы" key="1">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Collapse accordion style={{ width: "100%" }}>
            {/* Перебор всех удаленных хронологий */}
            {deletedLifeLines.map((lifeLine) => (
              <Panel
                header={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{lifeLine.title}</h3>
                      <div style={{ color: "black", fontSize: "16px", marginTop: "4px" }}>
                        Дата создания: {moment(lifeLine.createdAt).format("DD.MM.YYYY HH:mm")}
                      </div>
                    </div>
                    <div style={{ display: "flex" }}>
                      {/* Кнопка для восстановления хронологии */}
                      <Tooltip title="Восстановить группу">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => handleRestoreLifeLineHandler(lifeLine)} // Восстановить хронологию
                        type="link"
                        size="large"
                      />
                      </Tooltip>
                      {/* Кнопка для постоянного удаления хронологии */}
                      <Tooltip title="Удалить группу безвозвратно">
        <Button
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            showDeleteConfirm(lifeLine); // Показать модальное окно для подтверждения
          }}
          type="link"
          danger
          size="large"
        />
      </Tooltip>

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
                        {sortEvents(lifeLine.events.filter(event => !event.is_deleted), sortEvent).map((event) => (
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
                    <Tooltip title="Удалить событие">
                      <Button
                        icon={event.is_deleted ? <ReloadOutlined /> : <DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleDeleteEventHandler(event)}}
                        type="link"
                        danger={!event.is_deleted}
                        size="large"
                      />
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
  minHeight: '100px', // Устанавливаем минимальную высоту блока
  fontSize: "16px"
}}>{event.description}</p>
                <p style={{ fontSize: "16px" }}>{moment(event.event_date).format("DD.MM.YYYY")}</p>
                <div style={{ display: "flex", alignItems: "center" }}>
      {eventPhotos[event.id] && eventPhotos[event.id].length > 0 && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginRight: "10px" }}>
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

              </Panel>
            ))}
          </Collapse>
        </Col>
      </Row>

            {/* Модальное окно для подтверждения безвозвратного удаления */}
            <Modal
        title="Подтвердите безвозвратное удаление"
        visible={isModalDeleteVisible}
        onCancel={handleDeleteCancel}
        onOk={handleOk}
        okText="Удалить навсегда"
        cancelText="Отмена"
        okButtonProps={{ danger: true }} // Красная кнопка для удаления
      >
        <p>Вы уверены, что хотите безвозвратно удалить эту группу? Это действие нельзя отменить.</p>
      </Modal>
      </TabPane>





      




      <TabPane tab="Удаленные события" key="2">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Collapse accordion style={{ width: "100%" }}>
            {/* Перебор всех удаленных событий */}
            {deletedEvents.map((event) => (
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
                      {/* Кнопка для восстановления события */}
                      <Tooltip title="Восстановить событие">
                      <Button
                        icon={event.is_deleted ? <ReloadOutlined /> : <DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleDeleteEventHandler(event)}} 
                        type="link" 
                        danger={!event.is_deleted}
                        size="large"
                      />
                      </Tooltip>
                      {/* Кнопка для постоянного удаления события */}
                      <Tooltip title="Удалить событие безвозвратно">
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); showDeleteEventConfirm(event)}}
                        type="link"
                        danger
                        size="large"
                      />
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
  minHeight: '100px', // Устанавливаем минимальную высоту блока
  fontSize: "16px"
}}>{event.description}</p>
                <p style={{ fontSize: "16px" }}>{moment(event.event_date).format("DD.MM.YYYY")}</p>
                {/* Показываем фото события */}
                <div style={{ display: "flex", alignItems: "center" }}>
      {eventPhotos[event.id] && eventPhotos[event.id].length > 0 && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginRight: "10px" }}>
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
            ))}
          </Collapse>
        </Col>
      </Row>
                            {/* Модальное окно для подтверждения безвозвратного удаления */}
                            <Modal
        title="Подтвердите безвозвратное удаление"
        visible={isModalEventVisible}
        onCancel={handleEventCancel}
        onOk={handleEventOk}
        okText="Удалить навсегда"
        cancelText="Отмена"
        okButtonProps={{ danger: true }} // Красная кнопка для удаления
      >
        <p>Вы уверены, что хотите безвозвратно удалить это событие? Это действие нельзя отменить.</p>
      </Modal>
            </TabPane>
            </Tabs>
    </div>
  );
});

export default DeletedLifeLines;
