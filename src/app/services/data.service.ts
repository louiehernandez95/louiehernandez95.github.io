import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IPokemon, ITypeSummary } from '../models/pokemon.model';

@Injectable()
export class DataService {
  private _allDataSubject = new BehaviorSubject<IPokemon[]>([]);

  get allData(): IPokemon[] {
    return this._allDataSubject.value;
  }

  get allData$(): Observable<IPokemon[]> {
    return this._allDataSubject.asObservable();
  }

  get legendaryData(): IPokemon[] {
    return this.allData.filter((pokemon) => pokemon.is_legendary || pokemon.is_mythical);
  }

  constructor(private http: HttpClient) { }

  async getData(): Promise<void> {
    const res = await this.http.get<IPokemon[]>('assets/data/complete_pokedex.json').toPromise();
    this._allDataSubject.next(res);
  }

  getTypeSummaries(): ITypeSummary[] {
    const groups = new Map<string, IPokemon[]>();

    this.allData.forEach((pokemon) => {
      pokemon.types.forEach((type) => {
        const values = groups.get(type) || [];
        values.push(pokemon);
        groups.set(type, values);
      });
    });

    return Array.from(groups.entries())
      .map(([type, values]) => ({
        type,
        count: values.length,
        averageAttack: this.average(values.map((pokemon) => pokemon.stats.attack)),
        averageSpeed: this.average(values.map((pokemon) => pokemon.stats.speed)),
        averageDefense: this.average(values.map((pokemon) => pokemon.stats.defense))
      }))
      .sort((a, b) => b.count - a.count);
  }

  private average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
