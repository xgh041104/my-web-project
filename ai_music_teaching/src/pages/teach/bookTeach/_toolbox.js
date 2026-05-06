import React, { useState, useEffect } from 'react'
import clsx from 'clsx';

import styles from './_toolbox.css';
import { CaretRightOutlined, CaretLeftOutlined } from '@ant-design/icons';


function Toolbox({ children, className }) {
  const [active, setActive] = useState(false);

  return <div className={clsx(className, styles.toolbox, active && styles.active)}>
    <div className={styles.foldBtn} onClick={() => setActive(originActive => !originActive)}>
      {active ? <div style={{ display: 'flex', alignItems: 'center', fontSize: '.2rem' }} ><CaretRightOutlined /><span style={{ writingMode: 'vertical-lr', marginRight: '.1rem', fontSize: '.15rem' }}>收起工具栏</span> </div>
        : <div style={{ display: 'flex', alignItems: 'center', fontSize: '.2rem' }}><CaretLeftOutlined /> <span style={{ writingMode: 'vertical-lr', marginRight: '.1rem', fontSize: '.15rem' }}>展开工具栏</span></div>}
    </div>
    <div className={styles.boxContent}>
      {children}
    </div>
  </div>;
}

export default Toolbox;