import { generateRegistrationFieldData, generateRegistrationFieldOptionsData } from "./db/seed-data-generators";

const customFields = [
    { name: 'proposal title', type: 'TEXT', required: true, forGroup: true },
    { name: 'proposal description', type: 'TEXT', required: true, forUser: true },
    { name: 'other field', type: 'TEXT', required: false },
    { name: 'select field', type: 'SELECT', required: false, forUser: true },
  ];

const generatedFields = generateRegistrationFieldData("eventId", customFields);

const options = ['Option A', 'Option B'];
const registrationFieldOptions = generateRegistrationFieldOptionsData("registrationFieldId", options);
  