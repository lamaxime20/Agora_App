import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const openModal = (notification = null) => {
    console.log('Ouverture du modal, notification:', notification);
    setSelectedNotification(notification);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showModal, openModal, closeModal, selectedNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);