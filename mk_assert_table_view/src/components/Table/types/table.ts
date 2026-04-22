// types/table.ts
export interface TableItem {
  FD_ID: string;
  FD_SUBJECT: string;
  FD_NUMBER: string;
  FD_PROCESS_STATUS: '20' | '30' | '00' | "11" | "10";
  FD_CREATE_TIME?: string;
  FD_LAST_MODIFIED_TIME?: string;
  description?: string;
}

export interface SearchParams {
  title?: string;
  code?: string;
  status?: string;
  FD_TEMPLATE_ID?:string
}

export interface PaginationParams {
  current: number;
  pageSize: number;
  total: number;
}

export interface TableData {
  list: TableItem[];
  pagination: PaginationParams;
}


export interface ApiResponse {
  status: number;
  data: TableItem[];
  msg?: string;
}
