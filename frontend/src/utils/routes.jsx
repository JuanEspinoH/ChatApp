// src/utils/routes.jsx
import { createBrowserRouter } from 'react-router-dom'
import RootLayout from '../components/Layout.jsx'
import Home from '../views/Home.jsx'
import Login from '../views/Login.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: '/login',
        element: <Login />,
      },
    ],
  },
])
