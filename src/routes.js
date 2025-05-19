import Auth from "./pages/Auth";
import Main from "./pages/Main";
import Deleted from "./pages/DeletedTimeLines";
import Favourite from "./pages/FavouriteTimeLines";
import DocsViewer from "./components/DocsViewer";
import { Component } from "react";
import { AUTH_ROUTE, DELETE_ROUTE, FAVOUR_ROUTE, MAIN_ROUTE, REGISTRATION_ROUTE, DOCS_ROUTE } from "./utils/consts";

export const AuthRoutes = [
    {
        path: MAIN_ROUTE,
        Component: Main
    },

    {
        path: DELETE_ROUTE,
        Component: Deleted
    },
    {
        path: FAVOUR_ROUTE,
        Component: Favourite
    },
    {
        path: DOCS_ROUTE,
        Component: DocsViewer
    }
]

export const PublicRoutes = [
    {
        path: AUTH_ROUTE,
        Component: Auth
    },
    {
        path: REGISTRATION_ROUTE,
        Component: Auth
    },
]