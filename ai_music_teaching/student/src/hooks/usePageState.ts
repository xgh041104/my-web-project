import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from '@umijs/max';

export default function usePageState(namespace: string, pageModelName: string = "lastPage") {
    const defaultPage = useSelector(state => (state as any)[namespace][pageModelName])||1;
    const [currentPage, setCurrentPage] = useState<number>(defaultPage);
    const currentPageRef = useRef<number>(defaultPage);
    const dispatch = useDispatch();

    useEffect(() => () => {
        // console.log("update last page in clean up", currentPageRef.current);
        dispatch({ type: `${namespace}/updateState`, payload: { [pageModelName]: currentPageRef.current } });
    }, [])

    return {
        onChange: (page: number, pageSize: number) => {
            // console.log("page change", page, pageSize);
            setCurrentPage(page);
            currentPageRef.current = page;
        },
        current: currentPage
    }
}
