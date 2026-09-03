import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ChatConversation } from '../../services/chat.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessagesContainer') private chatMessagesContainer!: ElementRef;

  isOpen = false;
  isLoading = false;
  currentMessage = '';
  
  showHistory = false;
  historyLoading = false;
  conversations: ChatConversation[] = [];

  conversationId: string | undefined = undefined;
  messages: ChatMessage[] = [
    { role: 'assistant', content: 'Hi there! I am your shopping assistant. How can I help you today?' }
  ];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.showHistory) {
      this.loadConversations();
    }
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
    if (this.showHistory) {
      this.loadConversations();
    }
  }

  loadConversations(): void {
    this.historyLoading = true;
    this.chatService.getMyConversations(1, 20).subscribe({
      next: (res) => {
        this.historyLoading = false;
        if (res.success && res.data) {
          this.conversations = res.data;
        }
      },
      error: (err) => {
        this.historyLoading = false;
        console.error('Failed to load conversations:', err);
      }
    });
  }

  loadConversation(id: string | undefined): void {
    if (!id) return;
    this.isLoading = true;
    this.chatService.getConversationById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const conv = res.data;
          this.conversationId = conv._id || conv.id;
          this.messages = conv.messages || [];
          this.showHistory = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to fetch conversation:', err);
      }
    });
  }

  deleteConversation(id: string | undefined, event: Event): void {
    event.stopPropagation();
    if (!id) return;
    if (!confirm('Are you sure you want to delete this chat history?')) return;

    this.chatService.deleteConversation(id).subscribe({
      next: (res) => {
        if (this.conversationId === id) {
          this.startNewConversation();
        }
        this.loadConversations();
      },
      error: (err) => {
        console.error('Failed to delete conversation:', err);
      }
    });
  }

  scrollToBottom(): void {
    try {
      if (this.chatMessagesContainer && !this.showHistory) {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  sendMessage(): void {
    if (!this.currentMessage.trim()) return;

    const userMsg = this.currentMessage.trim();
    this.messages.push({ role: 'user', content: userMsg });
    this.currentMessage = '';
    this.isLoading = true;

    this.chatService.sendMessage(userMsg, this.conversationId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.conversationId = response.data.conversationId;
          this.messages.push({ role: 'assistant', content: response.data.reply });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' });
        console.error('Chat error:', err);
      }
    });
  }

  startNewConversation(): void {
    this.conversationId = undefined;
    this.messages = [
      { role: 'assistant', content: 'Hi there! I am your shopping assistant. How can I help you today?' }
    ];
    this.showHistory = false;
  }

  clearInput(): void {
    this.currentMessage = '';
  }
}
