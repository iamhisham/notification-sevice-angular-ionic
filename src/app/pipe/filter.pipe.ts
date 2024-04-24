import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(items: any[], filter: Record<string, any>): any {
    if (!items || !filter) return items;

    const key = Object.keys(filter)[0];
    const value = (filter[key] || '').toLowerCase();

    return items.filter((e) => (e[key] || '').toString().toLowerCase().indexOf(value) !== -1);
  }

}
