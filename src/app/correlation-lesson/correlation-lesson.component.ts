import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { IStock } from '../models/stock.model';

interface CorrelationInsight {
  label: string;
  value: number;
  strength: string;
  explanation: string;
}

interface CompanyStat {
  name: string;
  firstDate: string;
  lastDate: string;
  firstClose: number;
  lastClose: number;
  growth: number;
  days: number;
}

@Component({
  selector: 'app-correlation-lesson',
  templateUrl: './correlation-lesson.component.html',
  styleUrls: ['./correlation-lesson.component.scss']
})
export class CorrelationLessonComponent implements OnInit {
  companyStats: CompanyStat[] = [];
  strongestPair: CorrelationInsight | null = null;
  weakestPair: CorrelationInsight | null = null;
  volumeInsight: CorrelationInsight | null = null;
  totalRows = 0;

  constructor(private data: DataService) { }

  ngOnInit(): void {
    const rows = this.data.allData;
    this.totalRows = rows.length;
    this.companyStats = this.buildCompanyStats(rows);

    const returnPairs = this.buildReturnCorrelations(rows);
    this.strongestPair = returnPairs[0] || null;
    this.weakestPair = returnPairs[returnPairs.length - 1] || null;
    this.volumeInsight = this.buildVolumeInsight(rows);
  }

  getCorrelationWidth(value: number): string {
    return `${Math.max(6, Math.abs(value) * 100)}%`;
  }

  formatPercent(value: number): string {
    return `${Math.round(value).toLocaleString()}%`;
  }

  private buildCompanyStats(rows: IStock[]): CompanyStat[] {
    return this.groupBySource(rows)
      .map((group) => {
        const sorted = group.values.sort((a, b) => a.timeStamp.localeCompare(b.timeStamp));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const growth = ((last.close - first.close) / first.close) * 100;

        return {
          name: this.toTitle(group.source),
          firstDate: first.timeStamp,
          lastDate: last.timeStamp,
          firstClose: first.close,
          lastClose: last.close,
          growth,
          days: sorted.length
        };
      })
      .sort((a, b) => b.growth - a.growth);
  }

  private buildReturnCorrelations(rows: IStock[]): CorrelationInsight[] {
    const returnsBySource = new Map<string, Map<string, number>>();

    this.groupBySource(rows).forEach((group) => {
      const sorted = group.values.sort((a, b) => a.timeStamp.localeCompare(b.timeStamp));
      const returns = new Map<string, number>();

      for (let i = 1; i < sorted.length; i++) {
        const previous = sorted[i - 1];
        const current = sorted[i];
        returns.set(current.timeStamp, (current.close - previous.close) / previous.close);
      }

      returnsBySource.set(group.source, returns);
    });

    const sources = Array.from(returnsBySource.keys()).sort();
    const insights: CorrelationInsight[] = [];

    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const left = returnsBySource.get(sources[i]);
        const right = returnsBySource.get(sources[j]);
        if (!left || !right) { continue; }

        const paired = this.pairByDate(left, right);
        const value = this.correlation(paired.left, paired.right);
        insights.push({
          label: `${this.toTitle(sources[i])} and ${this.toTitle(sources[j])}`,
          value,
          strength: this.describeCorrelation(value),
          explanation: `Their daily price changes point in the same direction ${Math.round(Math.abs(value) * 100)} out of 100 steps.`
        });
      }
    }

    return insights.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }

  private buildVolumeInsight(rows: IStock[]): CorrelationInsight | null {
    const insights = this.groupBySource(rows).map((group) => {
      const closes = group.values.map((row) => row.close);
      const volumes = group.values.map((row) => row.volume);
      const value = this.correlation(closes, volumes);

      return {
        label: `${this.toTitle(group.source)} price and trading volume`,
        value,
        strength: this.describeCorrelation(value),
        explanation: 'This compares the stock price with how many shares were traded that day.'
      };
    });

    return insights.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0] || null;
  }

  private groupBySource(rows: IStock[]): { source: string; values: IStock[] }[] {
    const groups = new Map<string, IStock[]>();
    rows.forEach((row) => {
      const values = groups.get(row.source) || [];
      values.push(row);
      groups.set(row.source, values);
    });

    return Array.from(groups.entries()).map(([source, values]) => ({ source, values }));
  }

  private pairByDate(left: Map<string, number>, right: Map<string, number>): { left: number[]; right: number[] } {
    const leftValues: number[] = [];
    const rightValues: number[] = [];

    left.forEach((leftValue, date) => {
      const rightValue = right.get(date);
      if (rightValue === undefined) { return; }
      leftValues.push(leftValue);
      rightValues.push(rightValue);
    });

    return { left: leftValues, right: rightValues };
  }

  private correlation(left: number[], right: number[]): number {
    if (left.length !== right.length || left.length === 0) { return 0; }

    const leftAverage = this.average(left);
    const rightAverage = this.average(right);
    let top = 0;
    let leftBottom = 0;
    let rightBottom = 0;

    for (let i = 0; i < left.length; i++) {
      const leftDistance = left[i] - leftAverage;
      const rightDistance = right[i] - rightAverage;
      top += leftDistance * rightDistance;
      leftBottom += leftDistance * leftDistance;
      rightBottom += rightDistance * rightDistance;
    }

    const bottom = Math.sqrt(leftBottom * rightBottom);
    return bottom === 0 ? 0 : top / bottom;
  }

  private average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private describeCorrelation(value: number): string {
    const size = Math.abs(value);
    if (size > 0.7) { return 'strong'; }
    if (size > 0.4) { return 'medium'; }
    if (size > 0.2) { return 'small'; }
    return 'tiny';
  }

  private toTitle(value: string): string {
    return value.charAt(0).toUpperCase() + value.substring(1);
  }
}
