// import {makeAutoObservable} from "mobx";

// export default class UserStore {
//     constructor() {
//         this._isAuth = false
//         this._user = {}
//         makeAutoObservable(this)
//     }
//     setIsAuth(bool) {
//         this._isAuth = bool
//     }
//     setUser(user) {
//         this._user = user
//     }

//     get isAuth() {
//         return this._isAuth
//     }
//     get user() {
//         return this._user
//     }
// }

import { makeAutoObservable } from "mobx";

export default class UserStore {
  constructor() {
    this._isAuth = !!localStorage.getItem("token"); // Проверяем, есть ли токен
    this._user = JSON.parse(localStorage.getItem("user")) || {};
    makeAutoObservable(this);
  }

  setIsAuth(bool) {
    this._isAuth = bool;
    if (!bool) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  setUser(user) {
    this._user = user;
    localStorage.setItem("user", JSON.stringify(user)); // Сохраняем данные пользователя
  }

  get isAuth() {
    return this._isAuth;
  }

  get user() {
    return this._user;
  }
}
