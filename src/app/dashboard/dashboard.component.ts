import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  pokemonCount = 0;
  legendaryCount = 0;
  typeCount = 0;

  constructor(private data: DataService) { }

  ngOnInit(): void {
    const pokemon = this.data.allData;
    this.pokemonCount = pokemon.length;
    this.legendaryCount = this.data.legendaryData.length;
    this.typeCount = this.data.getTypeSummaries().length;
  }
}
