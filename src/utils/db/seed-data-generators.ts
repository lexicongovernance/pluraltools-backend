import { randCompanyName, randCountry, randMovie, randUser } from '@ngneat/falso';

export function generateEventData(numEvents: number): string[] {
    const events: string[] = [];
    for (let i = 0; i < numEvents; i++) {
      events.push(randCountry());
    }
    return events;
  }
