import { WorkerAliveDetectMessage, WorkerRequestMessage } from '~/type/worker-message'

export const messageHandlerMap: Record<string, Parameters<typeof browser.runtime.onMessage.addListener>[0]> = {
  [WorkerAliveDetectMessage.tag](message, sender, sendResponse) {
    sendResponse()
    return true
  },
  [WorkerRequestMessage.tag](message: WorkerRequestMessage, sender, sendResponse) {
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

    fetch(request).then(async (res) => {
      const responseBody = await res.text()
      // console.log(res)
      sendResponse({
        data: responseBody,
        headers: Object.fromEntries(res.headers.entries()),
        status: res.status,
        statusText: res.statusText,
      })
    })
    return true
  },
}
