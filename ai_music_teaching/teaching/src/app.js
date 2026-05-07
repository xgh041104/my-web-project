import { createLogger } from 'redux-logger';
import { message } from 'antd';

export const dva = {
  config: {
    // onAction: createLogger(),
    onError(e) {
      e.preventDefault();
      console.error(e.message);
      message.error(e.message, 3);
    },
  },
};

