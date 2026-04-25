import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { toDateKey } from '../functions/date-key.function';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  displayScatter = true;
  notify: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  dateControl = new FormControl();

  ngOnInit(): void {
    this.dateControl.valueChanges.subscribe((d) => this.dateChanged(d));
  }

  private dateChanged(e: Date): void {
    if (e === null || e === undefined) {
      this.displayScatter = true;
      return;
    }

    this.displayScatter = false;
    this.notify.next(toDateKey(e));
  }

  onNotFound(): void {
    this.displayScatter = true;
    this.dateControl.setValue(null);
    alert('No matching trading day found. Try choosing a date before 2021 and not on the weekend or a federal holiday.');
  }
}
