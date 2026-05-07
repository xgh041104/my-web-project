import { useState, useEffect } from 'react';

export default function TimeDisplay() {
    const [dateString, setDateString] = useState(new Date().toLocaleString());

    useEffect(() => {
        const id = setInterval(() => {
            const date = new Date();
            setDateString(date.toLocaleString());
        }, 1000);
        return () => clearInterval(id);
    }, []);

    return dateString;
}