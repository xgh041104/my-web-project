import React from 'react';
import GenerateOverview from './generateOverview/_layout';
import SyllabusGeneration from './generateOverview/syllabusGeneration';

export default function index({ children }) {
  return (
    <div>
      <GenerateOverview>
        {children || <SyllabusGeneration />}
      </GenerateOverview>
    </div>
  );
}
