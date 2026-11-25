/**
 * URL de l'aplicació web de Google Apps Script per registrar la participació
 * de l'alumnat al full de càlcul de Google Sheets.
 */
export const SHEETS_WEBHOOK_URL =
  import.meta.env.VITE_SHEETS_WEBHOOK_URL ||
  'https://script.google.com/a/macros/fundaciollor.cat/s/AKfycbzJhS8jENvtnIkvZXZpwXtAveh6d7apIU_cad02RYHrmocYKf_fIYw1t7YsmCBdRS6agw/exec';
