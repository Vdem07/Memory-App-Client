import { $authHost, $host } from "./index";
import { jwtDecode } from "jwt-decode";
import { message } from "antd";

export const googleLogin = async (token) => {
  const { data } = await $host.post("api/User/googleAuth", { token });

  // ✅ Теперь data содержит { token, user }
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
};

export const yandexLogin = async (token) => {
  const { data } = await $host.post("api/User/yandexAuth", { token });

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
};


// Функция регистрации
export const registration = async (name, email, password) => {
  const { data } = await $host.post("api/User/registration", { name, email, password });
  return jwtDecode(data.token);
};

// Функция логина
export const login = async (email, password) => {
  const { data } = await $host.post("api/User/login", { email, password });
  return jwtDecode(data.token);
};

// Проверка пользователя
export const check = async () => {
  const response = await $host.post("api/User/registration");
  return response;
};

// 🔹 Новая функция: Получение "Линий жизни"
export const getLifeLines = async (userId) => {
    try {
      const { data } = await $host.get(`api/LifeLine?userId=${userId}`);  // Передаем userId
      return data;
    } catch (error) {
      console.error("Ошибка загрузки линий жизни:", error);
      return [];
    }
  };
  

// 🔹 Новая функция: Обновление линии жизни
export const updateLifeLine = async (lifeLine) => {
    try {
      const { data } = await $host.put(`api/LifeLine/${lifeLine.id}`, lifeLine); // Отправляем обновленные данные на сервер
      return data;
    } catch (error) {
      console.error("Ошибка обновления линии жизни:", error);
      throw error; // Бросаем ошибку для обработки на клиенте
    }
  };

  // Создание новой линии жизни
export const createLifeLine = async (lifeLine) => {
    try {
      const { data } = await $host.post("api/LifeLine", lifeLine); // Отправка данных на сервер
      return data;
    } catch (error) {
      console.error("Ошибка создания хронологии:", error);
      throw error;
    }
};

export const deleteLifeLine = async (lifeLineId) => {
  try {
    await $authHost.delete(`api/LifeLine/${lifeLineId}`);
  } catch (error) {
    console.error("Ошибка при удалении хронологии:", error);
    throw error;
  }
};


// userAPI.js
export const getLifeLineEvents = async (lifeLineId) => {
    try {
      const { data } = await $host.get(`api/LifeLineEvent?lifelineId=${lifeLineId}`); // добавляем параметр фильтрации
      return data;
    } catch (error) {
      console.error("Ошибка загрузки событий:", error);
      return []; // В случае ошибки возвращаем пустой массив
    }
  };
  
  
  // Создание нового события
  export const createLifeLineEvent = async (lifeLineEvent) => {
    try {
      const { data } = await $host.post("api/LifeLineEvent", lifeLineEvent); // Отправка данных для создания события
      return data;
    } catch (error) {
      console.error("Ошибка создания события:", error);
      throw error;
    }
  };
  
  // Обновление события
  export const updateLifeLineEvent = async (lifeLineEvent) => {
    try {
      const { data } = await $host.put(`api/LifeLineEvent/${lifeLineEvent.id}`, lifeLineEvent); // Отправка данных для обновления события
      return data;
    } catch (error) {
      console.error("Ошибка обновления события:", error);
      throw error;
    }
  };
  
  // Функция для удаления события навсегда
export const deleteLifeLineEvent = async (eventId) => {
  try {
    await $authHost.delete(`api/LifeLineEvent/${eventId}`); // Delete the event by ID
  } catch (error) {
    console.error("Ошибка при удалении события:", error);
    throw error;
  }
};

// Функция для загрузки фото в событие

export const uploadPhotoToEvent = async (formData, eventId) => {
  try {
    const { data } = await $host.post('/api/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { event_id: eventId },
    });

    return data;
  } catch (error) {
    console.error("Ошибка при загрузке фото:", error);
    throw error;
  }
};

// Функция для получения фотографий события
export const getEventPhotos = async (eventId) => {
  try {
    const { data } = await $host.get(`api/Photo?event_id=${eventId}`); // Запрос к API для получения списка фото
    return data;
  } catch (error) {
    console.error("Ошибка при загрузке фото:", error);
    return [];
  }
};

// Функция для удаления фото из базы данных
export const deletePhotoFromEvent = async (photoId, eventId) => {
  try {
    await $host.delete(`api/Photo/${photoId}`, { params: { event_id: eventId } });
    message.success("Файл успешно удален");
  } catch (error) {
    console.error("Ошибка при удалении файла:", error);
    message.error("Ошибка при удалении файла.");
    throw error;
  }
};
