import request from 'utils/request'
import { apiPrefix } from 'config';

import api from './api'
import axios from 'axios'

const gen = params => {
  let url = apiPrefix + params
  let method = 'GET'

  const paramsArray = params.split(' ')
  if (paramsArray.length === 2) {
    method = paramsArray[0]
    url = apiPrefix + paramsArray[1]
  }

  return function (data) {
    return request({
      url,
      data,
      method,
    })
  }
}

const APIFunction = {}
for (const key in api) {
  APIFunction[key] = gen(api[key])
}

export function GetFile(url) {
  return request({
    url,
    method: 'GET',
  })
}

//动态获取曲谱的token
const axiosInstance = axios.create({
  baseURL: '/scorePractice/api',
  timeout: 3000,
});

APIFunction.getToken = () => {
  return axiosInstance.post('/v1/user/clogin',
    {},
    {
      params: {
        account: '18107230073',
        deviceId: 'd975ab35598000de2a68db43d76cdfdd',
        password: '123456'
      }
    }
  )
}

export default APIFunction
