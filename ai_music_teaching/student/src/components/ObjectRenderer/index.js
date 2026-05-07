function ObjectRenderer({objectContent}) {
    const renderValue = (value) => {
        if (Array.isArray(value)) {
            return (
                <ul>
                    {value.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            );
        } else if (typeof value === 'object' && value !== null) {
            return (
                <ul>
                    {Object.entries(value).map(([subKey, subValue], index) => (
                        <li key={index}><strong>{subKey}:</strong> {renderValue(subValue)}</li>
                    ))}
                </ul>
            );
        } else {
            return <span>{value}</span>;
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <ul>
                {Object.entries(objectContent).map(([key, value], index) => (
                    <li key={index}>
                        <strong>{key}:</strong> {renderValue(value)}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ObjectRenderer