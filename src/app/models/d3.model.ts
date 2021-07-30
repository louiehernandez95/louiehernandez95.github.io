import { BaseType, ValueFn } from 'd3';

export interface Line<Datum> {
    (data: Datum[]): string | null;
}

export interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
    //...
    attr(name: string, value: ValueFn<GElement, Datum, string | number | boolean | null>): this;
    //...
  }