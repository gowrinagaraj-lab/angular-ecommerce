import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../config/api.config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatConversation {
  id?: string;
  _id?: string;
  user: string;
  title: string;
  messages: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
  lastMessage?: ChatMessage;
}

export interface ChatResponse {
  success: boolean;
  data?: any;
  message?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = getApiUrl('chat' as any); // Type cast since it might not be strictly typed yet in some tsconfigs

  constructor(private http: HttpClient) {}

  sendMessage(message: string, conversationId?: string): Observable<ChatResponse> {
    const payload: any = { message };
    if (conversationId) {
      payload.conversationId = conversationId;
    }
    return this.http.post<ChatResponse>(this.apiUrl, payload);
  }

  getMyConversations(page = 1, limit = 10): Observable<ChatResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ChatResponse>(this.apiUrl, { params });
  }

  getConversationById(id: string): Observable<ChatResponse> {
    return this.http.get<ChatResponse>(`${this.apiUrl}/${id}`);
  }

  deleteConversation(id: string): Observable<ChatResponse> {
    return this.http.delete<ChatResponse>(`${this.apiUrl}/${id}`);
  }
}
