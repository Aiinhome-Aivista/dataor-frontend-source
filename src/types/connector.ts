export interface FieldGuide {
  title: string;
  description: string;
  tip: string;
}

export interface WebSearchResult {
  id?: string;
  url: string;
  title: string;
  brief: string;
  search_id?: string;
}

export interface ConnectorFormData {
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}
