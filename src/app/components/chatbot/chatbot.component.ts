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
  
  conversationId: string | undefined = undefined;
  messages: ChatMessage[] = [
    { role: 'assistant', content: 'Hi there! I am your shopping assistant. How can I help you today?' }
  ];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Optionally load recent conversation here if needed
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  scrollToBottom(): void {
    try {
      if (this.chatMessagesContainer) {
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
  }

  clearInput(): void {
    this.currentMessage = '';
  }
}
