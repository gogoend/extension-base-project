import axios from 'axios'
import fetchToAxiosAdapter from '~/utils/fetch-to-axios-adapter'

export const request = axios.create({
  adapter: fetchToAxiosAdapter,
})
