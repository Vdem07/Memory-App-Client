// import React, { useContext } from "react";
// import {Routes, Route, Navigate} from 'react-router-dom';
// import { AuthRoutes, PublicRoutes } from "../routes";
// import { AUTH_ROUTE } from "../utils/consts";
// import { Context } from "../index";
// import { observer } from "mobx-react-lite";
// import LeftPanel from "./LeftPanel";

// const AppRouter = observer(() => {
//     const {user} = useContext(Context);
//     console.log(user);
//     console.log(user.isAuth);
//     return (
//         <Routes>
         
//             {user.isAuth === true && AuthRoutes.map(({path, Component}) =>
//                 <Route key={path} path={path} element={<LeftPanel />}>
//                 <Route key={path} path={path} Component={Component} exact></Route>
//                 </Route>
//             )}
            
//             {PublicRoutes.map(({path, Component}) =>
//                 <Route key={path} path={path} Component={Component} exact></Route>
//             )}
//             <Route path="*" element={<Navigate to={AUTH_ROUTE} />} />
//         </Routes>
//     );
// });
// export default AppRouter;

import React, { useContext, useEffect } from "react"; 
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthRoutes, PublicRoutes } from "../routes";
import { AUTH_ROUTE, MAIN_ROUTE } from "../utils/consts";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import LeftPanel from "./LeftPanel";
import YandexAuthRedirect from "../pages/YandexAuthRedirect";

const AppRouter = observer(() => {
    const { user } = useContext(Context);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        const loginTime = localStorage.getItem("loginTime");

        if (storedUser && storedToken && loginTime) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - parseInt(loginTime, 10);

            if (timeDiff < 30 * 24 * 60 * 60 * 1000) { // 24 часа * 30 дней
                user.setUser(JSON.parse(storedUser));
                user.setIsAuth(true);
            } else {
                // Если токен старый — очищаем localStorage
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                localStorage.removeItem("loginTime");
            }
        }
    }, [user]);

    return (
        <Routes>
         {user.isAuth === true ? (
                <Route path="/" element={<Navigate to={MAIN_ROUTE} />} />
            ) : (
                <Route path="/" element={<Navigate to={AUTH_ROUTE} />} />
            )}
            {user.isAuth === true && AuthRoutes.map(({ path, Component }) => (
                <Route key={path} path={path} element={<LeftPanel />}>
                    <Route key={path} path={path} Component={Component} exact />
                </Route>
            ))}
            
            {PublicRoutes.map(({ path, Component }) => (
                <Route key={path} path={path} Component={Component} exact />
            ))}
            <Route path="/yandex-auth" element={<YandexAuthRedirect />} />
            <Route path="*" element={<Navigate to={AUTH_ROUTE} />} />
        </Routes>
    );
});

export default AppRouter;
