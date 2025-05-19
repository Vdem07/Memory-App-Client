import { getLifeLines, getLifeLineEvents, updateLifeLine, updateLifeLineEvent, createLifeLine, createLifeLineEvent, uploadPhotoToEvent } from '../http/userAPI'; // API функции
import axios from 'axios';
import { message } from 'antd';


export const fetchData = async (userId, setLifeLines, setLoading) => {
  try {
    const lifeLineData = await getLifeLines(userId);

    // Фильтруем удалённые хронологии
    const activeLifeLines = lifeLineData.filter(lifeLine => !lifeLine.is_deleted);

    // Получаем события для активных хронологий и фильтруем удалённые события
    const eventsData = await Promise.all(
      activeLifeLines.map((lifeLine) => 
        getLifeLineEvents(lifeLine.id).then(events => 
          events.filter(event => !event.is_deleted)  // Фильтруем удалённые события
        )
      )
    );

    const eventsWithLifeLine = activeLifeLines.map((lifeLine, index) => ({
      ...lifeLine,
      events: eventsData[index],  // Присваиваем отфильтрованные события
    }));

    setLifeLines((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(eventsWithLifeLine)) {
        return eventsWithLifeLine;
      }
      return prev;
    });
    
    setLoading(false);
  } catch (error) {
    console.error('Ошибка загрузки данных', error);
    setLoading(false);
  }
};



export const handleSaveLifeLine = async (
  form,
  editingLifeLine,
  setLifeLines,
  setIsModalVisible
) => {
  try {
    const values = form.getFieldsValue();
    if (editingLifeLine) {
      const updatedLifeLine = { ...editingLifeLine, ...values };
      await updateLifeLine(updatedLifeLine);

      setLifeLines((prev) =>
        prev.map((lifeLine) =>
          lifeLine.id === updatedLifeLine.id ? updatedLifeLine : lifeLine
        )
      );

      setIsModalVisible(false);
      message.success("Изменения сохранены");
    }
  } catch (error) {
    console.error("Ошибка при сохранении изменений:", error);
    message.error("Не удалось сохранить изменения");
  }
};

export const toggleFavouriteEvent = async (event, setLifeLines) => {
  try {
    const updatedEvent = { ...event, is_favourite: !event.is_favourite };
    await updateLifeLineEvent(updatedEvent);

    setLifeLines((prevLifeLines) =>
      prevLifeLines.map((lifeLine) =>
        lifeLine.id === updatedEvent.lifeline_id
          ? {
              ...lifeLine,
              events: lifeLine.events.map((eventItem) =>
                eventItem.id === updatedEvent.id ? updatedEvent : eventItem
              ),
            }
          : lifeLine
      )
    );

    message.success(
      updatedEvent.is_favourite
        ? "Событие добавлено в избранное"
        : "Событие удалено из избранного"
    );
  } catch (error) {
    console.error("Ошибка при обновлении избранного события:", error);
    message.error("Не удалось обновить избранное состояние события");
  }
};


export const toggleFavourite = async (lifeLine, setLifeLines) => {
  try {
    const updatedLifeLine = { ...lifeLine, is_favourite: !lifeLine.is_favourite };
    await updateLifeLine(updatedLifeLine);

    setLifeLines((prevLifeLines) =>
      prevLifeLines.map((lifeLineItem) =>
        lifeLineItem.id === updatedLifeLine.id ? updatedLifeLine : lifeLineItem
      )
    );

    message.success(
      updatedLifeLine.is_favourite
        ? "Группа добавлена в избранное"
        : "Группа удалена из избранного"
    );
  } catch (error) {
    console.error('Ошибка при обновлении избранного:', error);
    message.error("Не удалось обновить избранное состояние группы");
  }
};

export const handleDeleteLifeLine = async (lifeLine, setLifeLines) => {
  try {
    const updatedLifeLine = {
      ...lifeLine,
      is_deleted: !lifeLine.is_deleted,
      is_favourite:
        lifeLine.is_deleted && lifeLine.is_favourite ? false : lifeLine.is_favourite,
    };

    await updateLifeLine(updatedLifeLine);

    // Если хронология удаляется, сбрасываем is_favourite для всех событий
    if (updatedLifeLine.is_deleted) {
      updatedLifeLine.events = updatedLifeLine.events.map((event) => ({
        ...event,
        is_favourite: false,
      }));

      const updatePromises = updatedLifeLine.events.map((event) =>
        updateLifeLineEvent(event)
      );
      await Promise.all(updatePromises);
    }

    setLifeLines((prevLifeLines) =>
      prevLifeLines.map((lifeLineItem) =>
        lifeLineItem.id === updatedLifeLine.id ? updatedLifeLine : lifeLineItem
      )
    );

    message.success(
      updatedLifeLine.is_deleted
        ? "Группа перемещена в корзину"
        : "Группа восстановлена"
    );
  } catch (error) {
    console.error("Ошибка при обновлении хронологии:", error);
    message.error("Не удалось обновить состояние группы");
  }
};


