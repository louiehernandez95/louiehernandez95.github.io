import { AfterViewInit, Component } from '@angular/core';
import { DataService } from './../services/data.service';
import { IStock } from './../models/stock.model';
import { StockColor } from '../models/enums/stock-color.enum';
import { toDateKey } from '../functions/date-key.function';

import * as d3 from 'd3';
import * as d3Annotation from 'd3-svg-annotation'


@Component({
  selector: 'app-scatter',
  templateUrl: './scatter.component.html',
  styleUrls: ['./scatter.component.scss']
})
export class ScatterComponent implements AfterViewInit {

  // set the dimensions and margins of the graph
  private margin = { top: 20, right: 20, bottom: 50, left: 70 };
  private width = 700 - this.margin.left - this.margin.right;
  private height = 500 - this.margin.top - this.margin.bottom;

  constructor(
    private data: DataService,
  ) { }

  ngAfterViewInit(): void {
    this.init();
  }

  private init(): void {
    this.data.allData$.subscribe((data) => {
      if (data.length === 0) { return; }
      this.drawPlot(data);
    });
  }

  private drawPlot(data: IStock[]): void {
    const sumstat = d3.group(data, d => d.source);
    // set the ranges
    const x = d3.scaleTime().range([0, this.width]);
    const y = d3.scaleLinear().range([this.height, 0]);

    const div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    const svg = d3.select("#scatter")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")");

    // format the data
    const parseTime = d3.timeParse("%Y-%m-%d");
    // format the data
    data.forEach(function (d) {
      //@ts-ignore
      d.close = +d.close;
    });

    // Scale the range of the data
    // @ts-ignore
    x.domain(d3.extent(data, function (d: any) { return parseTime(d.timeStamp); }));
    // @ts-ignoret
    y.domain([0, d3.max(data, function (d) { return +d.close; })]);

    // color palette
    var res = Array.from(sumstat.keys()).sort(); // list of group names

    var color = d3.scaleOrdinal()
      .domain(res)
      .range([StockColor.Amazon, StockColor.Apple, StockColor.Facebook, StockColor.Google, StockColor.Netflix])
    const that = this;
    // @ts-ignore
    svg.selectAll("path")
      .data(sumstat)
      .join("path")
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke', d => color(d[0]))
      .attr("d", (d: any) => {
        return d3.line()
          // @ts-ignore
          .x(d => x(parseTime(d.timeStamp)))
          // @ts-ignore
          .y(d => y(+d.close))
          (d[1])
      })
      .on("mouseover", function (event, d) {
        const date = x.invert(d3.pointer(event, svg.node())[0]);
        const dateKey = toDateKey(date);

        const toolTipObject = d[1].find((d) => d.timeStamp === dateKey);
        if (toolTipObject === undefined) { return; }

        div.transition()
          .duration(200)
          .style("opacity", .9);
        // @ts-ignore
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        });

        const companyName = d[0].charAt(0).toUpperCase() + d[0].substring(1);
        div.html(`Company: ${companyName}<br/><br/>
              Date: ${dateKey}<br/><br/>
              Open: ${formatter.format(toolTipObject?.open)}<br/><br/>
              Close: ${formatter.format(toolTipObject?.close)}<br/><br/>
              High: ${formatter.format(toolTipObject?.high)}<br/><br/>
              Volume: ${Number(toolTipObject?.volume).toLocaleString()}
          `)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function (d) {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on('click', function (event, d) {
        const date = x.invert(d3.pointer(event, svg.node())[0]);
        const dateKey = toDateKey(date);
        const source = d[1].find((d) => d.timeStamp === dateKey)?.source as string;
        that.drillDown(source, div);
      });;

    // Add the X Axis
    svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x));

    // text label for the x axis
    svg.append("text")
      .attr("transform",
        "translate(" + (this.width / 2) + " ," +
        (this.height + this.margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .text("Date");

    // Add the Y Axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // text label for the y axis
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left)
      .attr("x", 0 - (this.height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Price ($)");

    this.buildLegend();
  }

  private buildLegend(): void {
    const keys = Object.keys(StockColor);
    const svg = d3.select("#legend")

    // Handmade legend
    svg.append("circle").attr("cx", 100).attr("cy", 80).attr("r", 6).style("fill", StockColor.Amazon)
    svg.append("circle").attr("cx", 100).attr("cy", 100).attr("r", 6).style("fill", StockColor.Apple)
    svg.append("circle").attr("cx", 100).attr("cy", 120).attr("r", 6).style("fill", StockColor.Facebook)
    svg.append("circle").attr("cx", 100).attr("cy", 140).attr("r", 6).style("fill", StockColor.Google)
    svg.append("circle").attr("cx", 100).attr("cy", 160).attr("r", 6).style("fill", StockColor.Netflix)

    svg.append("text").attr("x", 120).attr("y", 80).text(keys[0]).style("font-size", "15px").attr("alignment-baseline", "middle");
    svg.append("text").attr("x", 120).attr("y", 100).text(keys[1]).style("font-size", "15px").attr("alignment-baseline", "middle");
    svg.append("text").attr("x", 120).attr("y", 120).text(keys[2]).style("font-size", "15px").attr("alignment-baseline", "middle");
    svg.append("text").attr("x", 120).attr("y", 140).text(keys[3]).style("font-size", "15px").attr("alignment-baseline", "middle");
    svg.append("text").attr("x", 120).attr("y", 160).text(keys[4]).style("font-size", "15px").attr("alignment-baseline", "middle");
  }

  private drillDown(source: string, div: any) {
    if (source === null || source === undefined) { return; }
    d3.select("#container").selectAll("svg").remove();
    console.log(source);
    div.transition()
      .duration(500)
      .style("opacity", 0);

    let data: IStock[] = [];
    switch (source) {
      case 'amazon': {
        data = this.data.amazonData;
        break;
      }
      case 'apple': {
        data = this.data.appleData;
        break;
      }
      case 'facebook': {
        data = this.data.facebookData;
        break;
      }
      case 'google': {
        data = this.data.googleData;
        break;
      }
      case 'netflix': {
        data = this.data.netflixData;
        break;
      }
      default: {
        break;
      }
    }
    // @ts-ignore
    console.log(data);
    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 20, bottom: 50, left: 70 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // format the data
    const parseTime = d3.timeParse("%Y-%m-%d");

    // set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line()
      // @ts-ignore
      .x(function (d: any) { return x(parseTime(d.timeStamp)); })
      .y(function (d: any) { return y(d.close); });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("#container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    data.forEach(function (d) {
      d.close = +d.close;
    });

    // Scale the range of the data
    // @ts-ignore
    x.domain(d3.extent(data, function (d) { return parseTime(d.timeStamp); }));
    // @ts-ignore
    y.domain([0, d3.max(data, function (d) { return d.close; })]);
    const color = Object.values(StockColor)
    console.log(color);
    // Add the valueline path.
    svg.append("path")
      .data([data])
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke', d => StockColor.Apple)
      // @ts-ignore
      .attr("d", valueline);

    // Add the x Axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add the y Axis
    svg.append("g")
      .call(d3.axisLeft(y));
  }
}