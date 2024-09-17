export enum ReceiveStatus {
  INITIALIZING,
  PENDING,
  FINISHED,
  ERROR,
  CANCELLED,
}

export interface MessageItem {
  insertedBy: 'user' | 'robot' | 'system'
  content: string
  modifiedTime: Date
  createdTime: Date
  receiveStatus: ReceiveStatus
  receivedPayloadIndex: number
  sessionId: string
}

export enum SuggestMessageFrom {
  exampleQuery = 'exampleQuery',
  pageSummary = 'pageSummary',
}
