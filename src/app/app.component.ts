import { Component, OnInit } from '@angular/core';
import { FeedComponent } from './features/feed/feed.component';
import { DataInitService } from './core/services';

@Component({
  selector: 'app-root',
  imports: [FeedComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'HashedIn Meme Sharing App';

  constructor(private dataInitService: DataInitService) {}

  ngOnInit(): void {
    // Initialize seed data on first run
    this.dataInitService.initializeData();
  }
}
