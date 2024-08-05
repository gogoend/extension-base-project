import { WorkerAliveDetectMessage, WorkerRequestMessage } from '~/type/worker-message'

export const messageHandlerMap: Record<string, Parameters<typeof browser.runtime.onMessage.addListener>[0]> = {
  [WorkerAliveDetectMessage.tag](message, sender, sendResponse) {
    sendResponse()
    return true
  },
  [WorkerRequestMessage.tag](message: WorkerRequestMessage) {
    let {
      url,
      method,
      headers,
      data,
    } = message.axiosConf

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
        config: message.axiosConf,
        request,
      }
    })
  },
}
