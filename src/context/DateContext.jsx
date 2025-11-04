import React, {createContext, useState, useContext} from 'react';

const DateContext = createContext();

export const DateProvider = ({children}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const updateDate = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const resetToCurrentDate = () => {
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  return (
    <DateContext.Provider
      value={{
        selectedMonth,
        selectedYear,
        updateDate,
        resetToCurrentDate,
      }}>
      {children}
    </DateContext.Provider>
  );
};

export const useDateContext = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDateContext must be used within a DateProvider');
  }
  return context;
};
