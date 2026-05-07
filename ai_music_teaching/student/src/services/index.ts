import request from '@/utils/request'
import { apiPrefix } from 'urlList';
import { patrolApiPrefix } from 'urlList';

import api from '@/services/api';

const gen =(params: string)=> {
  let url = apiPrefix + params
  let method = 'GET'

  const paramsArray = params.split(' ')
  if (paramsArray.length === 2) {
    method = paramsArray[0]
    url = apiPrefix + paramsArray[1]
  }

  return function (data :any) {
    return request({
      url,
      data,
      method,
    })
  }
}

type ApiFunc = (data?: any) => Promise<any>;

const APIFunction: Record<string, ApiFunc> = {};

for (const key in api) {
  if (Object.prototype.hasOwnProperty.call(api, key)) {
    const k = key as keyof typeof api;
    APIFunction[k] = gen(api[k]);
  }
}




export function GetFile(url : string): Promise<any> {
  return request({
    url,
    method: 'GET',
  })
}

export function AddCheatWarning(data : any): Promise<any> {
  return request({
    url: patrolApiPrefix + '/AddCheatWarning',
    data,
    method: 'POST',
  })
}



export default APIFunction
