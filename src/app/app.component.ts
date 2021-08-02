import { Component, OnInit } from '@angular/core';
import { toDateKey } from './functions/date-key.function';
import { DataService } from './services/data.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'portfolio';
  dateKey: string | null = null;
  displayScatter: boolean = true;

  notify: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  dateControl = new FormControl();

  constructor(private data: DataService) { }

  ngOnInit() {
    this.dateControl.valueChanges.subscribe((d) => this.dateChanged(d));
  }

  private dateChanged(e: Date) {
    if (e === null || e === undefined) {
      this.displayScatter = true;
      return;
    }

    this.displayScatter = false;
    this.notify.next(toDateKey(e));
  }

  onNotFound(e: any) {
    this.displayScatter = true;
    this.dateControl.setValue(null);
    alert("No matching trading day found. Try choosing a date before 2021 and not on the weekend or a federal holiday.");
  }
}
