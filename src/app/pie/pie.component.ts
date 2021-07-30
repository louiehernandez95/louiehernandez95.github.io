import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, Subject } from 'rxjs';
import { StockColor } from '../models/enums/stock-color.enum';
import { DataService } from './../services/data.service';
import { IStock } from './../models/stock.model';

@Component({
  selector: 'app-pie',
  templateUrl: './pie.component.html',
  styleUrls: ['./pie.component.scss']
})
export class PieComponent implements OnInit {
  dateKey: string | null = null;
  @Input() notify: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  @Output() notFound: EventEmitter<boolean | null> = new EventEmitter();
  private ticker = 0;
  // color: any;
  // pie: any;
  // svg: any;
  // g: any;
  // width: number = 0;
  // height: number = 0;
  // radius: number = 0;
  datum: any;

  constructor(
    private data: DataService
  ) { }

  ngOnInit(): void {
    // this.pie = d3.pie();
    // this.svg = d3.select("#pie");
    // this.width = this.svg.attr("width");
    // this.height = this.svg.attr("height");
    // this.radius = Math.min(this.width, this.height) / 2;
    // this.g = this.svg.append("g").attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
    this.notify.asObservable().subscribe((res) => {
      if (!res) { return; }
      this.dateKey = res;
      this.init();
      this.ticker++;
    });
  }

  private init() {
    const amazon = this.data.amazonData.find((a) => a.timeStamp === this.dateKey);
    const apple = this.data.appleData.find((a) => a.timeStamp === this.dateKey);
    const facebook = this.data.facebookData.find((f) => f.timeStamp === this.dateKey);
    const google = this.data.googleData.find((g) => g.timeStamp === this.dateKey);
    const netflix = this.data.netflixData.find((n) => n.timeStamp === this.dateKey);

    this.datum = [amazon, apple, facebook, google, netflix];
    if (this.datum.every((d: any) => d === null || d == undefined)) {
      this.notFound.emit(true);
      return;
    }

    const data = this.datum.map((d: IStock) => {
      return {
        name: d?.source.charAt(0).toUpperCase() + d?.source.substring(1),
        value: ((d?.close - d?.open) / d?.open) * 100,
        close: d?.close,
        volume: d?.volume
      };
    });
    let svg;
    if (this.ticker > 0) {
      d3.select("#container").selectAll("svg").remove();
      svg = d3.select("#container").append("svg")
        .attr("width", 1000)
        .attr("height", 600);
    } else {
      svg = d3.select("#bar")
      .attr("width", 1000)
      .attr("height", 600);
    }

    let width = +svg.attr("width");
    let height = +svg.attr("height");


    let xVal = (d: any) => d?.name;
    let yVal = (d: any) => d?.value;

    //set the margins
    let margin = {
      top: 100,
      right: 100,
      bottom: 100,
      left: 300
    };

    let innerWidth = width - margin.left - margin.right;
    let innerHeight = height - margin.top - margin.bottom;

    let scaleX = d3.scaleBand()
      .domain(data.map(xVal))
      .range([0, innerWidth])
      .padding(0.25);

    let xAxis = d3.axisBottom(scaleX);
    let scaleY = d3.scaleLinear()
      // @ts-ignore
      .domain([-6.2, 6.2]).nice()
      .range([innerHeight, 0]);

    let yAxis = d3.axisLeft(scaleY)
      .tickSize(-innerWidth);

    const res = Array.from(data.map((d: any) => d?.name)).sort() as Array<string>; // list of group names

    let colorScale = d3.scaleOrdinal()
    .domain(res)
    .range([StockColor.Amazon, StockColor.Apple, StockColor.Facebook, StockColor.Google, StockColor.Netflix])

    let g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let yG = g.append("g")
      .call(yAxis)
      .attr("font-size", 16);

    yG.append("text")
      .attr("font-size", 16)
      .attr("fill", "black")
      .text("Day Change (%)")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -200);

    let xG = g.append("g")
      .call(xAxis)
      .attr("transform", `translate(0, ${innerHeight})`)
      .attr("font-size", 16);

    xG.append("text")
      .attr("font-size", 16)
      .attr("fill", "black")
      .text("Company")
      .attr("y", 50)
      .attr("x", innerWidth / 2);

    g.append("text")
      .text(`Day Change (%) for: ${this.dateKey}`)
      .attr("font-size", 26)
      .attr("y", -20)
      .attr("x", innerWidth / 4);

    let rects = g.selectAll("rect").data(data);
    // @ts-ignore
    rects.enter().append("rect")
      .attr("x", d => scaleX(xVal(d)))
      .attr("y", function (d) {
        if (yVal(d) < 0) {
          return (innerHeight / 2)
        } else {
          return scaleY(yVal(d))
        }
      })
      .attr("width", scaleX.bandwidth())
      .attr("height", function (d) {
        if (yVal(d) < 0) {
          return scaleY(yVal(d)) - (innerHeight / 2)
        } else {
          return (innerHeight / 2) - scaleY(yVal(d))
        }
      })
      .attr("fill", d => colorScale(yVal(d)))
      .append("title")
      // @ts-ignore
      .text(d => `Day Change: ${d?.value?.toFixed(4)}%\nClose: $${d?.close?.toFixed(3)}\nVolume: ${Number(d?.volume)?.toLocaleString()}`);
  }
}
