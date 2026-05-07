import React, { useEffect } from 'react';
import { history, useLocation } from 'umi';
import { Link, useLocation as useReactRouterLocation } from 'react-router-dom';
import './layout.less';

const generateOverview = (props) => {
  const location = useLocation();
  const reactRouterLocation = useReactRouterLocation();

  useEffect(() => {
    if (location.pathname === '/teach/aiGeneration') {
      history.replace('/teach/aiGeneration/generateOverview/syllabusGeneration');
    }
  }, [location.pathname]);

  return (
    <div>
      <div className="sub-nav">
        <Link
          to="/teach/aiGeneration/generateOverview/syllabusGeneration"
          className={reactRouterLocation.pathname === '/teach/aiGeneration/generateOverview/syllabusGeneration' ? 'active' : ''}
        >
          教学大纲生成
        </Link>
        <Link
          to="/teach/aiGeneration/generateOverview/teachPlanGeneration"
          className={reactRouterLocation.pathname === '/teach/aiGeneration/generateOverview/teachPlanGeneration' ? 'active' : ''}
        >
          教案生成
        </Link>
        <Link
          to="/teach/aiGeneration/generateOverview/pptGeneration"
          className={reactRouterLocation.pathname === '/teach/aiGeneration/generateOverview/pptGeneration' ? 'active' : ''}
        >
          PPT课件生成
        </Link>
      </div>
      <div className="fade-container">
        {props.children}
      </div>
    </div>
  );
};

export default generateOverview;
