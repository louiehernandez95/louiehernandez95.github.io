import { AfterViewInit, Component } from '@angular/core';
import * as d3 from 'd3';
import { IPokemon, ITypeSummary } from '../models/pokemon.model';
import { DataService } from '../services/data.service';

interface Insight {
  title: string;
  body: string;
}

@Component({
  selector: 'app-scatter',
  templateUrl: './scatter.component.html',
  styleUrls: ['./scatter.component.scss']
})
export class ScatterComponent implements AfterViewInit {
  insights: Insight[] = [];

  constructor(private data: DataService) { }

  ngAfterViewInit(): void {
    this.data.allData$.subscribe((pokemon) => {
      if (pokemon.length === 0) { return; }
      this.insights = this.buildInsights(pokemon);
      this.drawScatter(pokemon);
      this.drawTypeCountBars(this.data.getTypeSummaries());
      this.drawSpeedBars(this.data.getTypeSummaries());
    });
  }

  private drawScatter(pokemon: IPokemon[]): void {
    d3.select('#pokemon-scatter').selectAll('*').remove();

    const width = 1050;
    const height = 520;
    const margin = { top: 20, right: 30, bottom: 70, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const topPokemon = pokemon.filter((p) => p.weight > 0 && p.stats.attack > 0);

    const x = d3.scaleLinear()
      .domain([0, d3.max(topPokemon, (p) => p.weight) || 1])
      .nice()
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(topPokemon, (p) => p.stats.attack) || 1])
      .nice()
      .range([innerHeight, 0]);

    const radius = d3.scaleSqrt()
      .domain([0, d3.max(topPokemon, (p) => p.stats.hp) || 1])
      .range([3, 18]);
    const attackCorrelation = this.correlation(
      topPokemon.map((p) => p.weight),
      topPokemon.map((p) => p.stats.attack)
    );
    const bestFit = this.linearRegression(
      topPokemon.map((p) => p.weight),
      topPokemon.map((p) => p.stats.attack)
    );

    const color = d3.scaleOrdinal<string>()
      .domain(['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'])
      .range(['#94a3b8', '#ef4444', '#3b82f6', '#f59e0b', '#22c55e', '#67e8f9', '#b45309', '#a855f7', '#ca8a04', '#38bdf8', '#ec4899', '#84cc16', '#78716c', '#6366f1', '#7c3aed', '#64748b', '#111827', '#f472b6']);

    const svg = d3.select('#pokemon-scatter')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const plot = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    plot.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    plot.append('g')
      .call(d3.axisLeft(y));

    plot.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 50)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 800)
      .text('Weight');

    plot.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -55)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 800)
      .text('Attack');

    const xMax = d3.max(topPokemon, (p) => p.weight) || 0;
    const lineStart = { x: 0, y: bestFit.intercept };
    const lineEnd = { x: xMax, y: bestFit.slope * xMax + bestFit.intercept };

    plot.append('line')
      .attr('x1', x(lineStart.x))
      .attr('y1', y(lineStart.y))
      .attr('x2', x(lineEnd.x))
      .attr('y2', y(lineEnd.y))
      .attr('stroke', '#111827')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '8 6');

    plot.append('text')
      .attr('x', innerWidth - 12)
      .attr('y', 24)
      .attr('text-anchor', 'end')
      .attr('font-weight', 900)
      .attr('fill', '#111827')
      .text(`Correlation coefficient r = ${attackCorrelation.toFixed(2)}`);

    plot.append('text')
      .attr('x', innerWidth - 12)
      .attr('y', 48)
      .attr('text-anchor', 'end')
      .attr('font-weight', 700)
      .attr('fill', '#475569')
      .text('Dashed line = line of best fit');

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    plot.selectAll('circle')
      .data(topPokemon)
      .join('circle')
      .attr('cx', (p) => x(p.weight))
      .attr('cy', (p) => y(p.stats.attack))
      .attr('r', (p) => radius(p.stats.hp))
      .attr('fill', (p) => color(p.types[0]))
      .attr('fill-opacity', 0.72)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .on('mouseover', (event, p) => {
        tooltip.transition().duration(120).style('opacity', 0.95);
        tooltip.html(`
          <strong>${this.titleCase(p.name)}</strong><br/>
          Type: ${p.types.join(', ')}<br/>
          Weight: ${p.weight}<br/>
          Attack: ${p.stats.attack}<br/>
          Speed: ${p.stats.speed}
        `)
          .style('left', `${event.pageX + 12}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });
  }

  private drawTypeCountBars(summaries: ITypeSummary[]): void {
    this.drawBars('#type-bars', summaries.slice(0, 10), 'count', '#14b8a6', 'Number of Pokémon');
  }

  private drawSpeedBars(summaries: ITypeSummary[]): void {
    const fastest = [...summaries].sort((a, b) => b.averageSpeed - a.averageSpeed).slice(0, 10);
    this.drawBars('#speed-bars', fastest, 'averageSpeed', '#f59e0b', 'Average speed');
  }

  private drawBars(selector: string, data: ITypeSummary[], key: 'count' | 'averageSpeed', fill: string, axisLabel: string): void {
    d3.select(selector).selectAll('*').remove();

    const width = 1050;
    const height = 440;
    const margin = { top: 10, right: 30, bottom: 105, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map((d) => this.titleCase(d.type)))
      .range([0, innerWidth])
      .padding(0.22);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d[key]) || 1])
      .nice()
      .range([innerHeight, 0]);

    const svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const plot = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    plot.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(this.titleCase(d.type)) || 0)
      .attr('y', (d) => y(d[key]))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerHeight - y(d[key]))
      .attr('rx', 6)
      .attr('fill', fill);

    plot.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-28)')
      .style('text-anchor', 'end');

    plot.append('g').call(d3.axisLeft(y));

    plot.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 800)
      .text(axisLabel);
  }

  private buildInsights(pokemon: IPokemon[]): Insight[] {
    const heaviest = [...pokemon].sort((a, b) => b.weight - a.weight)[0];
    const fastest = [...pokemon].sort((a, b) => b.stats.speed - a.stats.speed)[0];
    const attackCorrelation = this.correlation(
      pokemon.map((p) => p.weight),
      pokemon.map((p) => p.stats.attack)
    );

    return [
      {
        title: `${this.titleCase(heaviest.name)} is the backpack destroyer`,
        body: `At ${heaviest.weight} weight units, this Pokémon is extremely heavy. But heavy does not automatically mean strongest.`
      },
      {
        title: `${this.titleCase(fastest.name)} did not wait for attendance`,
        body: `Its speed stat is ${fastest.stats.speed}. Fast Pokémon are not always huge, which is exactly why scatter plots are useful.`
      },
      {
        title: 'Weight and attack have a pattern, but not a promise',
        body: `Their match score is about ${Math.round(Math.abs(attackCorrelation) * 100)}/100. That means bigger Pokémon often hit harder, but plenty of tiny troublemakers break the rule.`
      }
    ];
  }

  private correlation(left: number[], right: number[]): number {
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

  private linearRegression(left: number[], right: number[]): { slope: number; intercept: number } {
    const leftAverage = this.average(left);
    const rightAverage = this.average(right);
    let top = 0;
    let bottom = 0;

    for (let i = 0; i < left.length; i++) {
      const leftDistance = left[i] - leftAverage;
      top += leftDistance * (right[i] - rightAverage);
      bottom += leftDistance * leftDistance;
    }

    const slope = bottom === 0 ? 0 : top / bottom;
    return {
      slope,
      intercept: rightAverage - slope * leftAverage
    };
  }

  private average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.substring(1).replace('-', ' ');
  }
}
