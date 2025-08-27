import React, { createContext, useContext, useState, ReactNode } from "react";

interface StudentBackgroundContextType {
  backgroundClass: string;
  setBackgroundClass: (bgClass: string) => void;
}

const StudentBackgroundContext = createContext<
  StudentBackgroundContextType | undefined
>(undefined);

interface StudentBackgroundProviderProps {
  children: ReactNode;
}

export const StudentBackgroundProvider: React.FC<
  StudentBackgroundProviderProps
> = ({ children }) => {
  const [backgroundClass, setBackgroundClass] = useState<string>("bg-gray-50");

  return (
    <StudentBackgroundContext.Provider
      value={{ backgroundClass, setBackgroundClass }}
    >
      {children}
    </StudentBackgroundContext.Provider>
  );
};

export const useStudentBackground = (): StudentBackgroundContextType => {
  const context = useContext(StudentBackgroundContext);
  if (context === undefined) {
    throw new Error(
      "useStudentBackground must be used within a StudentBackgroundProvider"
    );
  }
  return context;
};
