import { Injectable } from '@angular/core';
import { IStock } from '../models/stock.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';


@Injectable()
export class DataService {

    private _allDataSubject = new BehaviorSubject<IStock[]>([]);

    get amazonData(): IStock[] {
        return this._allDataSubject.value.filter((d) => d.source === 'amazon');
    }

    get appleData(): IStock[] {
        return this._allDataSubject.value.filter((d) => d.source === 'apple');
    }

    get facebookData(): IStock[] {
        return this._allDataSubject.value.filter((d) => d.source === 'facebook');
    }

    get googleData(): IStock[] {
        return this._allDataSubject.value.filter((d) => d.source === 'google');
    }

    get netflixData(): IStock[] {
        return this._allDataSubject.value.filter((d) => d.source === 'netflix');
    }

    get allData(): IStock[] {
        return this._allDataSubject.value;
    }

    get allData$(): Observable<IStock[]> {
        return this._allDataSubject.asObservable();
    }

    constructor(
        private http: HttpClient,
    ) { }

    public async getData(): Promise<void> {
        const res = await this.http.get<IStock[]>("assets/data/stocks.json").toPromise();
        this._allDataSubject.next(res);
    }

}