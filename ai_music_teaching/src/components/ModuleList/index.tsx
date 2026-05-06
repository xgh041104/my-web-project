import React from 'react';
import { FileImageFilled } from '@ant-design/icons';
import './index.css';
import { useHistory } from 'umi';
import { useDispatch } from 'dva';
import { message, Image } from 'antd';
import { baseUrl } from '../../utils/config';

export interface ModuleInfo {
  key: string;
  title: string;
  pathname: string;
  desc?: React.ReactNode;
  icon?: React.ReactNode;
  background?: string;
  children?: ModuleInfo[];
}
interface Props {
  dataSource: ModuleInfo[]
  title: string;
  desc?: React.ReactNode;
}

interface moduleTD{
  title: string;
  desc?: React.ReactNode;
}


export default function ModuleList({ dataSource, title, desc }: Props) {

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [menuItems, setMenuItems] = React.useState<ModuleInfo[]>([]);
  const [moduleInfo, setModuleInfo] = React.useState<moduleTD>();

  const dispatch = useDispatch();
  const history = useHistory();
  const handleModuleClick = ({ pathname, key, title, children, desc }: ModuleInfo) => {
    // history.push({ pathname })
    // dispatch({
    //     type: "user/changeModule", payload: {
    //         moduleInfo: {
    //             moduleKey: key,
    //             moduleName: title
    //         },
    //         pathname
    //     }
    // })
    // history.push({ pathname })
    if (children) {
      setIsModalVisible(true);
      setMenuItems(children);
      setModuleInfo({ title, desc });
      return;
    }
    if (!pathname) {
      message.warn('功能暂未开放', 3);
      return;
    }
    history.push({
      pathname, state: {
        moduleInfo: {
          moduleKey: key,
          moduleName: title
        }
      }
    })
  }

  const handleModalClose = () => {
    setIsModalVisible(false);
  };


  return <>
    {isModalVisible ? (<>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ marginTop: '.5rem', fontSize: '.4rem', fontWeight: 800 }}>{moduleInfo && moduleInfo.title || '功能模块'}</h2>
        <p style={{ marginBottom: '.2rem', fontSize: '.25rem', color: '#6D6E6E' }}>{moduleInfo && moduleInfo.desc || '请选择功能模块'}</p>
      </div>
      <div className='moduleLists'>
        {menuItems.map((item, index) => (
          <div key={item && item.key || index} style={{ backgroundColor: item.background }}
            className='ant-btn moduleBtns' onClick={() => { handleModuleClick(item); handleModalClose() }}>
            {item && <>{item.icon}
              <div>
                <div className='card-titles'>{item.title}</div>
                <div className='card-descs'>{item.desc}</div>
              </div></>}
          </div>
        ))}
      </div>
      <div onClick={handleModalClose} style={{
        backgroundColor: 'rgb(247, 160, 85)',
        width: '.6rem',
        height: '.6rem',
        borderRadius: '.1rem',
        top: '83vh',
        right: '5vw', cursor: 'pointer',
        position: 'absolute',
      }}>
        <Image src={baseUrl + '/image/teach/bookTeach/bookPage/rollBack.png'} preview={false} style={{ width: ".5rem",  height: ".5rem", margin: ".05rem 0 0 .05rem" }} />
      </div>
    </>
    ) :
      (<>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ marginTop: '.5rem', fontSize: '.4rem', fontWeight: 800 }}>{title}</h2>
          <p style={{ marginBottom: '.2rem', fontSize: '.25rem', color: '#6D6E6E' }}>{desc}</p>
        </div>
        <div className='moduleList'>
          {dataSource.map((item, index) =>
            <div key={item && item.key || index} style={{ backgroundColor: item.background }}
              className='ant-btn moduleBtn' onClick={() => handleModuleClick(item)}>
              {item && <>{item.icon}
                <div>
                  <div className='card-title'>{item.title}</div>
                  <div className='card-desc'>{item.desc}</div>
                </div></>}
            </div>)}
        </div>

      </>)}
  </>
}