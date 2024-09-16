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
}
