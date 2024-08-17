import type { AxiosPromise, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { sendMessage } from 'webext-bridge/content-script'
import { WorkerRequestMessage } from '~/type/worker-message'

export async function workerAdapter(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    sendMessage(WorkerRequestMessage.tag, new WorkerRequestMessage(config)).then((res) => {
      resolve(res)
    }, (reason) => {
      reject(reason)
    })
  })
}

const request = axios.create({
  adapter: workerAdapter,
})

export default request
