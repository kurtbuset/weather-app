import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'weather-app-main';

  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }
}