export const handleDeleteEvent = async (event, setLifeLines) => {
  try {
    const updatedEvent = {
      ...event,
      is_deleted: !event.is_deleted,
      is_favourite:
        event.is_deleted && event.is_favourite ? false : event.is_favourite,
    };

    await updateLifeLineEvent(updatedEvent);

    setLifeLines((prevLifeLines) =>
      prevLifeLines.map((lifeLine) =>
        lifeLine.id === updatedEvent.lifeline_id
          ? {
              ...lifeLine,
              events: lifeLine.events.map((eventItem) =>
                eventItem.id === updatedEvent.id ? updatedEvent : eventItem
              ),
            }
          : lifeLine
      )
    );

    message.success(
      updatedEvent.is_deleted
        ? "Событие перемещено в корзину"
        : "Событие восстановлено"
    );
  } catch (error) {
    console.error("Ошибка при обновлении события:", error);
    message.error("Не удалось обновить состояние события");
  }
};


export const handleSaveEvent = async (
  form,
  currentEvent,
  currentLifeLineId,
  setLifeLines,
  setIsEventModalVisible
) => {
  try {
    const values = form.getFieldsValue();

    if (currentEvent) {
      // Обновление события
      const updatedEvent = {
        ...currentEvent,
        ...values,
        event_date: values.date.format('YYYY-MM-DD'),
      };

      await updateLifeLineEvent(updatedEvent);

      setLifeLines((prevLifeLines) =>
        prevLifeLines.map((lifeLine) =>
          lifeLine.id === currentEvent.lifeline_id
            ? {
                ...lifeLine,
                events: lifeLine.events.map((event) =>
                  event.id === updatedEvent.id ? updatedEvent : event
                ),
              }
            : lifeLine
        )
      );

      message.success("Изменения сохранены");
    } else {
      // Создание нового события
      const newEvent = {
        title: values.title,
        description: values.description,
        event_date: values.date.format('YYYY-MM-DD'),
        lifeline_id: currentLifeLineId,
      };

      const createdEvent = await createLifeLineEvent(newEvent);

      setLifeLines((prevLifeLines) =>
        prevLifeLines.map((lifeLine) =>
          lifeLine.id === currentLifeLineId
            ? {
                ...lifeLine,
                events: [...lifeLine.events, createdEvent],
              }
            : lifeLine
        )
      );

      message.success("Событие успешно создано");
    }

    setIsEventModalVisible(false);
  } catch (error) {
    console.error("Ошибка при сохранении события:", error);
    message.error("Не удалось сохранить событие");
  }
};

export const handleToggleDeletedEvent = async (event, setLifeLines) => {
  try {
    const updatedEvent = { ...event, is_deleted: !event.is_deleted };
    const response = await updateLifeLineEvent(updatedEvent);
    setLifeLines((prevLifeLines) =>
      prevLifeLines.map((lifeLine) => ({
        ...lifeLine,
        events: lifeLine.events.map((ev) => (ev.id === event.id ? response : ev)),
      }))
    );
  } catch (error) {
    console.error("Ошибка при изменении статуса события:", error);
  }
};

export const handleSaveNewLifeLine = async (
  newLifeLineForm,
  user,
  setLifeLines,
  setIsNewLifeLineModalVisible
) => {
  try {
    const values = newLifeLineForm.getFieldsValue();
    const newLifeLine = {
      ...values,
      user_id: user.user.id,
    };

    const createdLifeLine = await createLifeLine(newLifeLine);

    setLifeLines((prev) => [...prev, { ...createdLifeLine, events: [] }]);
    setIsNewLifeLineModalVisible(false);

    message.success("Группа успешно создана");
  } catch (error) {
    console.error("Ошибка при создании новой группы:", error);
    message.error("Не удалось создать группу");
  }
};


export const handleFileUpload = async (file, eventId, setLifeLines) => {
  try {
    const formData = new FormData();
    formData.append('file', file.originFileObj);

    const response = await uploadPhotoToEvent(formData, eventId);

    if (response && response.url) {
      message.success('Файл успешно загружен');
      
      setLifeLines(prevLifeLines => 
        prevLifeLines.map(lifeLine => 
          lifeLine.id === eventId 
            ? { ...lifeLine, photos: [...(lifeLine.photos || []), response] } 
            : lifeLine
        )
      );
    } else {
      message.error('Ошибка при загрузке файла');
    }
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    message.error('Не удалось загрузить файл');
  }
};


