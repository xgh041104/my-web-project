import React, { createContext, useContext } from 'react';

interface ArcMenuContextType {
    setChildFn: (data: Function) => void;
}

const defaultContextValue: ArcMenuContextType = {
    setChildFn: () => { },
};

export const ArcMenuContext = createContext<ArcMenuContextType>(defaultContextValue);

export const useArcMenuContext = () => useContext(ArcMenuContext);
