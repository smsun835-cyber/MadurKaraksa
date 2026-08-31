import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsxs(BrowserRouter, { children: [" ", _jsx(App, {})] }) }));
