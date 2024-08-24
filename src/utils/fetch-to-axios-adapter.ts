import type { AxiosPromise, AxiosRequestConfig } from 'axios'

export default function fetchToAxiosAdapter(config: AxiosRequestConfig): AxiosPromise {
  let {
    url,
    method,
    headers,
    data,
  } = config

  url = url || ''
  method = method || 'GET'
  data = ['GET', 'DELETE'].includes(method) ? null : data

  const request = new Request(url, {
    method,
    headers: headers as any as HeadersInit,
    body: data,
  })

  return fetch(request).then(async (res) => {
    const responseBody = await res.text()
    // console.log(res)
    return {
      data: responseBody,
      headers: Object.fromEntries(res.headers.entries()),
      status: res.status,
      statusText: res.statusText,
      config,
      request,
    }
  }) as any as AxiosPromise
};
