export interface CreateOrder {
  app_id: string | number;
  app_trans_id: string;
  app_user?: string;
  app_time?: number;
  item?: any;
  embed_data?: any;
  amount?: number;
  description?: string;
  bank_code?: string;
  mac?: string;
  callback_url?: string;
}

export interface OrderResult {
  return_code: number;
  return_message: string;
}
