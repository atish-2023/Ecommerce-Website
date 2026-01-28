import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  pure: false  // Make it impure to detect changes in filter value
})
export class FilterPipe implements PipeTransform {


  transform(items: any[], value: string): any[] {
    // Return empty array if array is falsy
    if (!items) { return []; }
    
    // Return a copy of the original array if value is Default
    if (value === "Default") { 
      return [...items]; 
    }

    // Create a copy to avoid mutating the original array
    const itemsCopy = [...items];

    // Sort from Low to High by price
    if (value === "Low to High") {
      return itemsCopy.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    // Sort from High to Low by price
    if (value === "High to Low") {
      return itemsCopy.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    
    // Sort A to Z by title
    if (value === "A to Z") {
      return itemsCopy.sort((a, b) => {
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        
        if (aTitle < bTitle) return -1;
        if (aTitle > bTitle) return 1;
        return 0;
      });
    }

    // Sort Z to A by title (default fallback)
    return itemsCopy.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      if (aTitle > bTitle) return -1;
      if (aTitle < bTitle) return 1;
      return 0;
    });
  }

}
