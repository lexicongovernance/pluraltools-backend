import { randCompanyName, randCountry, randMovie, randUser } from '@ngneat/falso';
import { Cycle, Event, ForumQuestion, RegistrationField, RegistrationFieldOption } from '../../db';

// Define types 
export type CycleData = Pick<Cycle, 'eventId' | 'startAt' | 'endAt' | 'status'>;
export type EventData = Pick<Event, 'name'>;
export type RegistrationFieldData = Pick<RegistrationField, 'name' | 'eventId' | 'type' | 'required' | 'forUser' | 'forGroup'>;
export type RegistrationFieldOptionData = Pick<RegistrationFieldOption, 'registrationFieldId' | 'value'>;
export type ForumQuestionData = Pick<ForumQuestion, 'cycleId' | 'questionTitle'>;


export function generateEventData(numEvents: number): EventData[] {
    const events: EventData[] = [];
    for (let i = 0; i < numEvents; i++) {
        events.push({ name: randCountry() });
    }
    return events;
  }

export function generateCycleData(numCycles: number, eventId: string): CycleData[] {
const cycles: CycleData[] = [];
const today = new Date();

for (let i = 0; i < numCycles; i++) {
    const startAt = new Date(today); 
    const endAt = new Date(startAt);
    endAt.setDate(startAt.getDate() + 1);

    cycles.push({
        startAt,
        endAt,
        status: 'OPEN',
        eventId,
    });
}

return cycles;
}

export function generateRegistrationFieldData(eventId: string, fields: Partial<RegistrationFieldData>[] = []): RegistrationFieldData[] {
    return fields.map(field => ({
      name: field.name || 'Untitled Field',
      type: field.type || 'TEXT',
      required: field.required !== undefined ? field.required : false,
      eventId,
      forUser: field.forUser !== undefined ? field.forUser : false,
      forGroup: field.forGroup !== undefined ? field.forGroup : false,
    }));
  }

  export function generateRegistrationFieldOptionsData(
    registrationFieldId: string,
    options: string[]
  ): RegistrationFieldOptionData[] {
    return options.map(option => ({
      registrationFieldId,
      value: option,
    }));
  }

  export function generateForumQuestionData(cycleId: string, questionTitles: string[]): ForumQuestionData[] {
    return questionTitles.map(questionTitle => ({
      cycleId,
      questionTitle,
    }));
  }
