// StudentScreen.tsx
import React, { useEffect, useRef } from 'react';

interface StudentScreenProps {
  studentId: number;
  stream: MediaStream;
}

const StudentScreen: React.FC<StudentScreenProps> = ({ studentId, stream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="student-screen">
      <video
        ref={videoRef}
        id={`student-${studentId}`}
        autoPlay
        muted
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default StudentScreen;
