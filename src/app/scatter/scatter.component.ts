import { AfterViewInit, Component } from '@angular/core';
import { DataService } from '../services/data.service';
import { IStock } from '../models/stock.model';
import { StockColor } from '../models/enums/stock-color.enum';
import { toDateKey } from '../functions/date-key.function';
import { AppConstants } from '../constants/app.contants';
import * as d3 from 'd3';
import * as d3Annotation from 'd3-svg-annotation';

@Component({
  selector: 'app-scatter',
  templateUrl: './scatter.component.html',
  styleUrls: ['./scatter.component.scss']
})
export class ScatterComponent implements AfterViewInit {

  private margin = { top: 20, right: 20, bottom: 50, left: 70 };
  private width = 700 - this.margin.left - this.margin.right;
  private height = 450 - this.margin.top - this.margin.bottom;
  displayButton = false;
  noteCardText = '';

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
    this.noteCardText = AppConstants.InitNoteCardText;
    const sumstat = d3.group(data, d => d.source);
    const x = d3.scaleTime().range([0, this.width]);
    const y = d3.scaleLinear().range([this.height, 0]);

    const div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    const svg = d3.select("#container").append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")");

    const parseTime = d3.timeParse("%Y-%m-%d");

    data.forEach(function (d) {
      //@ts-ignore
      d.close = +d.close;
    });

    // @ts-ignore
    x.domain(d3.extent(data, function (d: any) { return parseTime(d.timeStamp); }));
    // @ts-ignoret
    y.domain([0, d3.max(data, function (d) { return +d.close; })]);

    const res = Array.from(sumstat.keys()).sort();

    const color = d3.scaleOrdinal()
      .domain(res)
      .range([StockColor.Amazon, StockColor.Apple, StockColor.Facebook, StockColor.Google, StockColor.Netflix])
    const that = this;
    // @ts-ignore
    svg.selectAll("path")
      .data(sumstat)
      .join("path")
      .attr('fill', 'none')
      .attr('stroke-width', 2)
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
      });

    svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x));

    svg.append("text")
      .attr("transform",
        "translate(" + (this.width / 2) + " ," +
        (this.height + this.margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .text("Date");

    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left)
      .attr("x", 0 - (this.height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Price ($)");

    svg.append("text")
      .attr("x", (this.width / 2))
      .attr("y", 0 - (this.margin.top / 2.5))
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text(`FAANG Stock Data from IPO to Today`);

    this.buildLegend();
  }

  private buildLegend(): void {
    const keys = Object.keys(StockColor);

    const svg = d3.select("#legend")
      .attr("height", "400px")
      .attr("width", "450px")
      .attr("position", "absolute");

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

  public goToHome(): void {
    d3.select("#container").selectAll("svg").remove();
    this.displayButton = false;
    this.drawPlot(this.data.allData);
  }

  private drillDown(source: string, div: any) {
    if (source === null || source === undefined) { return; }
    d3.select("#container").selectAll("svg").remove();
    this.displayButton = true;

    div.transition()
      .duration(500)
      .style("opacity", 0);

    let data: IStock[] = [];
    switch (source) {
      case 'amazon': {
        data = this.data.amazonData;
        this.noteCardText = AppConstants.AmazonDetailCardText;
        break;
      }
      case 'apple': {
        data = this.data.appleData;
        this.noteCardText = AppConstants.AppleDetailNoteCardText;
        break;
      }
      case 'facebook': {
        data = this.data.facebookData;
        this.noteCardText = AppConstants.FacebookDetailNoteCardText;
        break;
      }
      case 'google': {
        data = this.data.googleData;
        this.noteCardText = AppConstants.GoogleDetailNoteCardText;
        break;
      }
      case 'netflix': {
        data = this.data.netflixData;
        this.noteCardText = AppConstants.NetflixDetailNoteCardText;
        break;
      }
      default: {
        break;
      }
    }

    const margin = { top: 20, right: 20, bottom: 50, left: 70 },
      width = 700 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

    const parseTime = d3.timeParse("%Y-%m-%d");
    const timeFormat = d3.timeFormat("%Y-%m-%d");

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const valueline = d3.line()
      // @ts-ignore
      .x(function (d: any) { return x(parseTime(d.timeStamp)); })
      .y(function (d: any) { return y(d.close); });

    const svg = d3.select("#container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    data.forEach(function (d) {
      d.close = +d.close;
    });

    // @ts-ignore
    x.domain(d3.extent(data, function (d) { return parseTime(d.timeStamp); }));
    // @ts-ignore
    y.domain([0, d3.max(data, function (d) { return d.close; })]);
    // @ts-ignore
    const color = StockColor[(data[0].source as string).charAt(0).toUpperCase() + (data[0].source as string).substring(1)];

    svg.append("path")
      .data([data])
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', color)
      // @ts-ignore
      .attr("d", valueline);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("transform",
        "translate(" + (width / 2) + " ," +
        (height + margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .attr("x", (height / 15))
      .text("Date");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Price ($)");

    const list: string[] = [];
    const filteredPrices: IStock[] = [];
    for (const price of data) {
      if (list.includes(price.timeStamp.slice(0, 4))) { continue; }
      list.push(price.timeStamp.slice(0, 4));
      filteredPrices.push(price);
    }
    const that = this;
    svg.append("g")
      .selectAll("dot")
      .data(filteredPrices)
      .enter()
      .append("circle")
      // @ts-ignore
      .attr("cx", (d: any) => { return x(parseTime(d.timeStamp)); })
      .attr("cy", (d: any) => { return y(d.close) })
      .attr("r", 4)
      .attr("stroke", "#000000")
      .attr("stroke-width", 2)
      .attr("fill", "white")
      .on("mouseover", function (event, d: any) {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        // @ts-ignore
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        });

        div.html(`Year: ${d.timeStamp.slice(0, 4)}<br/><br/>
              Open: ${formatter.format(d?.open)}<br/><br/>
              Close: ${formatter.format(d?.close)}<br/><br/>
              High: ${formatter.format(d?.high)}<br/><br/>
              Volume: ${Number(d?.volume).toLocaleString()}
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
        that.drillDownRockBottom(d.timeStamp.slice(0, 4), data, div);
      });

    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 0 - (margin.top / 2.5))
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text(`Historical Stock Price Data for: ${source.charAt(0).toUpperCase() + source.substring(1)}`);


    let annotations: any = [];
    switch (source) {
      case 'amazon': {
        annotations = AppConstants.AmazonAnnotations;
        break;
      }

      case 'apple': {
        annotations = AppConstants.AppleAnnotations;
        break;
      }

      case 'google': {
        annotations = AppConstants.GoogleAnnotations;
        break;
      }

      case 'netflix': {
        annotations = AppConstants.NetflixAnnotations;
        break;
      }

      case 'facebook': {
        annotations = AppConstants.FacebookAnnotations;
        break;
      }
    }

    const makeAnnotations = d3Annotation.annotation()
      .notePadding(15)
      .type(d3Annotation.annotationCalloutCurve)
      .accessors({
        // @ts-ignore
        x: d => x(parseTime(d.timeStamp)),
        y: (d: any) => y(d.close)
      })
      .accessorsInverse({
        timeStamp: (d: any) => timeFormat(x.invert(d.x)),
        // @ts-ignore
        close: d => y.invert(d.y)
      })
      .annotations(annotations)

    svg.append("g")
      .attr("class", "annotation-group")
      // @ts-ignore
      .call(makeAnnotations);
  }

  private drillDownRockBottom(year: string, data: IStock[], div: any): void {
    const source = data[0].source;
    const dataForYear = data.filter((d) => year === d.timeStamp.slice(0, 4));
    d3.select("#container").selectAll("svg").remove();

    div.transition()
      .duration(500)
      .style("opacity", 0);

    const margin = { top: 20, right: 20, bottom: 50, left: 70 },
      width = 700 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;
    this.noteCardText = `Viewing company information for ${source.charAt(0).toUpperCase() + source.substring(1)} on year: ${year}\n\nTo go back to home press the back button below the graph.`
    const parseTime = d3.timeParse("%Y-%m-%d");

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const valueline = d3.line()
      // @ts-ignore
      .x(function (d: any) { return x(parseTime(d.timeStamp)); })
      .y(function (d: any) { return y(d.close); });

    const svg = d3.select("#container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    dataForYear.forEach(function (d) {
      d.close = +d.close;
    });

    // @ts-ignore
    x.domain(d3.extent(dataForYear, function (d) { return parseTime(d.timeStamp); }));
    // @ts-ignore
    y.domain([0, d3.max(dataForYear, function (d) { return d.close; })]);
    // @ts-ignore
    const color = StockColor[(source as string).charAt(0).toUpperCase() + (source as string).substring(1)];

    svg.append("path")
      .data([dataForYear])
      .attr('fill', 'none')
      .attr('stroke-width', 4)
      .attr('stroke', color)
      // @ts-ignore
      .attr("d", valueline)
      .on("mouseover", function (event, d: any) {
        const date = x.invert(d3.pointer(event, svg.node())[0]);
        const dateKey = toDateKey(date);

        const toolTipObject = d.find((d: any) => d.timeStamp === dateKey);
        if (toolTipObject === undefined) { return; }

        div.transition()
          .duration(200)
          .style("opacity", .9);
        // @ts-ignore
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        });

        div.html(`Date: ${dateKey}<br/><br/>
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
      });

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("transform",
        "translate(" + (this.width / 2) + " ," +
        (this.height + this.margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .attr("x", (this.height / 15))
      .text("Date");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left)
      .attr("x", 0 - (this.height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Price ($)");

    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 0 - (margin.top / 2.5))
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text(`${source.charAt(0).toUpperCase() + source.substring(1)}'s Trading History for Year: ${year}`);

  }
}